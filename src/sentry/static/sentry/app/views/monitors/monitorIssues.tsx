import React from 'react';

import IssueList from 'sentry/components/issueList';
import {t} from 'sentry/locale';

import {Monitor} from './types';

type Props = {
  orgId: string;
  monitor: Monitor;
};

const MonitorIssues = ({orgId, monitor}: Props) => (
  <IssueList
    endpoint={`/organizations/${orgId}/issues/`}
    query={{
      query: 'monitor.id:"' + monitor.id + '"',
      project: monitor.project.id,
      limit: 5,
    }}
    statsPeriod="0"
    pagination={false}
    emptyText={t('No issues found')}
    showActions={false}
    noBorder
    noMargin
    params={{orgId}}
  />
);

export default MonitorIssues;
