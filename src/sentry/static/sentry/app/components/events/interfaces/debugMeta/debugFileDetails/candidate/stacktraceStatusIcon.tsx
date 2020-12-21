import React from 'react';

import Tooltip from 'sentry/components/tooltip';
import {IconCheckmark, IconClose, IconWarning} from 'sentry/icons';
import {CandidateStacktraceInfo, CandidateStacktraceStatus} from 'sentry/types/debugImage';

type Props = {
  stacktraceInfo: CandidateStacktraceInfo;
};

function StacktraceStatusIcon({stacktraceInfo}: Props) {
  switch (stacktraceInfo.status) {
    case CandidateStacktraceStatus.OK:
      return <IconCheckmark color="green300" size="xs" />;
    case CandidateStacktraceStatus.ERROR: {
      const {details} = stacktraceInfo;
      const icon = <IconClose color="red300" size="xs" />;

      if (!details) {
        return icon;
      }

      return <Tooltip title={details}>{icon}</Tooltip>;
    }
    case CandidateStacktraceStatus.MALFORMED: {
      const {details} = stacktraceInfo;
      const icon = <IconWarning color="yellow300" size="xs" />;

      if (!details) {
        return icon;
      }

      return <Tooltip title={details}>{icon}</Tooltip>;
    }
    default:
      return null; //this should never happen
  }
}

export default StacktraceStatusIcon;
