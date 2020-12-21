import React from 'react';

import ErrorBoundary from 'sentry/components/errorBoundary';
import ExceptionContent from 'sentry/components/events/interfaces/exceptionContent';
import RawExceptionContent from 'sentry/components/events/interfaces/rawExceptionContent';
import {Event, ExceptionType, PlatformType, Project} from 'sentry/types';
import {STACK_TYPE, STACK_VIEW} from 'sentry/types/stacktrace';

type Props = {
  stackView: STACK_VIEW;
  stackType: STACK_TYPE;
  projectId: Project['id'];
  event: Event;
  newestFirst: boolean;
  platform: PlatformType;
} & Pick<ExceptionType, 'values'>;

const Exception = ({
  stackView,
  stackType,
  projectId,
  values,
  event,
  newestFirst,
  platform = 'other',
}: Props) => (
  <ErrorBoundary mini>
    {stackView === STACK_VIEW.RAW ? (
      <RawExceptionContent
        eventId={event.id}
        projectId={projectId}
        type={stackType}
        values={values}
        platform={platform}
      />
    ) : (
      <ExceptionContent
        type={stackType}
        stackView={stackView}
        values={values}
        platform={platform}
        newestFirst={newestFirst}
        event={event}
      />
    )}
  </ErrorBoundary>
);

export default Exception;
