import React from 'react';
import styled from '@emotion/styled';

import {addLoadingMessage, clearIndicators} from 'sentry/actionCreators/indicator';
import {Client} from 'sentry/api';
import ActionLink from 'sentry/components/actions/actionLink';
import ResolveActions from 'sentry/components/actions/resolve';
import DropdownLink from 'sentry/components/dropdownLink';
import MenuItem from 'sentry/components/menuItem';
import Tooltip from 'sentry/components/tooltip';
import {IconEllipsis, IconIssues} from 'sentry/icons';
import {t} from 'sentry/locale';
import {GlobalSelection, Group, Project, Release, ResolutionStatus} from 'sentry/types';
import Projects from 'sentry/utils/projects';
import withApi from 'sentry/utils/withApi';

type Props = {
  api: Client;
  orgId: string;
  group: Group;
  selection: GlobalSelection;
  query?: string;
};

class GroupRowActions extends React.Component<Props> {
  handleUpdate = (data?: any) => {
    const {api, group, orgId, query, selection} = this.props;

    addLoadingMessage(t('Saving changes\u2026'));

    api.bulkUpdate(
      {
        orgId,
        itemIds: [group.id],
        data,
        query,
        project: selection.projects,
        environment: selection.environments,
        ...selection.datetime,
      },
      {
        complete: () => {
          clearIndicators();
        },
      }
    );
  };

  handleDelete = () => {
    const {api, group, orgId, query, selection} = this.props;

    addLoadingMessage(t('Removing events\u2026'));

    api.bulkDelete(
      {
        orgId,
        itemIds: [group.id],
        query,
        project: selection.projects,
        environment: selection.environments,
        ...selection.datetime,
      },
      {
        complete: () => {
          clearIndicators();
        },
      }
    );
  };

  render() {
    const {orgId, group} = this.props;

    return (
      <Wrapper>
        <Tooltip title={group.inbox ? t('Mark Reviewed') : null}>
          <ActionLink
            className="btn btn-default btn-sm"
            onAction={() => this.handleUpdate({inbox: false})}
            shouldConfirm={false}
            disabled={!group.inbox}
            title={t('Mark Reviewed')}
          >
            <IconIssues size="sm" color="gray300" />
          </ActionLink>
        </Tooltip>

        <StyledDropdownLink
          caret={false}
          className="btn btn-sm btn-default action-more"
          customTitle={<IconEllipsis size="sm" color="gray300" />}
          title=""
          anchorRight
        >
          <MenuItem noAnchor>
            <ActionLink
              className="action-resolve"
              onAction={() => this.handleUpdate({status: ResolutionStatus.RESOLVED})}
              shouldConfirm={false}
              title={t('Resolve')}
            >
              {t('Resolve')}
            </ActionLink>
          </MenuItem>
          <MenuItem divider />
          <MenuItem noAnchor>
            <Projects orgId={orgId} slugs={[group.project.slug]}>
              {({projects, initiallyLoaded, fetchError}) => {
                const project = projects[0];
                return (
                  <ResolveActions
                    hasRelease={
                      project.hasOwnProperty('features')
                        ? (project as Project).features.includes('releases')
                        : false
                    }
                    latestRelease={
                      project.hasOwnProperty('latestRelease')
                        ? ((project as Project).latestRelease as Release)
                        : undefined
                    }
                    orgId={orgId}
                    projectId={group.project.id}
                    onUpdate={this.handleUpdate}
                    shouldConfirm={false}
                    hasInbox
                    disabled={!!fetchError}
                    disableDropdown={!initiallyLoaded || !!fetchError}
                    projectFetchError={!!fetchError}
                  />
                );
              }}
            </Projects>
          </MenuItem>
          <MenuItem divider />
          <MenuItem noAnchor>
            <ActionLink
              className="action-delete"
              onAction={this.handleDelete}
              shouldConfirm={false}
              title={t('Delete')}
            >
              {t('Delete')}
            </ActionLink>
          </MenuItem>
        </StyledDropdownLink>
      </Wrapper>
    );
  }
}

const Wrapper = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const StyledDropdownLink = styled(DropdownLink)`
  display: flex;
  align-items: center;
  transition: none;
`;

export default withApi(GroupRowActions);
