import React from 'react';
import * as ReactRouter from 'react-router';
import styled from '@emotion/styled';
import isEqual from 'lodash/isEqual';

import {Client} from 'sentry/api';
import BarChart from 'sentry/components/charts/barChart';
import ChartZoom from 'sentry/components/charts/chartZoom';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import LineChart from 'sentry/components/charts/lineChart';
import TransitionChart from 'sentry/components/charts/transitionChart';
import TransparentLoadingMask from 'sentry/components/charts/transparentLoadingMask';
import {getSeriesSelection} from 'sentry/components/charts/utils';
import ErrorBoundary from 'sentry/components/errorBoundary';
import {Panel} from 'sentry/components/panels';
import Placeholder from 'sentry/components/placeholder';
import {IconDelete, IconEdit, IconGrabbable, IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {GlobalSelection, Organization} from 'sentry/types';
import {axisLabelFormatter, tooltipFormatter} from 'sentry/utils/discover/charts';
import {getAggregateArg, getMeasurementSlug} from 'sentry/utils/discover/fields';
import getDynamicText from 'sentry/utils/getDynamicText';
import theme from 'sentry/utils/theme';
import withApi from 'sentry/utils/withApi';
import withGlobalSelection from 'sentry/utils/withGlobalSelection';
import withOrganization from 'sentry/utils/withOrganization';

import {ChartContainer, HeaderTitleLegend} from '../performance/styles';

import {Widget} from './types';
import WidgetQueries from './widgetQueries';

type Props = ReactRouter.WithRouterProps & {
  api: Client;
  organization: Organization;
  isEditing: boolean;
  widget: Widget;
  selection: GlobalSelection;
  onDelete: () => void;
  onEdit: () => void;
};

type State = {
  hovering: boolean;
};

class WidgetCard extends React.Component<Props, State> {
  state: State = {
    hovering: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    if (
      !isEqual(nextProps.widget, this.props.widget) ||
      !isEqual(nextProps.selection, this.props.selection) ||
      nextState.hovering !== this.state.hovering
    ) {
      return true;
    }
    return false;
  }

  chartComponent(chartProps): React.ReactNode {
    const {widget} = this.props;

    switch (widget.displayType) {
      case 'bar':
        return <BarChart {...chartProps} />;
      case 'line':
      default:
        return <LineChart {...chartProps} />;
    }
  }

  renderVisual() {
    const {location, router, selection, api, organization, widget} = this.props;

    const statsPeriod = selection.datetime.period;
    const {start, end} = selection.datetime;
    const {projects, environments} = selection;

    const legend = {
      right: 10,
      top: 5,
      icon: 'circle',
      itemHeight: 8,
      itemWidth: 8,
      itemGap: 12,
      align: 'left',
      type: 'plain',
      textStyle: {
        verticalAlign: 'top',
        fontSize: 11,
        fontFamily: 'Rubik',
      },
      selected: getSeriesSelection(location),
      formatter: (seriesName: string) => {
        const arg = getAggregateArg(seriesName);
        if (arg !== null) {
          const slug = getMeasurementSlug(arg);
          if (slug !== null) {
            seriesName = slug.toUpperCase();
          }
        }
        return seriesName;
      },
    };

    const axisField = widget.queries[0]?.fields?.[0] ?? 'count()';
    const chartOptions = {
      grid: {
        left: '0px',
        right: '0px',
        top: '40px',
        bottom: '10px',
      },
      seriesOptions: {
        showSymbol: false,
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: tooltipFormatter,
      },
      yAxis: {
        axisLabel: {
          color: theme.chartLabel,
          formatter: (value: number) => axisLabelFormatter(value, axisField),
        },
      },
    };

    return (
      <ChartZoom
        router={router}
        period={statsPeriod}
        start={start}
        end={end}
        projects={projects}
        environments={environments}
      >
        {zoomRenderProps => {
          return (
            <WidgetQueries
              api={api}
              organization={organization}
              widget={widget}
              selection={selection}
            >
              {({results, error, loading}) => {
                if (error) {
                  return (
                    <ErrorPanel>
                      <IconWarning color="gray500" size="lg" />
                    </ErrorPanel>
                  );
                }

                const colors = results
                  ? theme.charts.getColorPalette(results.length - 2)
                  : [];

                // Create a list of series based on the order of the fields,
                const series = results
                  ? results.map((values, i: number) => ({
                      ...values,
                      color: colors[i],
                    }))
                  : [];

                // Stack the toolbox under the legend.
                // so all series names are clickable.
                zoomRenderProps.toolBox.z = -1;

                return (
                  <TransitionChart loading={loading} reloading={loading}>
                    <TransparentLoadingMask visible={loading} />
                    {getDynamicText({
                      value: this.chartComponent({
                        ...zoomRenderProps,
                        ...chartOptions,
                        legend,
                        series,
                      }),
                      fixed: 'Widget Chart',
                    })}
                  </TransitionChart>
                );
              }}
            </WidgetQueries>
          );
        }}
      </ChartZoom>
    );
  }

  renderEditPanel() {
    if (!this.state.hovering || !this.props.isEditing) {
      return null;
    }

    const {onEdit, onDelete} = this.props;

    return (
      <EditPanel>
        <IconContainer>
          <IconGrabbable color="gray500" size="lg" />
          <IconClick
            onClick={() => {
              onEdit();
            }}
          >
            <IconEdit color="gray500" size="lg" />
          </IconClick>
          <IconClick
            onClick={() => {
              onDelete();
            }}
          >
            <IconDelete color="gray500" size="lg" />
          </IconClick>
        </IconContainer>
      </EditPanel>
    );
  }

  render() {
    const {widget} = this.props;
    return (
      <ErrorBoundary
        customComponent={<ErrorCard>{t('Error loading widget data')}</ErrorCard>}
      >
        <StyledPanel
          onMouseLeave={() => {
            if (this.state.hovering) {
              this.setState({
                hovering: false,
              });
            }
          }}
          onMouseOver={() => {
            if (!this.state.hovering) {
              this.setState({
                hovering: true,
              });
            }
          }}
        >
          <ChartContainer>
            <HeaderTitleLegend>{widget.title}</HeaderTitleLegend>
            {this.renderVisual()}
            {this.renderEditPanel()}
          </ChartContainer>
        </StyledPanel>
      </ErrorBoundary>
    );
  }
}

export default withApi(
  withOrganization(withGlobalSelection(ReactRouter.withRouter(WidgetCard)))
);

const ErrorCard = styled(Placeholder)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.theme.alert.error.backgroundLight};
  border: 1px solid ${p => p.theme.alert.error.border};
  color: ${p => p.theme.alert.error.textLight};
  border-radius: ${p => p.theme.borderRadius};
  margin-bottom: ${space(2)};
`;

const StyledPanel = styled(Panel)`
  margin: 0;
`;

const EditPanel = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;

  width: 100%;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: rgba(255, 255, 255, 0.5);
`;

const IconContainer = styled('div')`
  display: flex;

  > * + * {
    margin-left: 50px;
  }
`;

const IconClick = styled('div')`
  &:hover {
    cursor: pointer;
  }
`;
