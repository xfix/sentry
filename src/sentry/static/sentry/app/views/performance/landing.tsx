import React from 'react';
import {browserHistory, InjectedRouter} from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';
import isEqual from 'lodash/isEqual';

import {updateDateTime} from 'sentry/actionCreators/globalSelection';
import {loadOrganizationTags} from 'sentry/actionCreators/tags';
import {Client} from 'sentry/api';
import Feature from 'sentry/components/acl/feature';
import Alert from 'sentry/components/alert';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import LightWeightNoProjectMessage from 'sentry/components/lightWeightNoProjectMessage';
import GlobalSelectionHeader from 'sentry/components/organizations/globalSelectionHeader';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {ALL_ACCESS_PROJECTS} from 'sentry/constants/globalSelectionHeader';
import {IconFlag} from 'sentry/icons';
import {t} from 'sentry/locale';
import {PageContent} from 'sentry/styles/organization';
import space from 'sentry/styles/space';
import {GlobalSelection, Organization, Project} from 'sentry/types';
import {trackAnalyticsEvent} from 'sentry/utils/analytics';
import EventView from 'sentry/utils/discover/eventView';
import {generateAggregateFields} from 'sentry/utils/discover/fields';
import {decodeScalar} from 'sentry/utils/queryString';
import {
  QueryResults,
  stringifyQueryObject,
  tokenizeSearch,
} from 'sentry/utils/tokenizeSearch';
import withApi from 'sentry/utils/withApi';
import withGlobalSelection from 'sentry/utils/withGlobalSelection';
import withOrganization from 'sentry/utils/withOrganization';
import withProjects from 'sentry/utils/withProjects';
import SearchBar from 'sentry/views/events/searchBar';

import Charts from './charts/index';
import TrendsContent from './trends/content';
import {
  DEFAULT_MAX_DURATION,
  DEFAULT_TRENDS_STATS_PERIOD,
  modifyTrendsViewDefaultPeriod,
} from './trends/utils';
import {DEFAULT_STATS_PERIOD, generatePerformanceEventView} from './data';
import Onboarding from './onboarding';
import Table from './table';
import {addRoutePerformanceContext, getTransactionSearchQuery} from './utils';
import VitalsCards from './vitalsCards';

export enum FilterViews {
  ALL_TRANSACTIONS = 'ALL_TRANSACTIONS',
  TRENDS = 'TRENDS',
}

type Props = {
  api: Client;
  organization: Organization;
  selection: GlobalSelection;
  location: Location;
  router: InjectedRouter;
  projects: Project[];
  loadingProjects: boolean;
  demoMode?: boolean;
};

type State = {
  eventView: EventView;
  error: string | undefined;
};

function isStatsPeriodDefault(
  statsPeriod: string | undefined,
  defaultPeriod: string
): boolean {
  return !statsPeriod || defaultPeriod === statsPeriod;
}

class PerformanceLanding extends React.Component<Props, State> {
  static getDerivedStateFromProps(nextProps: Props, prevState: State): State {
    return {
      ...prevState,
      eventView: generatePerformanceEventView(nextProps.organization, nextProps.location),
    };
  }

  state: State = {
    eventView: generatePerformanceEventView(this.props.organization, this.props.location),
    error: undefined,
  };

  componentDidMount() {
    const {api, organization, selection} = this.props;
    loadOrganizationTags(api, organization.slug, selection);
    addRoutePerformanceContext(selection);
    trackAnalyticsEvent({
      eventKey: 'performance_views.overview.view',
      eventName: 'Performance Views: Transaction overview view',
      organization_id: parseInt(organization.id, 10),
    });
  }

  componentDidUpdate(prevProps: Props) {
    const {api, organization, selection} = this.props;
    if (
      !isEqual(prevProps.selection.projects, selection.projects) ||
      !isEqual(prevProps.selection.datetime, selection.datetime)
    ) {
      loadOrganizationTags(api, organization.slug, selection);
      addRoutePerformanceContext(selection);
    }
  }

