import {DateTimeObject, getDiffInMinutes, TWO_WEEKS} from 'sentry/components/charts/utils';
import {t} from 'sentry/locale';
import {GlobalSelection, NewQuery, Organization} from 'sentry/types';
import {escapeDoubleQuotes} from 'sentry/utils';
import {getUtcDateString} from 'sentry/utils/dates';
import EventView from 'sentry/utils/discover/eventView';
import {getAggregateAlias, WebVital} from 'sentry/utils/discover/fields';
import {formatVersion} from 'sentry/utils/formatters';
import {QueryResults, stringifyQueryObject} from 'sentry/utils/tokenizeSearch';
import {WEB_VITAL_DETAILS} from 'sentry/views/performance/transactionVitals/constants';

import {EventType, YAxis} from './releaseChartControls';

export function getInterval(datetimeObj: DateTimeObject) {
  const diffInMinutes = getDiffInMinutes(datetimeObj);

  if (diffInMinutes > TWO_WEEKS) {
    return '6h';
  } else {
    return '1h';
  }
}

export function getReleaseEventView(
  selection: GlobalSelection,
  version: string,
  yAxis?: YAxis,
  eventType: EventType = EventType.ALL,
  vitalType: WebVital = WebVital.LCP,
  organization?: Organization,
  /**
   * Indicates that we're only interested in the current release.
   * This is useful for the event meta end point where we don't want
   * to include the other releases.
   */
  currentOnly?: boolean
): EventView {
  const {projects, environments, datetime} = selection;
  const {start, end, period} = datetime;
  const releaseFilter = currentOnly ? `release:${version}` : '';
  const toOther = `to_other(release,"${escapeDoubleQuotes(version)}",others,current)`;
  // this orderby ensures that the order is [others, current]
  const toOtherAlias = getAggregateAlias(toOther);

  const baseQuery: Omit<NewQuery, 'query'> = {
    id: undefined,
    version: 2,
    name: `${t('Release')} ${formatVersion(version)}`,
    fields: [`count()`, toOther],
    orderby: toOtherAlias,
    range: period,
    environment: environments,
    projects,
    start: start ? getUtcDateString(start) : undefined,
    end: end ? getUtcDateString(end) : undefined,
  };

  switch (yAxis) {
    case YAxis.FAILED_TRANSACTIONS:
      const statusFilters = ['ok', 'cancelled', 'unknown'].map(
        s => `!transaction.status:${s}`
      );
      return EventView.fromSavedQuery({
        ...baseQuery,
        query: stringifyQueryObject(
          new QueryResults(
            ['event.type:transaction', releaseFilter, ...statusFilters].filter(Boolean)
          )
        ),
      });
    case YAxis.COUNT_VITAL:
    case YAxis.COUNT_DURATION:
      const column = yAxis === YAxis.COUNT_DURATION ? 'transaction.duration' : vitalType;
      const threshold =
        yAxis === YAxis.COUNT_DURATION
          ? organization?.apdexThreshold
          : WEB_VITAL_DETAILS[vitalType].failureThreshold;
      return EventView.fromSavedQuery({
        ...baseQuery,
        query: stringifyQueryObject(
          new QueryResults(
            [
              'event.type:transaction',
              releaseFilter,
              threshold ? `${column}:>${threshold}` : '',
            ].filter(Boolean)
          )
        ),
      });
    case YAxis.EVENTS:
      const eventTypeFilter =
        eventType === EventType.ALL ? '' : `event.type:${eventType}`;
      return EventView.fromSavedQuery({
        ...baseQuery,
        query: stringifyQueryObject(
          new QueryResults([releaseFilter, eventTypeFilter].filter(Boolean))
        ),
      });
    default:
      return EventView.fromSavedQuery({
        ...baseQuery,
        fields: ['title', 'count()', 'event.type', 'issue', 'last_seen()'],
        query: stringifyQueryObject(
          new QueryResults([`release:${version}`, '!event.type:transaction'])
        ),
        orderby: '-last_seen',
      });
  }
}
