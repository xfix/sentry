import React from 'react';

import MiniBarChart from 'sentry/components/charts/miniBarChart';
import LoadingError from 'sentry/components/loadingError';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import PageHeading from 'sentry/components/pageHeading';
import Pagination from 'sentry/components/pagination';
import {Panel, PanelBody, PanelHeader} from 'sentry/components/panels';
import {t} from 'sentry/locale';
import {PageContent} from 'sentry/styles/organization';
import {Organization, Project} from 'sentry/types';
import {Series} from 'sentry/types/echarts';
import PerformanceAlert from 'sentry/views/organizationStats/performanceAlert';
import ProjectTable from 'sentry/views/organizationStats/projectTable';
import {
  ProjectTableDataElement,
  ProjectTableLayout,
} from 'sentry/views/organizationStats/projectTableLayout';
import TextBlock from 'sentry/views/settings/components/text/textBlock';

import {OrgTotal, ProjectTotal} from './types';

type Props = {
  organization: Organization;
  statsLoading: boolean;
  projectsLoading: boolean;
  orgTotal: null | OrgTotal;
  statsError: null | boolean;
  orgSeries: null | Series[];
  projectMap: Record<string, Project>;
  projectTotals: null | ProjectTotal[];
  projectsError: null | boolean;
  pageLinks: null | string;
};

class OrganizationStats extends React.Component<Props> {
  renderContent() {
    const {
      statsLoading,
      orgTotal,
      statsError,
      orgSeries,
      projectsLoading,
      projectTotals,
      projectMap,
      projectsError,
      organization,
    } = this.props;

    const colors = orgSeries?.map(series => series.color || '');

    return (
      <div>
        <PageHeading withMargins>{t('Organization Stats')}</PageHeading>
        <div className="row">
          <div className="col-md-9">
            <TextBlock>
              {t(
                `The chart below reflects events the system has received
                across your entire organization. Events are broken down into
                three categories: Accepted, Rate Limited, and Filtered. Rate
                Limited events are entries that the system threw away due to quotas
                being hit, and Filtered events are events that were blocked
                due to your inbound data filter rules.`
              )}
            </TextBlock>
          </div>
          {orgTotal && (
            <div className="col-md-3 stats-column">
              <h6 className="nav-header">{t('Events per minute')}</h6>
              <p className="count">{orgTotal.avgRate}</p>
            </div>
          )}
        </div>
        <div>
          <PerformanceAlert />
          {statsLoading ? (
            <LoadingIndicator />
          ) : statsError ? (
            <LoadingError />
          ) : (
            <Panel>
              <PanelBody withPadding>
                <MiniBarChart
                  isGroupedByDate
                  showTimeInTooltip
                  labelYAxisExtents
                  stacked
                  height={150}
                  colors={colors}
                  series={orgSeries ?? undefined}
                />
              </PanelBody>
            </Panel>
          )}
        </div>

        <Panel>
          <PanelHeader>
            <ProjectTableLayout>
              <div>{t('Project')}</div>
              <ProjectTableDataElement>{t('Accepted')}</ProjectTableDataElement>
              <ProjectTableDataElement>{t('Rate Limited')}</ProjectTableDataElement>
              <ProjectTableDataElement>{t('Filtered')}</ProjectTableDataElement>
              <ProjectTableDataElement>{t('Total')}</ProjectTableDataElement>
            </ProjectTableLayout>
          </PanelHeader>
          <PanelBody>
            {!orgTotal || !projectTotals || statsLoading || projectsLoading ? (
              <LoadingIndicator />
            ) : projectsError ? (
              <LoadingError />
            ) : (
              <ProjectTable
                projectTotals={projectTotals}
                orgTotal={orgTotal}
                organization={organization}
                projectMap={projectMap}
              />
            )}
          </PanelBody>
        </Panel>
        {this.props.pageLinks && <Pagination {...this.props} />}
      </div>
    );
  }

  render() {
    return <PageContent>{this.renderContent()}</PageContent>;
  }
}

export default OrganizationStats;
