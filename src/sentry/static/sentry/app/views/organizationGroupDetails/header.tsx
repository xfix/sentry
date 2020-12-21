import React from 'react';
import styled from '@emotion/styled';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';

import {fetchOrgMembers} from 'sentry/actionCreators/members';
import {Client} from 'sentry/api';
import AssigneeSelector from 'sentry/components/assigneeSelector';
import GuideAnchor from 'sentry/components/assistant/guideAnchor';
import Badge from 'sentry/components/badge';
import Count from 'sentry/components/count';
import EventOrGroupTitle from 'sentry/components/eventOrGroupTitle';
import EventAnnotation from 'sentry/components/events/eventAnnotation';
import EventMessage from 'sentry/components/events/eventMessage';
import ProjectBadge from 'sentry/components/idBadge/projectBadge';
import ExternalLink from 'sentry/components/links/externalLink';
import Link from 'sentry/components/links/link';
import ListLink from 'sentry/components/links/listLink';
import NavTabs from 'sentry/components/navTabs';
import SeenByList from 'sentry/components/seenByList';
import ShortId from 'sentry/components/shortId';
import Tooltip from 'sentry/components/tooltip';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import space from 'sentry/styles/space';
import {Group, Project} from 'sentry/types';
import {getMessage} from 'sentry/utils/events';
import withApi from 'sentry/utils/withApi';

import GroupActions from './actions';
import UnhandledTag, {TagAndMessageWrapper} from './unhandledTag';
import {getGroupReprocessingStatus, ReprocessingStatus} from './utils';

const TAB = {
  DETAILS: 'details',
  ACTIVITY: 'activity',
  USER_FEEDBACK: 'user-feedback',
  ATTACHMENTS: 'attachments',
  TAGS: 'tags',
  EVENTS: 'events',
  MERGED: 'merged',
  SIMILAR_ISSUES: 'similar-issues',
};

type Props = {
  currentTab: string;
  baseUrl: string;
  group: Group;
  project: Project;
  api: Client;
};

type MemberList = NonNullable<
  React.ComponentProps<typeof AssigneeSelector>['memberList']
>;

type State = {
  memberList?: MemberList;
};

class GroupHeader extends React.Component<Props, State> {
  static contextTypes = {
    location: PropTypes.object,
    organization: SentryTypes.Organization,
  };

  state: State = {};

  componentDidMount() {
    const {organization} = this.context;
    const {group, api} = this.props;
    const {project} = group;

    fetchOrgMembers(api, organization.slug, [project.id]).then(memberList => {
      const users = memberList.map(member => member.user);
      this.setState({memberList: users});
    });
  }

