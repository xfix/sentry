import React from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import Button from 'sentry/components/button';
import ProjectBadge from 'sentry/components/idBadge/projectBadge';
import {Panel, PanelBody, PanelHeader, PanelItem} from 'sentry/components/panels';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import withProjects from 'sentry/utils/withProjects';
import EmptyMessage from 'sentry/views/settings/components/emptyMessage';

class IntegrationAlertRules extends React.Component {
  static propTypes = {
    projects: PropTypes.arrayOf(SentryTypes.Project).isRequired,
  };

  static contextTypes = {
    organization: SentryTypes.Organization,
  };

  render() {
    const {projects} = this.props;
    const orgId = this.context.organization.slug;

    return (
      <Panel>
        <PanelHeader>{t('Project Configuration')}</PanelHeader>
        <PanelBody>
          {projects.length === 0 && (
            <EmptyMessage size="large">
              {t('You have no projects to add Alert Rules to')}
            </EmptyMessage>
          )}
          {projects.map(project => (
            <ProjectItem key={project.slug}>
              <ProjectBadge project={project} avatarSize={16} />
              <Button
                to={`/organizations/${orgId}/alerts/${project.slug}/new/`}
                size="xsmall"
              >
                {t('Add Alert Rule')}
              </Button>
            </ProjectItem>
          ))}
        </PanelBody>
      </Panel>
    );
  }
}

const ProjectItem = styled(PanelItem)`
  align-items: center;
  justify-content: space-between;
`;

export default withProjects(IntegrationAlertRules);