  renderError() {
    const {error} = this.state;

    if (!error) {
      return null;
    }

    return (
      <Alert type="error" icon={<IconFlag size="md" />}>
        {error}
      </Alert>
    );
  }

  setError = (error: string | undefined) => {
    this.setState({error});
  };

  handleSearch = (searchQuery: string) => {
    const {location, organization} = this.props;

    trackAnalyticsEvent({
      eventKey: 'performance_views.overview.search',
      eventName: 'Performance Views: Transaction overview search',
      organization_id: parseInt(organization.id, 10),
    });

    browserHistory.push({
      pathname: location.pathname,
      query: {
        ...location.query,
        cursor: undefined,
        query: String(searchQuery).trim() || undefined,
      },
    });
  };

  getViewLabel(currentView: FilterViews): string {
    switch (currentView) {
      case FilterViews.ALL_TRANSACTIONS:
        return t('By Transaction');
      case FilterViews.TRENDS:
        return t('By Trend');
      default:
        throw Error(`Unknown view: ${currentView}`);
    }
  }

  /**
   * Generate conditions to forward to the summary views.
   *
   * We drop the bare text string as in this view we apply it to
   * the transaction name, and that condition is redundant in the
   * summary view.
   */
  getSummaryConditions(query: string) {
    const parsed = tokenizeSearch(query);
    parsed.query = [];

    return stringifyQueryObject(parsed);
  }

  getCurrentView(): string {
    const {location} = this.props;
    const currentView = location.query.view as FilterViews;
    if (Object.values(FilterViews).includes(currentView)) {
      return currentView;
    }
    return FilterViews.ALL_TRANSACTIONS;
  }

  handleViewChange(viewKey: FilterViews) {
    const {location, organization} = this.props;

    const newQuery = {
      ...location.query,
    };

    const query = decodeScalar(location.query.query) || '';
    const statsPeriod = decodeScalar(location.query.statsPeriod);
    const conditions = tokenizeSearch(query);

    const currentView = location.query.view;

    const newDefaultPeriod =
      viewKey === FilterViews.TRENDS ? DEFAULT_TRENDS_STATS_PERIOD : DEFAULT_STATS_PERIOD;

    const hasStartAndEnd = newQuery.start && newQuery.end;

    if (!hasStartAndEnd && isStatsPeriodDefault(statsPeriod, newDefaultPeriod)) {
      /**
       * Resets stats period to default of the tab you are navigating to
       * on tab change as tabs have different default periods.
       */
      updateDateTime({
        start: null,
        end: null,
        utc: false,
        period: newDefaultPeriod,
      });
    }

    trackAnalyticsEvent({
      eventKey: 'performance_views.change_view',
      eventName: 'Performance Views: Change View',
      organization_id: parseInt(organization.id, 10),
      view_name: viewKey,
    });

    if (viewKey === FilterViews.TRENDS) {
      const modifiedConditions = new QueryResults([]);

      if (conditions.hasTag('tpm()')) {
        modifiedConditions.setTagValues('tpm()', conditions.getTagValues('tpm()'));
      } else {
        modifiedConditions.setTagValues('tpm()', ['>0.01']);
      }
      if (conditions.hasTag('transaction.duration')) {
        modifiedConditions.setTagValues(
          'transaction.duration',
          conditions.getTagValues('transaction.duration')
        );
      } else {
        modifiedConditions.setTagValues('transaction.duration', [
          '>0',
          `<${DEFAULT_MAX_DURATION}`,
        ]);
      }
      newQuery.query = stringifyQueryObject(modifiedConditions);
    }

    const isNavigatingAwayFromTrends = viewKey !== FilterViews.TRENDS && currentView;

    if (isNavigatingAwayFromTrends) {
      // This stops errors from occurring when navigating to other views since we are appending aggregates to the trends view
      conditions.removeTag('tpm()');
      conditions.removeTag('transaction.duration');

      newQuery.query = stringifyQueryObject(conditions);
    }

    browserHistory.push({
      pathname: location.pathname,
      query: {...newQuery, view: viewKey},
    });
  }

