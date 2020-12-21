import {trimPackage} from 'sentry/components/events/interfaces/frame/utils';
import {Event, Frame} from 'sentry/types';
import {Thread} from 'sentry/types/events';

import getRelevantFrame from './getRelevantFrame';
import getThreadStacktrace from './getThreadStacktrace';
import trimFilename from './trimFilename';

type ThreadInfo = {
  label?: string;
  filename?: string;
};

function filterThreadInfo(thread: Thread, event: Event): ThreadInfo {
  const stacktrace = getThreadStacktrace(thread, event, false);
  const threadInfo: ThreadInfo = {};

  if (!stacktrace) {
    return threadInfo;
  }

  const relevantFrame: Frame = getRelevantFrame(stacktrace);

  if (relevantFrame.filename) {
    threadInfo.filename = trimFilename(relevantFrame.filename);
  }

  if (relevantFrame.function) {
    threadInfo.label = relevantFrame.function;
    return threadInfo;
  }

  if (relevantFrame.package) {
    threadInfo.label = trimPackage(relevantFrame.package);
    return threadInfo;
  }

  if (relevantFrame.module) {
    threadInfo.label = relevantFrame.module;
    return threadInfo;
  }

  return threadInfo;
}

export default filterThreadInfo;
