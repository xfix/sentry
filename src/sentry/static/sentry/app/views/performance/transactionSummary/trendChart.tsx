import React from 'react';
import * as ReactRouter from 'react-router';
import {browserHistory} from 'react-router';
import {Location, Query} from 'history';

import {Client} from 'sentry/api';
import ChartZoom from 'sentry/components/charts/chartZoom';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import EventsRequest from 'sentry/components/charts/eventsRequest';
import LineChart from 'sentry/components/charts/lineChart';
import ReleaseSeries from 'sentry/components/charts/releaseSeries';
import TransitionChart from 'sentry/components/charts/transitionChart';
import TransparentLoadingMask from 'sentry/components/charts/transparentLoadingMask';
import {getInterval, getSeriesSelection} from 'sentry/components/charts/utils';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import {OrganizationSummary} from 'sentry/types';
import {getUtcToLocalDateObject} from 'sentry/utils/dates';
import {axisLabelFormatter, tooltipFormatter} from 'sentry/utils/discover/charts';
import EventView from 'sentry/utils/discover/eventView';
import getDynamicText from 'sentry/utils/getDynamicText';
import {decodeScalar} from 'sentry/utils/queryString';
import theme from 'sentry/utils/theme';
import withApi from 'sentry/utils/withApi';

import {HeaderTitleLegend} from '../styles';
import {transformEventStatsSmoothed} from '../trends/utils';

const QUERY_KEYS = [
  'environment',
  'project',
  'query',
  'start',
  'end',
  'statsPeriod',
] as const;

type ViewProps = Pick<EventView, typeof QUERY_KEYS[number]>;

type Props = ReactRouter.WithRouterProps &
  ViewProps & {
    api: Client;
    location: Location;
    organization: OrganizationSummary;
    queryExtra: Query;
    trendDisplay: string;
  };

const YAXIS_VALUES = [
  'p50()',
  'p75()',
  'p95()',
  'p99()',
  'p100()',
  'avg(transaction.duration)',
];

class TrendChart extends React.Component<Props> {
  handleLegendSelectChanged = legendChange => {
    const {location} = this.props;
    const {selected} = legendChange;
    const unselected = Object.keys(selected).filter(key => !selected[key]);

    const to = {
      ...location,
      query: {
        ...location.query,
        trendsUnselectedSeries: unselected,
      },
    };
    browserHistory.push(to);
  };

  render() {
    const {
      api,
      project,
      environment,
      location,
      organization,
      query,
      statsPeriod,
      router,
      trendDisplay,
      queryExtra,
    } = this.props;

    const start = this.props.start ? getUtcToLocalDateObject(this.props.start) : null;
    const end = this.props.end ? getUtcToLocalDateObject(this.props.end) : null;
    const utc = decodeScalar(router.location.query.utc) !== 'false';

    const legend = {
      right: 10,
      top: 0,
      icon: 'circle',
      itemHeight: 8,
      itemWidth: 8,
      itemGap: 12,
      align: 'left',
      textStyle: {
        verticalAlign: 'top',
        fontSize: 11,
        fontFamily: 'Rubik',
      },
      selected: getSeriesSelection(location, 'trendsUnselectedSeries'),
    };

    const datetimeSelection = {
      start,
      end,
      period: statsPeriod,
    };

    const chartOptions = {
      grid: {
        left: '10px',
        right: '10px',
        top: '40px',
        bottom: '0px',
      },
      seriesOptions: {
        showSymbol: false,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: value => tooltipFormatter(value, 'p50()'),
      },
      yAxis: {
        min: 0,
        axisLabel: {
          color: theme.chartLabel,
          // p50() coerces the axis to be time based
          formatter: (value: number) => axisLabelFormatter(value, 'p50()'),
        },
      },
    };

    return (
      <React.Fragment>
        <HeaderTitleLegend>
          {t('Trend')}
          <QuestionTooltip
            size="sm"
            position="top"
            title={t(`Trends shows the smoothed value of an aggregate over time.`)}
          />
        </HeaderTitleLegend>
        <ChartZoom
          router={router}
          period={statsPeriod}
          projects={project}
          environments={environment}
        >
          {zoomRenderProps => (
            <EventsRequest
              api={api}
              organization={organization}
              period={statsPeriod}
              project={project}
              environment={environment}
              start={start}
              end={end}
              interval={getInterval(datetimeSelection, true)}
              showLoading={false}
              query={query}
              includePrevious={false}
              yAxis={YAXIS_VALUES}
            >
              {({results: _results, errored, loading, reloading}) => {
                if (errored) {
                  return (
                    <ErrorPanel>
                      <IconWarning color="gray300" size="lg" />
                    </ErrorPanel>
                  );
                }

                const results = _results?.filter(r => r.seriesName === trendDisplay);

                const series = results
                  ? results
                      .map(values => {
                        return {
                          ...values,
                          color: theme.purple300,
                          lineStyle: {
                            opacity: 0.75,
                            width: 1,
                          },
                        };
                      })
                      .reverse()
                  : [];

                const {smoothedResults} = transformEventStatsSmoothed(
                  results,
                  t('Smoothed')
                );

                const smoothedSeries = smoothedResults
                  ? smoothedResults.map(values => {
                      return {
                        ...values,
                        color: theme.purple300,
                        lineStyle: {
                          opacity: 1,
                        },
                      };
                    })
                  : [];

                // Stack the toolbox under the legend.
                // so all series names are clickable.
                zoomRenderProps.toolBox.z = -1;

                return (
                  <ReleaseSeries
                    start={start}
                    end={end}
                    queryExtra={queryExtra}
                    period={statsPeriod}
                    utc={utc}
                    projects={project}
                    environments={environment}
                  >
                    {({releaseSeries}) => (
                      <TransitionChart loading={loading} reloading={reloading}>
                        <TransparentLoadingMask visible={reloading} />
                        {getDynamicText({
                          value: (
                            <LineChart
                              {...zoomRenderProps}
                              {...chartOptions}
                              legend={legend}
                              onLegendSelectChanged={this.handleLegendSelectChanged}
                              series={[...series, ...smoothedSeries, ...releaseSeries]}
                            />
                          ),
                          fixed: 'Trend Chart',
                        })}
                      </TransitionChart>
                    )}
                  </ReleaseSeries>
                );
              }}
            </EventsRequest>
          )}
        </ChartZoom>
      </React.Fragment>
    );
  }
}

export default withApi(ReactRouter.withRouter(TrendChart));
