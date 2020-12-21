import React from 'react';
import * as ReactRouter from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';

import {Client} from 'sentry/api';
import ChartZoom from 'sentry/components/charts/chartZoom';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import EventsRequest from 'sentry/components/charts/eventsRequest';
import LineChart from 'sentry/components/charts/lineChart';
import {SectionHeading} from 'sentry/components/charts/styles';
import TransitionChart from 'sentry/components/charts/transitionChart';
import TransparentLoadingMask from 'sentry/components/charts/transparentLoadingMask';
import {getInterval} from 'sentry/components/charts/utils';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {LightWeightOrganization} from 'sentry/types';
import {getUtcToLocalDateObject} from 'sentry/utils/dates';
import {tooltipFormatter} from 'sentry/utils/discover/charts';
import EventView from 'sentry/utils/discover/eventView';
import {
  formatAbbreviatedNumber,
  formatFloat,
  formatPercentage,
} from 'sentry/utils/formatters';
import {decodeScalar} from 'sentry/utils/queryString';
import theme from 'sentry/utils/theme';
import withApi from 'sentry/utils/withApi';
import {getTermHelp} from 'sentry/views/performance/data';

type Props = ReactRouter.WithRouterProps & {
  api: Client;
  organization: LightWeightOrganization;
  location: Location;
  eventView: EventView;
};

function SidebarCharts({api, eventView, organization, router}: Props) {
  const statsPeriod = eventView.statsPeriod;
  const start = eventView.start ? getUtcToLocalDateObject(eventView.start) : undefined;
  const end = eventView.end ? getUtcToLocalDateObject(eventView.end) : undefined;
  const utc = decodeScalar(router.location.query.utc) !== 'false';

  const colors = theme.charts.getColorPalette(3);
  const axisLineConfig = {
    scale: true,
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: false,
    },
  };
  const chartOptions = {
    height: 580,
    grid: [
      {
        top: '40px',
        left: '10px',
        right: '10px',
        height: '120px',
      },
      {
        top: '230px',
        left: '10px',
        right: '10px',
        height: '150px',
      },
      {
        top: '450px',
        left: '10px',
        right: '10px',
        height: '120px',
      },
    ],
    axisPointer: {
      // Link each x-axis together.
      link: [{xAxisIndex: [0, 1, 2]}],
    },
    xAxes: Array.from(new Array(3)).map((_i, index) => ({
      gridIndex: index,
      type: 'time',
      show: false,
    })),
    yAxes: [
      {
        // apdex
        gridIndex: 0,
        interval: 0.2,
        axisLabel: {
          formatter: (value: number) => formatFloat(value, 1),
          color: theme.chartLabel,
        },
        ...axisLineConfig,
      },
      {
        // failure rate
        gridIndex: 1,
        splitNumber: 4,
        interval: 0.5,
        max: 1.0,
        axisLabel: {
          formatter: (value: number) => formatPercentage(value, 0),
          color: theme.chartLabel,
        },
        ...axisLineConfig,
      },
      {
        // throughput
        gridIndex: 2,
        splitNumber: 4,
        axisLabel: {
          formatter: formatAbbreviatedNumber,
          color: theme.chartLabel,
        },
        ...axisLineConfig,
      },
    ],
    utc,
    isGroupedByDate: true,
    showTimeInTooltip: true,
    colors: [colors[0], colors[1], colors[2]],
    tooltip: {
      trigger: 'axis',
      truncate: 80,
      valueFormatter: tooltipFormatter,
      nameFormatter(value: string) {
        return value === 'epm()' ? 'tpm()' : value;
      },
    },
  };

  const datetimeSelection = {
    start: start || null,
    end: end || null,
    period: statsPeriod,
  };
  const project = eventView.project;
  const environment = eventView.environment;

  return (
    <RelativeBox>
      <ChartTitle top="0px" key="apdex">
        {t('Apdex')}
        <QuestionTooltip
          position="top"
          title={getTermHelp(organization, 'apdex')}
          size="sm"
        />
      </ChartTitle>

      <ChartTitle top="190px" key="failure-rate">
        {t('Failure Rate')}
        <QuestionTooltip
          position="top"
          title={getTermHelp(organization, 'failureRate')}
          size="sm"
        />
      </ChartTitle>

      <ChartTitle top="410px" key="throughput">
        {t('TPM')}
        <QuestionTooltip
          position="top"
          title={getTermHelp(organization, 'tpm')}
          size="sm"
        />
      </ChartTitle>

      <ChartZoom
        router={router}
        period={statsPeriod}
        projects={project}
        environments={environment}
        xAxisIndex={[0, 1, 2]}
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
            interval={getInterval(datetimeSelection)}
            showLoading={false}
            query={eventView.query}
            includePrevious={false}
            yAxis={[`apdex(${organization.apdexThreshold})`, 'failure_rate()', 'epm()']}
          >
            {({results, errored, loading, reloading}) => {
              if (errored) {
                return (
                  <ErrorPanel>
                    <IconWarning color="gray300" size="lg" />
                  </ErrorPanel>
                );
              }
              const series = results
                ? results.map((values, i: number) => ({
                    ...values,
                    yAxisIndex: i,
                    xAxisIndex: i,
                  }))
                : [];

              return (
                <TransitionChart loading={loading} reloading={reloading} height="550px">
                  <TransparentLoadingMask visible={reloading} />
                  <LineChart {...zoomRenderProps} {...chartOptions} series={series} />
                </TransitionChart>
              );
            }}
          </EventsRequest>
        )}
      </ChartZoom>
    </RelativeBox>
  );
}

const RelativeBox = styled('div')`
  position: relative;
  margin-bottom: ${space(1)};
`;

const ChartTitle = styled(SectionHeading)<{top: string}>`
  background: ${p => p.theme.background};
  position: absolute;
  top: ${p => p.top};
  margin: 0;
  z-index: 1;
`;

export default withApi(ReactRouter.withRouter(SidebarCharts));
