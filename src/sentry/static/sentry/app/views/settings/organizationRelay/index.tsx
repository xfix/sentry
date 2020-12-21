import React from 'react';

import Feature from 'sentry/components/acl/feature';
import FeatureDisabled from 'sentry/components/acl/featureDisabled';
import {PanelAlert} from 'sentry/components/panels';
import {t} from 'sentry/locale';
import withOrganization from 'sentry/utils/withOrganization';

import RelayWrapper from './relayWrapper';

const OrganizationRelay = ({organization, ...props}: RelayWrapper['props']) => (
  <Feature
    features={['relay']}
    organization={organization}
    renderDisabled={() => (
      <FeatureDisabled
        alert={PanelAlert}
        features={organization.features}
        featureName={t('Relay')}
      />
    )}
  >
    <RelayWrapper organization={organization} {...props} />
  </Feature>
);

export default withOrganization(OrganizationRelay);
