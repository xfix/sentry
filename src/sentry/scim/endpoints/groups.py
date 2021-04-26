from sentry.api.endpoints.organization_teams import OrganizationTeamsEndpoint
from sentry.api.endpoints.team_details import TeamDetailsEndpoint

from .users import ScimEndpoint


class OrganizationScimGroupIndex(OrganizationTeamsEndpoint, ScimEndpoint):
    def get(self, request, organization):
        return super().get(request, organization)

    def post(self, request, organization):
        return super().post(request, organization)


class OrganizationScimGroupDetails(TeamDetailsEndpoint, ScimEndpoint):
    def get(self, request, team):
        return super().get(request, team)