  renderHeaderButtons() {
    const views: FilterViews[] = [FilterViews.ALL_TRANSACTIONS, FilterViews.TRENDS];
    return (
      <ButtonBar merged active={this.getCurrentView()}>
        {views.map(viewKey => (
          <Button
            key={viewKey}
            barId={viewKey}
            size="small"
            data-test-id={'landing-header-' + viewKey.toLowerCase()}
            onClick={() => this.handleViewChange(viewKey)}
          >
            {this.getViewLabel(viewKey)}
          </Button>
        ))}
      </ButtonBar>
    );
  }

  shouldShowOnboarding() {
    const {projects, demoMode} = this.props;
    const {eventView} = this.state;

    // XXX used by getsentry to bypass onboarding for the upsell demo state.
    if (demoMode) {
      return false;
    }

    if (projects.length === 0) {
      return false;
    }

    // Current selection is 'my projects' or 'all projects'
    if (eventView.project.length === 0 || eventView.project === [ALL_ACCESS_PROJECTS]) {
      return (
        projects.filter(p => p.firstTransactionEvent === false).length === projects.length
      );
    }

    // Any other subset of projects.
    return (
      projects.filter(
        p =>
          eventView.project.includes(parseInt(p.id, 10)) &&
          p.firstTransactionEvent === false
      ).length === eventView.project.length
    );
  }

  render() {
    const {organization, location, router, projects} = this.props;
    const currentView = this.getCurrentView();
    const isTrendsView = currentView === FilterViews.TRENDS;
    const eventView = isTrendsView
      ? modifyTrendsViewDefaultPeriod(this.state.eventView, location)
      : this.state.eventView;
    const showOnboarding = this.shouldShowOnboarding();
    const filterString = getTransactionSearchQuery(location, eventView.query);
    const summaryConditions = this.getSummaryConditions(filterString);

    return (
      <SentryDocumentTitle title={t('Performance')} objSlug={organization.slug}>
        <GlobalSelectionHeader
          defaultSelection={{
            datetime: {
              start: null,
              end: null,
              utc: false,
              period: isTrendsView ? DEFAULT_TRENDS_STATS_PERIOD : DEFAULT_STATS_PERIOD,
            },
          }}
        >
          <PageContent>
            <LightWeightNoProjectMessage organization={organization}>
              <StyledPageHeader>
                <div>{t('Performance')}</div>
                {!showOnboarding && <div>{this.renderHeaderButtons()}</div>}
              </StyledPageHeader>
              {this.renderError()}
              {showOnboarding ? (
                <Onboarding organization={organization} />
              ) : currentView === FilterViews.TRENDS ? (
                <TrendsContent
                  organization={organization}
                  location={location}
                  eventView={eventView}
                  setError={this.setError}
                />
              ) : (
                <div>
                  <StyledSearchBar
                    organization={organization}
                    projectIds={eventView.project}
                    query={filterString}
                    fields={generateAggregateFields(
                      organization,
                      [...eventView.fields, {field: 'tps()'}],
                      ['epm()', 'eps()']
                    )}
                    onSearch={this.handleSearch}
                  />
                  <Feature features={['performance-vitals-overview']}>
                    <VitalsCards
                      eventView={eventView}
                      organization={organization}
                      location={location}
                    />
                  </Feature>
                  <Charts
                    eventView={eventView}
                    organization={organization}
                    location={location}
                    router={router}
                  />
                  <Table
                    eventView={eventView}
                    projects={projects}
                    organization={organization}
                    location={location}
                    setError={this.setError}
                    summaryConditions={summaryConditions}
                  />
                </div>
              )}
            </LightWeightNoProjectMessage>
          </PageContent>
        </GlobalSelectionHeader>
      </SentryDocumentTitle>
    );
  }
}

export const StyledPageHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${p => p.theme.headerFontSize};
  color: ${p => p.theme.textColor};
  height: 40px;
  margin-bottom: ${space(1)};
`;

const StyledSearchBar = styled(SearchBar)`
  flex-grow: 1;
  margin-bottom: ${space(2)};
`;

export default withApi(
  withOrganization(withProjects(withGlobalSelection(PerformanceLanding)))
);
