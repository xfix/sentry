import React from 'react';

import ErrorBoundary from 'sentry/components/errorBoundary';
import rawStacktraceContent from 'sentry/components/events/interfaces/rawStacktraceContent';
import StacktraceContent from 'sentry/components/events/interfaces/stacktraceContent';
import {Event, PlatformType} from 'sentry/types';
import {STACK_VIEW, StacktraceType} from 'sentry/types/stacktrace';

type Props = {
  stackView: STACK_VIEW;
  stacktrace: StacktraceType;
  event: Event;
  newestFirst: boolean;
  platform: PlatformType;
};

const Stacktrace = ({stackView, stacktrace, event, newestFirst, platform}: Props) => (
  <ErrorBoundary mini>
    {stackView === STACK_VIEW.RAW ? (
      <pre className="traceback plain">
        {rawStacktraceContent(stacktrace, event.platform)}
      </pre>
    ) : (
      <StacktraceContent
        data={stacktrace}
        className="no-exception"
        includeSystemFrames={stackView === STACK_VIEW.FULL}
        platform={platform}
        event={event}
        newestFirst={newestFirst}
      />
    )}
  </ErrorBoundary>
);

export default Stacktrace;
