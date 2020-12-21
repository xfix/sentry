import React from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import {withProfiler} from '@sentry/react';
import omit from 'lodash/omit';

import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import EventUserFeedback from 'sentry/components/events/userFeedback';
import CompactIssue from 'sentry/components/issues/compactIssue';
import LightWeightNoProjectMessage from 'sentry/components/lightWeightNoProjectMessage';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import GlobalSelectionHeader from 'sentry/components/organizations/globalSelectionHeader';
import PageHeading from 'sentry/components/pageHeading';
import Pagination from 'sentry/components/pagination';
import {Panel, PanelBody} from 'sentry/components/panels';
import {t} from 'sentry/locale';
import {PageContent} from 'sentry/styles/organization';
import space from 'sentry/styles/space';
import {Organization, UserReport} from 'sentry/types';
import withOrganization from 'sentry/utils/withOrganization';
import AsyncView from 'sentry/views/asyncView';

import UserFeedbackEmpty from './userFeedbackEmpty';
import {getQuery} from './utils';

type State = AsyncView['state'] & {
  reportList: UserReport[];
};

type Props = RouteComponentProps<{orgId: string}, {}> & {
  organization: Organization;
};

class OrganizationUserFeedback extends AsyncView<Props, State> {
  getEndpoints(): ReturnType<AsyncView['getEndpoints']> {
    const {
      organization,
      location: {search},
    } = this.props;

    return [
      [
        'reportList',
        `/organizations/${organization.slug}/user-feedback/`,
        {
          query: getQuery(search),
        },
      ],
    ];
  }

  getTitle() {
    return `${t('User Feedback')} - ${this.props.organization.slug}`;
  }

  get projectIds() {
    const {project} = this.props.location.query;

    return Array.isArray(project)
      ? project
      : typeof project === 'string'
      ? [project]
      : [];
  }

  renderResults() {
    const {orgId} = this.props.params;

    return (
      <div data-test-id="user-feedback-list">
        {this.state.reportList.map(item => {
          const issue = item.issue;
          return (
            <CompactIssue key={item.id} id={issue.id} data={issue} eventId={item.eventID}>
              <StyledEventUserFeedback report={item} orgId={orgId} issueId={issue.id} />
            </CompactIssue>
          );
        })}
      </div>
    );
  }

  renderEmpty() {
    return <UserFeedbackEmpty projectIds={this.projectIds} />;
  }

  renderLoading() {
    return this.renderBody();
  }

  renderStreamBody() {
    const {loading, reportList} = this.state;

    if (loading) {
      return <LoadingIndicator />;
    }

    if (!reportList.length) {
      return this.renderEmpty();
    }

    return this.renderResults();
  }

  renderBody() {
    const {organization} = this.props;
    const {location} = this.props;
    const {pathname, search, query} = location;
    const {status} = getQuery(search);
    const {reportListPageLinks} = this.state;

    const unresolvedQuery = omit(query, 'status');
    const allIssuesQuery = {...query, status: ''};

    return (
      <GlobalSelectionHeader>
        <PageContent>
          <LightWeightNoProjectMessage organization={organization}>
            <div data-test-id="user-feedback">
              <Header>
                <PageHeading>{t('User Feedback')}</PageHeading>
                <ButtonBar active={!Array.isArray(status) ? status || '' : ''} merged>
                  <Button
                    size="small"
                    barId="unresolved"
                    to={{pathname, query: unresolvedQuery}}
                  >
                    {t('Unresolved')}
                  </Button>
                  <Button size="small" barId="" to={{pathname, query: allIssuesQuery}}>
                    {t('All Issues')}
                  </Button>
                </ButtonBar>
              </Header>
              <Panel>
                <PanelBody className="issue-list">{this.renderStreamBody()}</PanelBody>
              </Panel>
              <Pagination pageLinks={reportListPageLinks} />
            </div>
          </LightWeightNoProjectMessage>
        </PageContent>
      </GlobalSelectionHeader>
    );
  }
}

export default withOrganization(withProfiler(OrganizationUserFeedback));

const Header = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${space(2)};
`;

const StyledEventUserFeedback = styled(EventUserFeedback)`
  margin: ${space(2)} 0 0;
`;
