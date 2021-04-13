from django.db import IntegrityError, transaction
from django.db.models import Q
from django.conf import settings

from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers, status
from rest_framework.response import Response

from sentry.api.bases.organization import OrganizationEndpoint, OrganizationPermission
from sentry.api.paginator import OffsetPaginator
from sentry.api.serializers import serialize
from sentry.api.serializers.models import team as team_serializers
from sentry.app import locks
from sentry.utils.retries import TimedRetryPolicy

from sentry.api.endpoints.organization_member_index import OrganizationMemberSerializer

from sentry.models import (
    AuditLogEntryEvent,
    InviteStatus,
    OrganizationMember,
    OrganizationMemberTeam,
    Team,
    TeamStatus,
    UserOption,
)
from sentry.search.utils import tokenize_query
from sentry.signals import team_created, member_invited
from sentry import roles

SCIM_API_ERROR = "urn:ietf:params:scim:api:messages:2.0:Error"
SCIM_API_LIST = "urn:ietf:params:scim:api:messages:2.0:ListResponse"
# SCIM_API_SEARCH = "urn:ietf:params:scim:api:messages:2.0:SearchRequest"
SCIM_API_PATCH = "urn:ietf:params:scim:api:messages:2.0:PatchOp"
# SCIM_API_BULK_REQUEST = "urn:ietf:params:scim:api:messages:2.0:BulkRequest"
# SCIM_API_BULK_RESPONSE = "urn:ietf:params:scim:api:messages:2.0:BulkResponse"

SCIM_SCHEMA_USER = "urn:ietf:params:scim:schemas:core:2.0:User"
SCIM_SCHEMA_USER_ENTERPRISE = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
SCIM_SCHEMA_GROUP = "urn:ietf:params:scim:schemas:core:2.0:Group"

DEFAULT_INVITE_ROLE = roles.get_default()


@transaction.atomic
def save_team_assignments(organization_member, teams):
    # teams may be empty
    OrganizationMemberTeam.objects.filter(organizationmember=organization_member).delete()
    OrganizationMemberTeam.objects.bulk_create(
        [
            OrganizationMemberTeam(team=team, organizationmember=organization_member)
            for team in teams
        ]
    )


def scim_response_serializer(om, params):

    return {
        "schemas": [SCIM_SCHEMA_USER],
        "id": om.id,
        "userName": om.email,
        # "name": om.user.name,  # we dont collect first / last name, so return st here.
        "emails": [{"primary": True, "value": om.email, "type": "work"}],
        # "displayName": om.user.name,
        # "locale": language, # we are mapping to OM, not user, not sure if okta will care about langauge
        "externalId": params.get("externalId"),
        "active": True,  # user should be able to login, so this is correct
        "meta": {"resourceType": "User"},
    }


class OrganizationScimUserIndex(OrganizationEndpoint):
    # what would permissions be?

    # GET /scim/v2/Users?filter=userName%20eq%20%22test.user%40okta.local%22
    # &startIndex=1&count=100 HTTP/1.1
    def get(self, request, organization):
        req_filter = request.GET.get("filter")
        startIndex = request.GET.get("startIndex")
        count = request.GET.get("count")

        parsed_filter = parse_filter_conditions(req_filter)
        print(parsed_filter)
        filter_val = [parsed_filter[0][1]]
        print(filter_val)
        queryset = (
            OrganizationMember.objects.filter(
                Q(user__is_active=True) | Q(user__isnull=True),
                organization=organization,
                # invite_status=InviteStatus.APPROVED.value,
            )
            .select_related("user")
            .order_by("email", "user__email")
        )
        queryset = queryset.filter(
            Q(email__in=filter_val)
            | Q(user__email__in=filter_val)
            | Q(user__emails__email__in=filter_val)
        )

        print(queryset)

        context = {
            "schemas": [SCIM_API_LIST],
            "totalResults": 0,  # must be integer
            "startIndex": 1,  # must be integer
            "itemsPerPage": 0,  # must be integer
            "Resources": [],
        }
        return Response(context)

    def post(self, request, organization):
        # what to do about the role?
        print(request.POST)
        serializer = OrganizationMemberSerializer(
            data={"email": request.data.get("userName"), "role": DEFAULT_INVITE_ROLE.id},
            context={
                "organization": organization,
                "allowed_roles": [DEFAULT_INVITE_ROLE],
                "allow_existing_invite_request": True,
            },
        )
        if not serializer.is_valid():  # TODO: catch this and 409
            return Response(serializer.errors, status=400)

        result = serializer.validated_data
        with transaction.atomic():
            # remove any invitation requests for this email before inviting
            OrganizationMember.objects.filter(
                Q(invite_status=InviteStatus.REQUESTED_TO_BE_INVITED.value)
                | Q(invite_status=InviteStatus.REQUESTED_TO_JOIN.value),
                email=result["email"],
                organization=organization,
            ).delete()

            om = OrganizationMember(
                organization=organization,
                email=result["email"],
                role=result["role"],
                inviter=request.user,
            )

            if settings.SENTRY_ENABLE_INVITES:
                om.token = om.generate_token()
            om.save()

        if result["teams"]:
            lock = locks.get(f"org:member:{om.id}", duration=5)
            with TimedRetryPolicy(10)(lock.acquire):
                save_team_assignments(om, result["teams"])

        if settings.SENTRY_ENABLE_INVITES and result.get("sendInvite"):
            om.send_invite_email()
            member_invited.send_robust(
                member=om, user=request.user, sender=self, referrer=request.data.get("referrer")
            )

        self.create_audit_entry(
            request=request,
            organization_id=organization.id,
            target_object=om.id,
            data=om.get_audit_log_data(),
            event=AuditLogEntryEvent.MEMBER_INVITE
            if settings.SENTRY_ENABLE_INVITES
            else AuditLogEntryEvent.MEMBER_ADD,
        )

        return Response(scim_response_serializer(om, request.data), status=201)


def parse_filter_conditions(raw_filters):
    conditions = raw_filters.split(",")
    filters = []

    for c in conditions:
        [key, value] = c.split(" eq ")
        if not key or not value:
            continue

        key = key.strip()
        value = value.strip()

        # For USERS: Unique username should always be lowercase
        if key == "userName":
            value = value.lower()

        if value[0] == '"' and value[-1] == '"':
            value = value.replace('"', "")
        if value[0] == "'" and value[-1] == "'":
            value = value.replace("'", "")

        filters.append([key, value])

    return filters
