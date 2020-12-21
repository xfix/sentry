import React from 'react';

import Feature from 'sentry/components/acl/feature';
import LightWeightNoProjectMessage from 'sentry/components/lightWeightNoProjectMessage';
import GlobalSelectionHeader from 'sentry/components/organizations/globalSelectionHeader';
import PageHeading from 'sentry/components/pageHeading';
import {t} from 'sentry/locale';
import {PageContent, PageHeader} from 'sentry/styles/organization';
import {Organization} from 'sentry/types';
import withOrganization from 'sentry/utils/withOrganization';

type Props = {
  organization: Organization;
  children: React.ReactNode;
};

function Dashboards({organization, children}: Props) {
  return (
    <Feature features={['discover', 'discover-query']} renderDisabled requireAll={false}>
      <GlobalSelectionHeader showEnvironmentSelector={false}>
        <PageContent>
          <LightWeightNoProjectMessage organization={organization}>
            <PageHeader>
              <PageHeading withMargins>{t('Dashboards')}</PageHeading>
            </PageHeader>
            {children}
          </LightWeightNoProjectMessage>
        </PageContent>
      </GlobalSelectionHeader>
    </Feature>
  );
}

export default withOrganization(Dashboards);
