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
    OrganizationMember,
    OrganizationMemberTeam,
    Team,
    TeamStatus,
)
from sentry.search.utils import tokenize_query
from sentry.signals import team_created


class OrganizationScimUserDetails(OrganizationEndpoint):
    # what would permissions be?

    # GET /scim/v2/Users?filter=userName%20eq%20%22test.user%40okta.local%22&startIndex=1&count=100 HTTP/1.1
    def get(self, request, organization):
        req_filter = request.GET.get("filter")
        startIndex = request.GET.get("startIndex")
        count = request.GET.get("count")

        parsed_filter = parse_filter_conditions(req_filter)

        print(parsed_filter)
        return Response({})

    def post(self, request, organization):
        pass


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
