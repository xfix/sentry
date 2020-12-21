import React from 'react';
import {RouteComponentProps} from 'react-router';

import {fetchOrgMembers} from 'sentry/actionCreators/members';
import {Client} from 'sentry/api';
import Alert from 'sentry/components/alert';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {t} from 'sentry/locale';
import {Organization, Project} from 'sentry/types';
import Projects from 'sentry/utils/projects';
import withApi from 'sentry/utils/withApi';

type Props = RouteComponentProps<RouteParams, {}> & {
  organization: Organization;
  api: Client;
  children?: React.ReactNode;
  hasMetricAlerts: boolean;
};

type RouteParams = {
  projectId: string;
};

function AlertBuilderProjectProvider(props: Props) {
  const {children, params, organization, api, ...other} = props;
  const {projectId} = params;
  return (
    <Projects orgId={organization.slug} slugs={[projectId]}>
      {({projects, initiallyLoaded, isIncomplete}) => {
        if (!initiallyLoaded) {
          return <LoadingIndicator />;
        }
        // if loaded, but project fetching states incomplete, project doesn't exist
        if (isIncomplete) {
          return (
            <Alert type="warning">
              {t('The project you were looking for was not found.')}
            </Alert>
          );
        }
        const project = projects[0] as Project;

        // fetch members list for mail action fields
        fetchOrgMembers(api, organization.slug, [project.id]);

        return (
          <React.Fragment>
            {children && React.isValidElement(children)
              ? React.cloneElement(children, {
                  ...other,
                  ...children.props,
                  project,
                  organization,
                })
              : children}
          </React.Fragment>
        );
      }}
    </Projects>
  );
}

export default withApi(AlertBuilderProjectProvider);