  render() {
    const {project, group, currentTab, baseUrl} = this.props;
    const {organization, location} = this.context;
    const projectFeatures = new Set(project ? project.features : []);
    const organizationFeatures = new Set(organization ? organization.features : []);
    const userCount = group.userCount;

    const hasReprocessingV2Feature = organizationFeatures.has('reprocessing-v2');
    const hasSimilarView = projectFeatures.has('similarity-view');
    const hasEventAttachments = organizationFeatures.has('event-attachments');

    // Reprocessing
    const reprocessingStatus = getGroupReprocessingStatus(group);
    const hasGroupBeenReprocessedAndHasntEvent =
      hasReprocessingV2Feature &&
      reprocessingStatus === ReprocessingStatus.REPROCESSED_AND_HASNT_EVENT;
    const isGroupBeingReprocessing =
      hasReprocessingV2Feature && reprocessingStatus === ReprocessingStatus.REPROCESSING;

    let className = 'group-detail';

    if (group.isBookmarked) {
      className += ' isBookmarked';
    }

    if (group.hasSeen) {
      className += ' hasSeen';
    }

    if (group.status === 'resolved') {
      className += ' isResolved';
    }

    const {memberList} = this.state;
    const orgId = organization.slug;
    const message = getMessage(group);

    const searchTermWithoutQuery = omit(location.query, 'query');
    const eventRouteToObject = {
      pathname: `${baseUrl}events/`,
      query: searchTermWithoutQuery,
    };

    return (
      <div className={className}>
        <div className="row">
          <div className="col-sm-7">
            <h3>
              <EventOrGroupTitle hasGuideAnchor data={group} />
            </h3>
            <StyledTagAndMessageWrapper>
              {group.isUnhandled && <UnhandledTag />}
              <EventMessage
                message={message}
                level={group.level}
                annotations={
                  <React.Fragment>
                    {group.logger && (
                      <EventAnnotationWithSpace>
                        <Link
                          to={{
                            pathname: `/organizations/${orgId}/issues/`,
                            query: {query: 'logger:' + group.logger},
                          }}
                        >
                          {group.logger}
                        </Link>
                      </EventAnnotationWithSpace>
                    )}
                    {group.annotations.map((annotation, i) => (
                      <EventAnnotationWithSpace
                        key={i}
                        dangerouslySetInnerHTML={{__html: annotation}}
                      />
                    ))}
                  </React.Fragment>
                }
              />
            </StyledTagAndMessageWrapper>
          </div>

          <div className="col-sm-5 stats">
            <div className="flex flex-justify-right">
              {group.shortId && (
                <GuideAnchor target="issue_number" position="bottom">
                  <div className="short-id-box count align-right">
                    <h6 className="nav-header">
                      <Tooltip
                        className="help-link"
                        title={t(
                          'This identifier is unique across your organization, and can be used to reference an issue in various places, like commit messages.'
                        )}
                        position="bottom"
                      >
                        <ExternalLink href="https://docs.sentry.io/learn/releases/#resolving-issues-via-commits">
                          {t('Issue #')}
                        </ExternalLink>
                      </Tooltip>
                    </h6>
                    <ShortId
                      shortId={group.shortId}
                      avatar={
                        <StyledProjectBadge project={project} avatarSize={20} hideName />
                      }
                    />
                  </div>
                </GuideAnchor>
              )}
              <div className="count align-right m-l-1">
                <h6 className="nav-header">{t('Events')}</h6>
                {isGroupBeingReprocessing ? (
                  <Count className="count" value={group.count} />
                ) : (
                  <Link to={eventRouteToObject}>
                    <Count className="count" value={group.count} />
                  </Link>
                )}
              </div>
              <div className="count align-right m-l-1">
                <h6 className="nav-header">{t('Users')}</h6>
                {userCount !== 0 ? (
                  isGroupBeingReprocessing ? (
                    <Count className="count" value={userCount} />
                  ) : (
                    <Link to={`${baseUrl}tags/user/${location.search}`}>
                      <Count className="count" value={userCount} />
                    </Link>
                  )
                ) : (
                  <span>0</span>
                )}
              </div>
              <div className="assigned-to m-l-1">
                <h6 className="nav-header">{t('Assignee')}</h6>
                <AssigneeSelector
                  id={group.id}
                  memberList={memberList}
                  disabled={isGroupBeingReprocessing}
                />
              </div>
            </div>
          </div>
        </div>
        <SeenByList
          seenBy={group.seenBy}
          iconTooltip={t('People who have viewed this issue')}
        />
        <GroupActions
          group={group}
          project={project}
          disabled={isGroupBeingReprocessing}
        />
        <NavTabs>
          <ListLink
            to={`${baseUrl}${location.search}`}
            isActive={() => currentTab === TAB.DETAILS}
            disabled={hasGroupBeenReprocessedAndHasntEvent}
          >
            {t('Details')}
          </ListLink>
          <ListLink
            to={`${baseUrl}activity/${location.search}`}
            isActive={() => currentTab === TAB.ACTIVITY}
            disabled={isGroupBeingReprocessing}
          >
            {t('Activity')} <Badge text={group.numComments} />
          </ListLink>
          <ListLink
            to={`${baseUrl}feedback/${location.search}`}
            isActive={() => currentTab === TAB.USER_FEEDBACK}
            disabled={isGroupBeingReprocessing}
          >
            {t('User Feedback')} <Badge text={group.userReportCount} />
          </ListLink>
          {hasEventAttachments && (
            <ListLink
              to={`${baseUrl}attachments/${location.search}`}
              isActive={() => currentTab === TAB.ATTACHMENTS}
              disabled={isGroupBeingReprocessing || hasGroupBeenReprocessedAndHasntEvent}
            >
              {t('Attachments')}
            </ListLink>
          )}
          <ListLink
            to={`${baseUrl}tags/${location.search}`}
            isActive={() => currentTab === TAB.TAGS}
            disabled={isGroupBeingReprocessing || hasGroupBeenReprocessedAndHasntEvent}
          >
            {t('Tags')}
          </ListLink>
          <ListLink
            to={eventRouteToObject}
            isActive={() => currentTab === 'events'}
            disabled={isGroupBeingReprocessing || hasGroupBeenReprocessedAndHasntEvent}
          >
            {t('Events')}
          </ListLink>
          <ListLink
            to={`${baseUrl}merged/${location.search}`}
            isActive={() => currentTab === TAB.MERGED}
            disabled={isGroupBeingReprocessing || hasGroupBeenReprocessedAndHasntEvent}
          >
            {t('Merged Issues')}
          </ListLink>
          {hasSimilarView && (
            <ListLink
              to={`${baseUrl}similar/${location.search}`}
              isActive={() => currentTab === TAB.SIMILAR_ISSUES}
              disabled={isGroupBeingReprocessing || hasGroupBeenReprocessedAndHasntEvent}
            >
              {t('Similar Issues')}
            </ListLink>
          )}
        </NavTabs>
      </div>
    );
  }
}

export {GroupHeader, TAB};

export default withApi(GroupHeader);

const StyledTagAndMessageWrapper = styled(TagAndMessageWrapper)`
  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    margin-bottom: ${space(2)};
  }
`;

const StyledProjectBadge = styled(ProjectBadge)`
  flex-shrink: 0;
`;

const EventAnnotationWithSpace = styled(EventAnnotation)`
  margin-left: ${space(1)};
`;
