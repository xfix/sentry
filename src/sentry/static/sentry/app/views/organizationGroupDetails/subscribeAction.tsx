import React from 'react';
import styled from '@emotion/styled';

import Button from 'sentry/components/button';
import {IconBell} from 'sentry/icons';
import {t} from 'sentry/locale';
import {Group} from 'sentry/types';

import {getSubscriptionReason} from './utils';

type Props = {
  group: Group;
  onClick: (event: React.MouseEvent) => void;
};

function SubscribeAction({group, onClick}: Props) {
  const canChangeSubscriptionState = !(group.subscriptionDetails?.disabled ?? false);

  if (!canChangeSubscriptionState) {
    return null;
  }

  return (
    <SubscribeButton
      title={getSubscriptionReason(group, true)}
      priority={group.isSubscribed ? 'primary' : 'default'}
      size="zero"
      label={t('Subscribe')}
      onClick={onClick}
      icon={<IconBell size="xs" />}
    />
  );
}

export default SubscribeAction;

const SubscribeButton = styled(Button)`
  padding: 6px 9px; /* needed to match existing buttons */
`;
