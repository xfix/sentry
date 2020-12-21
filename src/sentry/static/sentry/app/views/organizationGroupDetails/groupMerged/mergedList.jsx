import React from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import EmptyStateWarning from 'sentry/components/emptyStateWarning';
import Pagination from 'sentry/components/pagination';
import {Panel} from 'sentry/components/panels';
import QueryCount from 'sentry/components/queryCount';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';

import MergedItem from './mergedItem';
import MergedToolbar from './mergedToolbar';

class MergedList extends React.Component {
  static propTypes = {
    onUnmerge: PropTypes.func.isRequired,
    onToggleCollapse: PropTypes.func.isRequired,
    items: PropTypes.arrayOf(SentryTypes.Event),
    pageLinks: PropTypes.string,
    orgId: PropTypes.string.isRequired,
    project: SentryTypes.Project.isRequired,
  };

  renderEmpty = () => (
    <EmptyStateWarning>
      <p>{t("There don't seem to be any hashes for this issue.")}</p>
    </EmptyStateWarning>
  );

  render() {
    const {items, pageLinks, onToggleCollapse, onUnmerge, orgId, project} = this.props;
    const itemsWithLatestEvent = items.filter(({latestEvent}) => !!latestEvent);
    const hasResults = itemsWithLatestEvent.length > 0;

    if (!hasResults) {
      return <Panel>{this.renderEmpty()}</Panel>;
    }

    return (
      <div>
        <h2>
          <span>{t('Merged fingerprints with latest event')}</span>{' '}
          <QueryCount count={itemsWithLatestEvent.length} />
        </h2>

        <MergedToolbar
          onToggleCollapse={onToggleCollapse}
          onUnmerge={onUnmerge}
          orgId={orgId}
          project={project}
        />

        <MergedItems>
          {itemsWithLatestEvent.map(({id, latestEvent}) => (
            <MergedItem
              key={id}
              orgId={orgId}
              projectId={project.slug}
              disabled={items.length === 1}
              event={latestEvent}
              fingerprint={id}
            />
          ))}
        </MergedItems>

        <Pagination pageLinks={pageLinks} />
      </div>
    );
  }
}

export default MergedList;

const MergedItems = styled('div')`
  border: 1px solid ${p => p.theme.border};
  border-top: none;
`;
