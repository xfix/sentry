import React from 'react';

import Feature from 'sentry/components/acl/feature';
import Alert from 'sentry/components/alert';
import {IconInfo} from 'sentry/icons';
import {t} from 'sentry/locale';

type Props = {message?: React.ReactNode};

const PerformanceAlert = ({message}: Props) => (
  <Feature features={['performance-view']}>
    <Alert type="info" icon={<IconInfo />} data-test-id="performance-usage">
      {message || t('Transactions and attachments are not yet included in the chart.')}
    </Alert>
  </Feature>
);

export default PerformanceAlert;
