import React from 'react';
import {RouteComponentProps} from 'react-router';

import {loadStats} from 'sentry/actionCreators/projects';
import {Client} from 'sentry/api';
import {Organization, Team} from 'sentry/types';
import {sortArray} from 'sentry/utils';
import withApi from 'sentry/utils/withApi';
import withOrganization from 'sentry/utils/withOrganization';
import withTeams from 'sentry/utils/withTeams';

import OrganizationTeams from './organizationTeams';

type Props = {
  api: Client;
  organization: Organization;
  teams: Team[];
} & RouteComponentProps<{orgId: string}, {}>;

class OrganizationTeamsContainer extends React.Component<Props> {
  componentDidMount() {
    this.fetchStats();
  }

  fetchStats() {
    loadStats(this.props.api, {
      orgId: this.props.params.orgId,
      query: {
        since: (new Date().getTime() / 1000 - 3600 * 24).toString(),
        stat: 'generated',
        group: 'project',
      },
    });
  }

  render() {
    const {organization, teams} = this.props;

    if (!organization) {
      return null;
    }
    const allTeams = sortArray(teams, team => team.name);
    const activeTeams = allTeams.filter(team => team.isMember);

    return (
      <OrganizationTeams
        {...this.props}
        access={new Set(organization.access)}
        features={new Set(organization.features)}
        organization={organization}
        allTeams={allTeams}
        activeTeams={activeTeams}
      />
    );
  }
}

export {OrganizationTeamsContainer};

export default withApi(withOrganization(withTeams(OrganizationTeamsContainer)));
