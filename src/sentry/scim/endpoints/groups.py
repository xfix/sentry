import logging
from uuid import uuid4

from django.db import IntegrityError, transaction
from rest_framework import serializers, status
from rest_framework.response import Response

from sentry.api.bases.organization import OrganizationEndpoint
from sentry.api.bases.team import TeamEndpoint
from sentry.models import (
    AuditLogEntryEvent,
    OrganizationMember,
    OrganizationMemberTeam,
    Team,
    TeamStatus,
)
from sentry.signals import team_created
from sentry.tasks.deletion import delete_team

from .users import ScimEndpoint
from .utils import parse_filter_conditions

delete_logger = logging.getLogger("sentry.deletions.api")


CONFLICTING_SLUG_ERROR = "A team with this slug already exists."

SCIM_API_LIST = "urn:ietf:params:scim:api:messages:2.0:ListResponse"
SCIM_SCHEMA_GROUP = "urn:ietf:params:scim:schemas:core:2.0:Group"
# OrganizationMemberTeam.objects.create(team=team, organizationmember=member)


class OrganizationScimGroupIndex(OrganizationEndpoint, ScimEndpoint):
    def get(self, request, organization):
        # if request.auth and hasattr(request.auth, "project"):
        #     return Response(status=403)

        queryset = Team.objects.filter(
            organization=organization, status=TeamStatus.VISIBLE
        ).order_by("slug")

        # parsed_filter = parse_filter_conditions(request.GET.get("filter"))
        # if len(parsed_filter) > 0:
        #     filter_val = [parsed_filter[0][1]]
        # else:
        #     filter_val = [None]
        context = {
            "schemas": [SCIM_API_LIST],
            "totalResults": len(queryset),  # must be integer
            "startIndex": 1,  # must be integer
            "itemsPerPage": len(queryset),  # what's max?
            "Resources": [scim_group_response_serializer(team) for team in queryset],
        }
        return Response(context)

    def post(self, request, organization):
        """
        Create a new Team
        ``````````````````

        Create a new team bound to an organization.  Only the name of the
        team is needed to create it, the slug can be auto generated.

        :pparam string organization_slug: the slug of the organization the
                                          team should be created for.
        :param string name: the optional name of the team.
        :param string slug: the optional slug for this team.  If
                            not provided it will be auto generated from the
                            name.
        :auth: required
        """
        # {
        #     "schemas": ["urn:ietf:params:scim:schemas:core:2.0:Group"],
        #     "displayName": "Test SCIMv2",
        #     "members": []
        # }
        serializer = ScimGroupSerializer(data={"name": request.data["displayName"]})

        if serializer.is_valid():
            result = serializer.validated_data

            try:
                with transaction.atomic():
                    team = Team.objects.create(
                        name=result.get("name"),
                        organization=organization,
                    )
            except IntegrityError:
                return Response(
                    {
                        "non_field_errors": [CONFLICTING_SLUG_ERROR],
                        "detail": CONFLICTING_SLUG_ERROR,
                    },
                    status=409,
                )
            else:
                team_created.send_robust(
                    organization=organization, user=request.user, team=team, sender=self.__class__
                )

            self.create_audit_entry(
                request=request,
                organization=organization,
                target_object=team.id,
                event=AuditLogEntryEvent.TEAM_ADD,
                data=team.get_audit_log_data(),
            )

            return Response(scim_group_response_serializer(team), status=201)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrganizationScimGroupDetails(TeamEndpoint, ScimEndpoint):
    def get(self, request, team):
        # if request.auth and hasattr(request.auth, "project"):
        #     return Response(status=403)
        return Response(scim_group_response_serializer(team))

    def patch(self, request, team):
        # schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        for operation in request.data.get("Operations", []):
            if operation["op"] == "add" and operation["path"] == "members":
                for member in operation["value"]:
                    try:
                        om = OrganizationMember.objects.get(
                            organization=team.organization, id=member["value"]
                        )
                    except OrganizationMember.DoesNotExist:
                        pass
                    try:
                        with transaction.atomic():
                            OrganizationMemberTeam.objects.create(team=team, organizationmember=om)
                    except IntegrityError:
                        pass
            elif operation["op"] == "remove":
                parsed_filter = parse_filter_conditions(operation["path"])
                try:
                    om = OrganizationMember.objects.get(
                        organization=team.organization, id=parsed_filter[0][1]
                    )
                except OrganizationMember.DoesNotExist:
                    pass
                with transaction.atomic():
                    om.activate()
                    om.save()
            elif operation["op"] == "replace":
                # trycatch?
                serializer = TeamSerializer(
                    team,
                    data={"team_slug": team.slug, "name": operation["displayName"]},
                    partial=True,
                )
                if serializer.is_valid():
                    team = serializer.save()
                    self.create_audit_entry(
                        request=request,
                        organization=team.organization,
                        target_object=team.id,
                        event=AuditLogEntryEvent.TEAM_EDIT,
                        data=team.get_audit_log_data(),
                    )

        return Response(scim_group_response_serializer(team), 200)

    def delete(self, request, team):  # TODO: why was original sudo required?
        """
        Delete a Team
        `````````````

        Schedules a team for deletion.

        **Note:** Deletion happens asynchronously and therefore is not
        immediate.  However once deletion has begun the state of a project
        changes and will be hidden from most public views.
        """
        updated = Team.objects.filter(id=team.id, status=TeamStatus.VISIBLE).update(
            status=TeamStatus.PENDING_DELETION
        )
        if updated:
            transaction_id = uuid4().hex

            self.create_audit_entry(
                request=request,
                organization=team.organization,
                target_object=team.id,
                event=AuditLogEntryEvent.TEAM_REMOVE,
                data=team.get_audit_log_data(),
                transaction_id=transaction_id,
            )

            delete_team.apply_async(kwargs={"object_id": team.id, "transaction_id": transaction_id})

            delete_logger.info(
                "object.delete.queued",
                extra={
                    "object_id": team.id,
                    "transaction_id": transaction_id,
                    "model": type(team).__name__,
                },
            )

        return Response(status=204)


def scim_group_response_serializer(team, params=None):
    return {
        "schemas": [SCIM_SCHEMA_GROUP],
        "id": team.slug,
        "displayName": team.name,
        "members": [{"value": str(om.id), "display": "joshy"} for om in team.member_set],
        "meta": {"resourceType": "Group"},
    }


class ScimGroupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=64, required=True, allow_null=False, allow_blank=False)

    def validate(self, attrs):
        if not (attrs.get("name")):
            raise serializers.ValidationError("Name is required")
        return attrs


class TeamSerializer(serializers.ModelSerializer):
    slug = serializers.RegexField(r"^[a-z0-9_\-]+$", max_length=50)

    class Meta:
        model = Team
        fields = ("name", "slug")

    def validate_slug(self, value):
        qs = Team.objects.filter(slug=value, organization=self.instance.organization).exclude(
            id=self.instance.id
        )
        if qs.exists():
            raise serializers.ValidationError(f'The slug "{value}" is already in use.')
        return value
