import React from 'react';
import {browserHistory, RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/react';
import isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';

import {fetchSentryAppComponents} from 'sentry/actionCreators/sentryAppComponents';
import {Client} from 'sentry/api';
import GroupEventDetailsLoadingError from 'sentry/components/errors/groupEventDetailsLoadingError';
import EventEntries from 'sentry/components/events/eventEntries';
import {withMeta} from 'sentry/components/events/meta/metaProxy';
import GroupSidebar from 'sentry/components/group/sidebar';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import MutedBox from 'sentry/components/mutedBox';
import ReprocessedBox from 'sentry/components/reprocessedBox';
import ResolutionBox from 'sentry/components/resolutionBox';
import SentryTypes from 'sentry/sentryTypes';
import {
  Environment,
  Event,
  Group,
  GroupActivityReprocess,
  Organization,
  Project,
} from 'sentry/types';
import {metric} from 'sentry/utils/analytics';
import fetchSentryAppInstallations from 'sentry/utils/fetchSentryAppInstallations';

import GroupEventToolbar from '../eventToolbar';
import ReprocessingProgress from '../reprocessingProgress';
import {
  getEventEnvironment,
  getGroupMostRecentActivity,
  getGroupReprocessingStatus,
  ReprocessingStatus,
} from '../utils';

type Props = RouteComponentProps<
  {orgId: string; groupId: string; eventId?: string},
  {}
> & {
  api: Client;
  group: Group;
  project: Project;
  organization: Organization;
  environments: Environment[];
  loadingEvent: boolean;
  eventError: boolean;
  onRetry: () => void;
  event?: Event;
  className?: string;
};

type State = {
  eventNavLinks: string;
  releasesCompletion: any;
};

class GroupEventDetails extends React.Component<Props, State> {
  static propTypes = {
    api: PropTypes.object.isRequired,
    group: SentryTypes.Group.isRequired,
    project: SentryTypes.Project.isRequired,
    organization: SentryTypes.Organization.isRequired,
    environments: PropTypes.arrayOf(SentryTypes.Environment).isRequired,
  };

  state: State = {
    eventNavLinks: '',
    releasesCompletion: null,
  };

  componentDidMount() {
    this.fetchData();

    // First Meaningful Paint for /organizations/:orgId/issues/:groupId/
    metric.measure({
      name: 'app.page.perf.issue-details',
      start: 'page-issue-details-start',
      data: {
        // start_type is set on 'page-issue-details-start'
        org_id: parseInt(this.props.organization.id, 10),
        group: this.props.organization.features.includes('enterprise-perf')
          ? 'enterprise-perf'
          : 'control',
        milestone: 'first-meaningful-paint',
        is_enterprise: this.props.organization.features
          .includes('enterprise-orgs')
          .toString(),
        is_outlier: this.props.organization.features
          .includes('enterprise-orgs-outliers')
          .toString(),
      },
    });
  }

  componentDidUpdate(prevProps: Props) {
    const {environments, params, location, organization, project} = this.props;

    const environmentsHaveChanged = !isEqual(prevProps.environments, environments);

    // If environments are being actively changed and will no longer contain the
    // current event's environment, redirect to latest
    if (
      environmentsHaveChanged &&
      prevProps.event &&
      params.eventId &&
      !['latest', 'oldest'].includes(params.eventId)
    ) {
      const shouldRedirect =
        environments.length > 0 &&
        !environments.find(
          env => env.name === getEventEnvironment(prevProps.event as Event)
        );

      if (shouldRedirect) {
        browserHistory.replace({
          pathname: `/organizations/${params.orgId}/issues/${params.groupId}/`,
          query: location.query,
        });
        return;
      }
    }

    if (
      prevProps.organization.slug !== organization.slug ||
      prevProps.project.slug !== project.slug
    ) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    const {api} = this.props;
    api.clear();
  }

  fetchData = async () => {
    const {api, project, organization} = this.props;
    const orgSlug = organization.slug;
    const projSlug = project.slug;
    const projectId = project.id;

    /**
     * Perform below requests in parallel
     */
    const releasesCompletionPromise = api.requestPromise(
      `/projects/${orgSlug}/${projSlug}/releases/completion/`
    );
    fetchSentryAppInstallations(api, orgSlug);

    // TODO(marcos): Sometimes GlobalSelectionStore cannot pick a project.
    if (projectId) {
      fetchSentryAppComponents(api, orgSlug, projectId);
    } else {
      Sentry.withScope(scope => {
        scope.setExtra('props', this.props);
        scope.setExtra('state', this.state);
        Sentry.captureMessage('Project ID was not set');
      });
    }

    const releasesCompletion = await releasesCompletionPromise;
    this.setState({releasesCompletion});
  };

  get showExampleCommit() {
    const {project} = this.props;
    const {releasesCompletion} = this.state;
    return (
      project?.isMember &&
      project?.firstEvent &&
      releasesCompletion?.some(({step, complete}) => step === 'commit' && !complete)
    );
  }

  renderContent(eventWithMeta?: Event) {
    const {
      group,
      project,
      organization,
      environments,
      location,
      loadingEvent,
      onRetry,
      eventError,
    } = this.props;

    if (loadingEvent) {
      return <LoadingIndicator />;
    }

    if (eventError) {
      return (
        <GroupEventDetailsLoadingError environments={environments} onRetry={onRetry} />
      );
    }

    return (
      <EventEntries
        group={group}
        event={eventWithMeta}
        organization={organization}
        project={project}
        location={location}
        showExampleCommit={this.showExampleCommit}
      />
    );
  }
  render() {
    const {
      className,
      group,
      project,
      organization,
      environments,
      location,
      event,
    } = this.props;

    const eventWithMeta = withMeta(event) as Event;

    // reprocessing
    const hasReprocessingV2Feature = project.features?.includes('reprocessing-v2');
    const {activity: activities, count} = group;
    const groupCount = Number(count);
    const mostRecentActivity = getGroupMostRecentActivity(activities);
    const reprocessStatus = getGroupReprocessingStatus(group, mostRecentActivity);

    return (
      <div className={className}>
        <div className="event-details-container">
          {hasReprocessingV2Feature &&
          reprocessStatus === ReprocessingStatus.REPROCESSING &&
          group.status === 'reprocessing' ? (
            <ReprocessingProgress
              totalEvents={(mostRecentActivity as GroupActivityReprocess).data.eventCount}
              pendingEvents={group.statusDetails.pendingEvents}
            />
          ) : (
            <React.Fragment>
              <div className="primary">
                {eventWithMeta && (
                  <GroupEventToolbar
                    group={group}
                    event={eventWithMeta}
                    orgId={organization.slug}
                    location={location}
                  />
                )}
                {group.status === 'ignored' && (
                  <MutedBox statusDetails={group.statusDetails} />
                )}
                {group.status === 'resolved' && (
                  <ResolutionBox
                    statusDetails={group.statusDetails}
                    projectId={project.id}
                  />
                )}
                {hasReprocessingV2Feature &&
                  (reprocessStatus === ReprocessingStatus.REPROCESSED_AND_HASNT_EVENT ||
                    reprocessStatus === ReprocessingStatus.REPROCESSED_AND_HAS_EVENT) && (
                    <ReprocessedBox
                      reprocessActivity={mostRecentActivity as GroupActivityReprocess}
                      groupCount={groupCount}
                      orgSlug={organization.slug}
                    />
                  )}
                {this.renderContent(eventWithMeta)}
              </div>
              <div className="secondary">
                <GroupSidebar
                  organization={organization}
                  project={project}
                  group={group}
                  event={eventWithMeta}
                  environments={environments}
                />
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

export default styled(GroupEventDetails)`
  display: flex;
  flex: 1;
  flex-direction: column;
`;
