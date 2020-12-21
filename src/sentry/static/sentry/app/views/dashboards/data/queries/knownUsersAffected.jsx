/**
 * Known affected users
 */
import {t} from 'sentry/locale';
import {OPERATOR} from 'sentry/views/discover/data';

const knownUsersAffectedQuery = {
  name: t('Known Users'),
  fields: [],
  conditions: [['user.email', OPERATOR.IS_NOT_NULL, null]],
  aggregations: [['uniq', 'user.email', 'Known Users']],
  limit: 2000,

  orderby: '-time',
  groupby: ['time'],
  rollup: 86400,
};

export default knownUsersAffectedQuery;
