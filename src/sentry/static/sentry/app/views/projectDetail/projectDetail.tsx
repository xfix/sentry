import React from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';

import Feature from 'sentry/components/acl/feature';
import Breadcrumbs from 'sentry/components/breadcrumbs';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import CreateAlertButton from 'sentry/components/createAlertButton';
import IdBadge from 'sentry/components/idBadge';
import * as Layout from 'sentry/components/layouts/thirds';
import LightWeightNoProjectMessage from 'sentry/components/lightWeightNoProjectMessage';
import GlobalSelectionHeader from 'sentry/components/organizations/globalSelectionHeader';
import TextOverflow from 'sentry/components/textOverflow';
import {IconSettings} from 'sentry/icons';
import {t} from 'sentry/locale';
import {PageContent} from 'sentry/styles/organization';
import {Organization, Project} from 'sentry/types';
import routeTitleGen from 'sentry/utils/routeTitle';
import AsyncView from 'sentry/views/asyncView';

import ProjectCharts from './projectCharts';
import ProjectIssues from './projectIssues';
import ProjectLatestAlerts from './projectLatestAlerts';
import ProjectLatestReleases from './projectLatestReleases';
import ProjectQuickLinks from './projectQuickLinks';
import ProjectScoreCards from './projectScoreCards';
import ProjectTeamAccess from './projectTeamAccess';

type RouteParams = {
  orgId: string;
  projectId: string;
};

type Props = RouteComponentProps<RouteParams, {}> & {
  organization: Organization;
};

type State = {
  project: Project | null;
} & AsyncView['state'];

class ProjectDetail extends AsyncView<Props, State> {
  getTitle() {
    const {params} = this.props;

    return routeTitleGen(t('Project %s', params.projectId), params.orgId, false);
  }

  getEndpoints(): ReturnType<AsyncView['getEndpoints']> {
    const {params} = this.props;

    if (this.state?.project) {
      return [];
    }

    return [['project', `/projects/${params.orgId}/${params.projectId}/`]];
  }

  renderLoading() {
    return this.renderBody();
  }

  renderBody() {
    const {organization, params, location, router} = this.props;
    const {project} = this.state;

    return (
      <GlobalSelectionHeader shouldForceProject forceProject={project}>
        <LightWeightNoProjectMessage organization={organization}>
          <StyledPageContent>
            <Layout.Header>
              <Layout.HeaderContent>
                <Breadcrumbs
                  crumbs={[
                    {
                      to: `/organizations/${params.orgId}/projects/`,
                      label: t('Projects'),
                    },
                    {label: t('Project Details')},
                  ]}
                />
                <Layout.Title>
                  <TextOverflow>
                    {project && (
                      <IdBadge
                        project={project}
                        avatarSize={28}
                        displayName={params.projectId}
                      />
                    )}
                  </TextOverflow>
                </Layout.Title>
              </Layout.HeaderContent>

              <Layout.HeaderActions>
                <ButtonBar gap={1}>
                  <Button
                    to={`/organizations/${params.orgId}/issues/?project=${params.projectId}`}
                  >
                    {t('View All Issues')}
                  </Button>
                  <CreateAlertButton
                    organization={organization}
                    projectSlug={params.projectId}
                  />
                  <Button
                    icon={<IconSettings />}
                    label={t('Settings')}
                    to={`/settings/${params.orgId}/projects/${params.projectId}/`}
                  />
                </ButtonBar>
              </Layout.HeaderActions>
            </Layout.Header>

            <Layout.Body>
              <Layout.Main>
                <ProjectScoreCards
                  organization={organization}
                  projectSlug={params.projectId}
                  projectId={project?.id}
                />
                {[0, 1].map(id => (
                  <ProjectCharts
                    location={location}
                    organization={organization}
                    router={router}
                    key={`project-charts-${id}`}
                    index={id}
                  />
                ))}
                <ProjectIssues organization={organization} location={location} />
              </Layout.Main>
              <Layout.Side>
                <ProjectTeamAccess organization={organization} project={project} />
                <Feature features={['incidents']}>
                  <ProjectLatestAlerts
                    organization={organization}
                    projectSlug={params.projectId}
                    location={location}
                  />
                </Feature>
                <ProjectLatestReleases
                  organization={organization}
                  projectSlug={params.projectId}
                  projectId={project?.id}
                  location={location}
                />
                <ProjectQuickLinks
                  organization={organization}
                  project={project}
                  location={location}
                />
              </Layout.Side>
            </Layout.Body>
          </StyledPageContent>
        </LightWeightNoProjectMessage>
      </GlobalSelectionHeader>
    );
  }
}

const StyledPageContent = styled(PageContent)`
  padding: 0;
`;

export default ProjectDetail;
