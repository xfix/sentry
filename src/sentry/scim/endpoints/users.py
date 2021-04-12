from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _
from rest_framework import serializers, status
from rest_framework.response import Response

from sentry.api.bases.organization import OrganizationEndpoint, OrganizationPermission
from sentry.api.paginator import OffsetPaginator
from sentry.api.serializers import serialize
from sentry.api.serializers.models import team as team_serializers
from sentry.models import (
    AuditLogEntryEvent,
    InviteStatus,
    OrganizationMember,
    OrganizationMemberTeam,
    Team,
    TeamStatus,
)
from sentry.search.utils import tokenize_query
from sentry.signals import team_created

SCIM_API_ERROR = "urn:ietf:params:scim:api:messages:2.0:Error"
SCIM_API_LIST = "urn:ietf:params:scim:api:messages:2.0:ListResponse"
# SCIM_API_SEARCH = "urn:ietf:params:scim:api:messages:2.0:SearchRequest"
SCIM_API_PATCH = "urn:ietf:params:scim:api:messages:2.0:PatchOp"
# SCIM_API_BULK_REQUEST = "urn:ietf:params:scim:api:messages:2.0:BulkRequest"
# SCIM_API_BULK_RESPONSE = "urn:ietf:params:scim:api:messages:2.0:BulkResponse"

SCIM_SCHEMA_USER = "urn:ietf:params:scim:schemas:core:2.0:User"
SCIM_SCHEMA_USER_ENTERPRISE = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
SCIM_SCHEMA_GROUP = "urn:ietf:params:scim:schemas:core:2.0:Group"


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
        return Response({})


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
