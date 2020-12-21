import React from 'react';
import {browserHistory, RouteComponentProps} from 'react-router';

import IdBadge from 'sentry/components/idBadge';
import {Team} from 'sentry/types';
import recreateRoute from 'sentry/utils/recreateRoute';
import withTeams from 'sentry/utils/withTeams';
import BreadcrumbDropdown from 'sentry/views/settings/components/settingsBreadcrumb/breadcrumbDropdown';
import MenuItem from 'sentry/views/settings/components/settingsBreadcrumb/menuItem';

import {RouteWithName} from './types';
import {CrumbLink} from '.';

type Props = RouteComponentProps<{teamId: string}, {}> & {
  teams: Team[];
  routes: RouteWithName[];
  route?: RouteWithName;
};

const TeamCrumb = ({teams, params, routes, route, ...props}: Props) => {
  const team = teams.find(({slug}) => slug === params.teamId);
  const hasMenu = teams.length > 1;

  if (!team) {
    return null;
  }

  return (
    <BreadcrumbDropdown
      name={
        <CrumbLink
          to={recreateRoute(route, {
            routes,
            params: {...params, teamId: team.slug},
          })}
        >
          <IdBadge avatarSize={18} team={team} />
        </CrumbLink>
      }
      onSelect={item => {
        browserHistory.push(
          recreateRoute('', {
            routes,
            params: {...params, teamId: item.value},
          })
        );
      }}
      hasMenu={hasMenu}
      route={route}
      items={teams.map((teamItem, index) => ({
        index,
        value: teamItem.slug,
        label: (
          <MenuItem>
            <IdBadge team={teamItem} />
          </MenuItem>
        ),
      }))}
      {...props}
    />
  );
};

export {TeamCrumb};
export default withTeams(TeamCrumb);
