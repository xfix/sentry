import React from 'react';
import styled from '@emotion/styled';

import Breadcrumbs from 'sentry/components/breadcrumbs';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';

type Props = {
  hasMetricAlerts: boolean;
  orgSlug: string;
  title: string;
};

function BuilderBreadCrumbs(props: Props) {
  const {hasMetricAlerts, orgSlug, title} = props;
  return (
    <StyledBreadcrumbs
      crumbs={[
        {
          to: hasMetricAlerts
            ? `/organizations/${orgSlug}/alerts/`
            : `/organizations/${orgSlug}/alerts/rules/`,
          label: t('Alerts'),
          preserveGlobalSelection: true,
        },
        {
          label: title,
        },
      ]}
    />
  );
}

const StyledBreadcrumbs = styled(Breadcrumbs)`
  font-size: 18px;
  margin-bottom: ${space(3)};
`;

export default BuilderBreadCrumbs;
