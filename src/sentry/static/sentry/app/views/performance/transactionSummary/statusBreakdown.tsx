import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import BreakdownBars from 'sentry/components/charts/breakdownBars';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import {SectionHeading} from 'sentry/components/charts/styles';
import EmptyStateWarning from 'sentry/components/emptyStateWarning';
import Placeholder from 'sentry/components/placeholder';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {LightWeightOrganization} from 'sentry/types';
import DiscoverQuery from 'sentry/utils/discover/discoverQuery';
import EventView from 'sentry/utils/discover/eventView';
import {getTermHelp} from 'sentry/views/performance/data';

type Props = {
  organization: LightWeightOrganization;
  location: Location;
  eventView: EventView;
};

function StatusBreakdown({eventView, location, organization}: Props) {
  const breakdownView = eventView
    .withColumns([
      {kind: 'function', function: ['count', '', '']},
      {kind: 'field', field: 'transaction.status'},
    ])
    .withSorts([{kind: 'desc', field: 'count'}]);

  return (
    <Container>
      <SectionHeading>
        {t('Status Breakdown')}
        <QuestionTooltip
          position="top"
          title={getTermHelp(organization, 'statusBreakdown')}
          size="sm"
        />
      </SectionHeading>
      <DiscoverQuery
        eventView={breakdownView}
        location={location}
        orgSlug={organization.slug}
      >
        {({isLoading, error, tableData}) => {
          if (isLoading) {
            return <Placeholder height="125px" />;
          }
          if (error) {
            return (
              <ErrorPanel height="125px">
                <IconWarning color="gray300" size="lg" />
              </ErrorPanel>
            );
          }
          if (!tableData || tableData.data.length === 0) {
            return <EmptyStateWarning small>{t('No data available')}</EmptyStateWarning>;
          }
          const points = tableData.data.map(row => ({
            label: String(row['transaction.status']),
            value: parseInt(String(row.count), 10),
          }));
          return <BreakdownBars data={points} />;
        }}
      </DiscoverQuery>
    </Container>
  );
}

export default StatusBreakdown;

const Container = styled('div')`
  margin-bottom: ${space(4)};
`;
