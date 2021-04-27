from django.conf import settings
from django.db import transaction
from django.db.models import Q
from rest_framework.response import Response

from sentry import roles
from sentry.api.bases.organization import Endpoint, OrganizationEndpoint
from sentry.api.endpoints.organization_member_index import OrganizationMemberSerializer
from sentry.app import locks
from sentry.models import (
    AuditLogEntryEvent,
    InviteStatus,
    OrganizationMember,
    OrganizationMemberState,
    OrganizationMemberTeam,
)
from sentry.signals import member_invited
from sentry.utils.retries import TimedRetryPolicy

from .utils import parse_filter_conditions

SCIM_API_ERROR = "urn:ietf:params:scim:api:messages:2.0:Error"
SCIM_API_LIST = "urn:ietf:params:scim:api:messages:2.0:ListResponse"
SCIM_API_PATCH = "urn:ietf:params:scim:api:messages:2.0:PatchOp"
SCIM_SCHEMA_USER = "urn:ietf:params:scim:schemas:core:2.0:User"

DEFAULT_INVITE_ROLE = roles.get_default()  # can use auth provider default role

from rest_framework.negotiation import BaseContentNegotiation


class IgnoreClientContentNegotiation(BaseContentNegotiation):
    def select_parser(self, request, parsers):
        """
        Select the first parser in the `.parser_classes` list.
        """
        return parsers[0]

    def select_renderer(self, request, renderers, format_suffix):
        """
        Select the first renderer in the `.renderer_classes` list.
        """
        return (renderers[0], renderers[0].media_type)


class ScimEndpoint(Endpoint):
    content_negotiation_class = IgnoreClientContentNegotiation


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


def scim_user_response_serializer(om, params=None):
    return {
        "schemas": [SCIM_SCHEMA_USER],
        "id": om.id,
        "userName": om.email,
        # "name": om.user.name,  # we dont collect first / last name, so return st here.
        "emails": [{"primary": True, "value": om.email, "type": "work"}],
        # "displayName": om.user.name,
        # "locale": language, # we are mapping to OM, not user, not sure if okta will care about langauge
        "externalId": params.get("externalId") if params else None,
        "active": om.state != OrganizationMemberState.INACTIVE.value,
        "meta": {"resourceType": "User"},
    }


class OrganizationScimUserDetails(OrganizationEndpoint, ScimEndpoint):
    def get(self, request, organization, member_id):
        try:
            om = OrganizationMember.objects.get(organization=organization, id=member_id)
        except OrganizationMember.DoesNotExist:
            pass
        return Response(scim_user_response_serializer(om, request.data), 200)

    def patch(self, request, organization, member_id):
        try:
            om = OrganizationMember.objects.get(organization=organization, id=member_id)
        except OrganizationMember.DoesNotExist:
            pass

        for operation in request.data.get("Operations", []):
            if operation["value"]["active"] is False:
                with transaction.atomic():
                    om.deactivate()
                    om.save()
            elif operation["value"]["active"] is True:
                # this only happens after deactivion
                with transaction.atomic():
                    om.activate()
                    om.save()

        return Response(scim_user_response_serializer(om, request.data), 200)


class OrganizationScimUserIndex(OrganizationEndpoint, ScimEndpoint):
    def get(self, request, organization):
        # TODO: implement pagination for user getting
        # startIndex = request.GET.get("startIndex")
        # count = request.GET.get("count")

        parsed_filter = parse_filter_conditions(request.GET.get("filter"))

        if len(parsed_filter) > 0:
            filter_val = [parsed_filter[0][1]]
        else:
            filter_val = [None]
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

        context = {
            "schemas": [SCIM_API_LIST],
            "totalResults": len(queryset),  # must be integer
            "startIndex": 1,  # must be integer
            "itemsPerPage": len(queryset),  # what's max?
            "Resources": [scim_user_response_serializer(om) for om in queryset],
        }
        return Response(context)

    def post(self, request, organization):
        # what to do about the role? # use option specified in saml settings
        serializer = OrganizationMemberSerializer(
            data={"email": request.data.get("userName"), "role": DEFAULT_INVITE_ROLE.id},
            context={
                "organization": organization,
                "allowed_roles": [DEFAULT_INVITE_ROLE],
                "allow_existing_invite_request": True,
            },
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=409)

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
            # TODO: what does this do?
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

        return Response(scim_user_response_serializer(om, request.data), status=201)
