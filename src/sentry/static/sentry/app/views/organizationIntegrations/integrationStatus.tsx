import React from 'react';
import styled from '@emotion/styled';

import CircleIndicator from 'sentry/components/circleIndicator';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {IntegrationInstallationStatus} from 'sentry/types';
import theme from 'sentry/utils/theme';

import {COLORS} from './constants';

type StatusProps = {
  status: IntegrationInstallationStatus;
};

const StatusWrapper = styled('div')`
  display: flex;
  align-items: center;
`;

const IntegrationStatus = styled((props: StatusProps) => {
  const {status, ...p} = props;
  return (
    <StatusWrapper>
      <CircleIndicator size={6} color={theme[COLORS[status]]} />
      <div {...p}>{`${t(status)}`}</div>
    </StatusWrapper>
  );
})`
  color: ${p => theme[COLORS[p.status]]};
  margin-left: ${space(0.5)};
  font-weight: light;
  margin-right: ${space(0.75)};
`;

export default IntegrationStatus;
