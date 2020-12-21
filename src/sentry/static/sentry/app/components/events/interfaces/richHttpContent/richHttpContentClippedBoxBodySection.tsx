import React from 'react';

import ClippedBox from 'sentry/components/clippedBox';
import ContextData from 'sentry/components/contextData';
import ErrorBoundary from 'sentry/components/errorBoundary';
import KeyValueList from 'sentry/components/events/interfaces/keyValueList/keyValueListV2';
import AnnotatedText from 'sentry/components/events/meta/annotatedText';
import {t} from 'sentry/locale';
import {Meta, RequestEntry} from 'sentry/types';
import {defined} from 'sentry/utils';

import getTransformedData from './getTransformedData';

type Props = {
  data: RequestEntry['data']['data'];
  inferredContentType: RequestEntry['data']['inferredContentType'];
  meta?: Meta;
};

const RichHttpContentClippedBoxBodySection = ({
  data: value,
  meta,
  inferredContentType,
}: Props) => {
  const getContent = () => {
    if (!defined(value)) {
      return null;
    }

    switch (inferredContentType) {
      case 'application/json':
        return (
          <ContextData
            data-test-id="rich-http-content-body-context-data"
            data={value}
            preserveQuotes
          />
        );
      case 'application/x-www-form-urlencoded':
      case 'multipart/form-data':
        return (
          <KeyValueList
            data-test-id="rich-http-content-body-key-value-list"
            data={getTransformedData(value).map(([key, v]) => ({
              key,
              subject: key,
              value: v,
              meta,
            }))}
            isContextData
          />
        );
      default:
        return (
          <pre data-test-id="rich-http-content-body-section-pre">
            <AnnotatedText
              value={value && JSON.stringify(value, null, 2)}
              meta={meta}
              data-test-id="rich-http-content-body-context-data"
            />
          </pre>
        );
    }
  };

  const content = getContent();

  return content ? (
    <ClippedBox title={t('Body')} defaultClipped>
      <ErrorBoundary mini>{content}</ErrorBoundary>
    </ClippedBox>
  ) : null;
};

export default RichHttpContentClippedBoxBodySection;
