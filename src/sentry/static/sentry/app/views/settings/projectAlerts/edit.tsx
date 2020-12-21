import React from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';

import PageHeading from 'sentry/components/pageHeading';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t} from 'sentry/locale';
import {PageContent, PageHeader} from 'sentry/styles/organization';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';
import BuilderBreadCrumbs from 'sentry/views/alerts/builder/builderBreadCrumbs';
import IncidentRulesDetails from 'sentry/views/settings/incidentRules/details';
import IssueEditor from 'sentry/views/settings/projectAlerts/issueEditor';

type RouteParams = {
  orgId: string;
  projectId: string;
  ruleId: string;
};

type Props = RouteComponentProps<RouteParams, {}> & {
  organization: Organization;
  project: Project;
  hasMetricAlerts: boolean;
};

type State = {
  alertType: string;
  ruleName: string;
};

class ProjectAlertsEditor extends React.Component<Props, State> {
  state: State = {
    alertType: '',
    ruleName: '',
  };

  handleChangeTitle = ruleName => {
    this.setState({ruleName});
  };

  getTitle() {
    const {ruleName} = this.state;
    const defaultTitle = t('Edit Alert Rule');

    if (!ruleName) {
      return defaultTitle;
    }

    const title = `${ruleName}`;

    return `${defaultTitle}: ${title}`;
  }

  render() {
    const {hasMetricAlerts, location, params, organization, project} = this.props;
    const {projectId} = params;
    const alertType = location.pathname.includes('/alerts/metric-rules/')
      ? 'metric'
      : 'issue';

    return (
      <React.Fragment>
        <SentryDocumentTitle title={this.getTitle()} objSlug={projectId} />
        <PageContent>
          <BuilderBreadCrumbs
            hasMetricAlerts={hasMetricAlerts}
            orgSlug={organization.slug}
            title={this.getTitle()}
          />
          <StyledPageHeader>
            <PageHeading>{this.getTitle()}</PageHeading>
          </StyledPageHeader>
          {(!hasMetricAlerts || alertType === 'issue') && (
            <IssueEditor
              {...this.props}
              project={project}
              onChangeTitle={this.handleChangeTitle}
            />
          )}
          {hasMetricAlerts && alertType === 'metric' && (
            <IncidentRulesDetails
              {...this.props}
              project={project}
              onChangeTitle={this.handleChangeTitle}
            />
          )}
        </PageContent>
      </React.Fragment>
    );
  }
}

const StyledPageHeader = styled(PageHeader)`
  margin-bottom: ${space(4)};
`;

export default ProjectAlertsEditor;
