import React from 'react';

import ErrorBoundary from 'sentry/components/errorBoundary';
import KeyValueList from 'sentry/components/events/interfaces/keyValueList/keyValueListV2';
import {KeyValueListData} from 'sentry/components/events/interfaces/keyValueList/types';

type Props = {
  data: Array<KeyValueListData>;
  raw?: boolean;
};

const ContextBlock = ({data, raw = false}: Props) => {
  if (data.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary mini>
      <KeyValueList data={data} raw={raw} isContextData />
    </ErrorBoundary>
  );
};

export default ContextBlock;
