import React from 'react';
import {browserHistory} from 'react-router';
import {Location} from 'history';

import OptionSelector from 'sentry/components/charts/optionSelector';
import {
  ChartControls,
  InlineContainer,
  SectionHeading,
  SectionValue,
} from 'sentry/components/charts/styles';
import {Panel} from 'sentry/components/panels';
import {t} from 'sentry/locale';
import {OrganizationSummary, SelectValue} from 'sentry/types';
import EventView from 'sentry/utils/discover/eventView';
import {decodeScalar} from 'sentry/utils/queryString';
import {TransactionsListOption} from 'sentry/views/releases/detail/overview';
import {YAxis} from 'sentry/views/releases/detail/overview/chart/releaseChartControls';

import {ChartContainer} from '../styles';
import {TrendFunctionField} from '../trends/types';
import {TRENDS_FUNCTIONS} from '../trends/utils';

import DurationChart from './durationChart';
import DurationPercentileChart from './durationPercentileChart';
import LatencyChart from './latencyChart';
import TrendChart from './trendChart';
import VitalsChart from './vitalsChart';

export enum DisplayModes {
  DURATION_PERCENTILE = 'durationpercentile',
  DURATION = 'duration',
  LATENCY = 'latency',
  TREND = 'trend',
  VITALS = 'vitals',
}

const DISPLAY_OPTIONS: SelectValue<string>[] = [
  {value: DisplayModes.DURATION, label: t('Duration Breakdown')},
  {value: DisplayModes.DURATION_PERCENTILE, label: t('Duration Percentiles')},
  {value: DisplayModes.LATENCY, label: t('Latency Distribution')},
  {value: DisplayModes.TREND, label: t('Trends')},
  {value: DisplayModes.VITALS, label: t('Web Vitals')},
];

const TREND_OPTIONS: SelectValue<string>[] = TRENDS_FUNCTIONS.map(({field, label}) => ({
  value: field,
  label,
}));

type Props = {
  organization: OrganizationSummary;
  location: Location;
  eventView: EventView;
  totalValues: number | null;
};

class TransactionSummaryCharts extends React.Component<Props> {
  handleDisplayChange = (value: string) => {
    const {location} = this.props;
    browserHistory.push({
      pathname: location.pathname,
      query: {...location.query, display: value},
    });
  };

  handleTrendDisplayChange = (value: string) => {
    const {location} = this.props;
    browserHistory.push({
      pathname: location.pathname,
      query: {...location.query, trendDisplay: value},
    });
  };

  render() {
    const {totalValues, eventView, organization, location} = this.props;
    let display = decodeScalar(location.query.display) || DisplayModes.DURATION;
    let trendDisplay =
      decodeScalar(location.query.trendDisplay) || TrendFunctionField.P50;
    if (!Object.values(DisplayModes).includes(display as DisplayModes)) {
      display = DisplayModes.DURATION;
    }
    if (!Object.values(TrendFunctionField).includes(trendDisplay as TrendFunctionField)) {
      trendDisplay = TrendFunctionField.P50;
    }

    const releaseQueryExtra = {
      yAxis: display === DisplayModes.VITALS ? YAxis.COUNT_VITAL : YAxis.COUNT_DURATION,
      showTransactions:
        display === DisplayModes.VITALS
          ? TransactionsListOption.SLOW_LCP
          : display === DisplayModes.DURATION
          ? TransactionsListOption.SLOW
          : undefined,
    };

    return (
      <Panel>
        <ChartContainer>
          {display === DisplayModes.LATENCY && (
            <LatencyChart
              organization={organization}
              location={location}
              query={eventView.query}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
            />
          )}
          {display === DisplayModes.DURATION && (
            <DurationChart
              organization={organization}
              query={eventView.query}
              queryExtra={releaseQueryExtra}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
            />
          )}
          {display === DisplayModes.DURATION_PERCENTILE && (
            <DurationPercentileChart
              organization={organization}
              location={location}
              query={eventView.query}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
            />
          )}
          {display === DisplayModes.TREND && (
            <TrendChart
              trendDisplay={trendDisplay}
              organization={organization}
              query={eventView.query}
              queryExtra={releaseQueryExtra}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
            />
          )}
          {display === DisplayModes.VITALS && (
            <VitalsChart
              organization={organization}
              query={eventView.query}
              queryExtra={releaseQueryExtra}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
            />
          )}
        </ChartContainer>

        <ChartControls>
          <InlineContainer>
            <SectionHeading key="total-heading">{t('Total Transactions')}</SectionHeading>
            <SectionValue key="total-value">{calculateTotal(totalValues)}</SectionValue>
          </InlineContainer>
          <InlineContainer>
            {display === DisplayModes.TREND && (
              <OptionSelector
                title={t('Trend')}
                selected={trendDisplay}
                options={TREND_OPTIONS}
                onChange={this.handleTrendDisplayChange}
              />
            )}
            <OptionSelector
              title={t('Display')}
              selected={display}
              options={DISPLAY_OPTIONS}
              onChange={this.handleDisplayChange}
            />
          </InlineContainer>
        </ChartControls>
      </Panel>
    );
  }
}

function calculateTotal(total: number | null) {
  if (total === null) {
    return '\u2014';
  }
  return total.toLocaleString();
}

export default TransactionSummaryCharts;
