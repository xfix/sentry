import React from 'react';

import Feature from 'sentry/components/acl/feature';
import Alert from 'sentry/components/alert';
import {t} from 'sentry/locale';
import {PageContent} from 'sentry/styles/organization';
import withOrganization from 'sentry/utils/withOrganization';

import ProjectDetail from './projectDetail';

function ProjectDetailContainer(props: ProjectDetail['props']) {
  function renderNoAccess() {
    return (
      <PageContent>
        <Alert type="warning">{t("You don't have access to this feature")}</Alert>
      </PageContent>
    );
  }

  return (
    <Feature
      features={['project-detail']}
      organization={props.organization}
      renderDisabled={renderNoAccess}
    >
      <ProjectDetail {...props} />
    </Feature>
  );
}

export default withOrganization(ProjectDetailContainer);
