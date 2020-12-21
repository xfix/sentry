import React from 'react';
import {WithRouterProps} from 'react-router/lib/withRouter';

import {disablePlugin, enablePlugin, fetchPlugins} from 'sentry/actionCreators/plugins';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import {Organization, Plugin, Project} from 'sentry/types';
import {trackIntegrationEvent} from 'sentry/utils/integrationUtil';
import withPlugins from 'sentry/utils/withPlugins';
import SettingsPageHeader from 'sentry/views/settings/components/settingsPageHeader';
import PermissionAlert from 'sentry/views/settings/project/permissionAlert';

import ProjectPlugins from './projectPlugins';

type Props = WithRouterProps<{orgId: string; projectId: string}> & {
  plugins: {
    plugins: Plugin[];
    error: React.ComponentProps<typeof ProjectPlugins>['error'];
    loading: boolean;
  };
  organization: Organization;
  project: Project;
};

class ProjectPluginsContainer extends React.Component<Props> {
  static propTypes: any = {
    plugins: SentryTypes.PluginsStore,
    organization: SentryTypes.Organization,
    project: SentryTypes.Project,
  };

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    const plugins = await fetchPlugins(this.props.params);
    const installCount = plugins.filter(
      plugin => plugin.hasConfiguration && plugin.enabled
    ).length;
    trackIntegrationEvent(
      {
        eventKey: 'integrations.index_viewed',
        eventName: 'Integrations: Index Page Viewed',
        integrations_installed: installCount,
        view: 'legacy_integrations',
        project_id: this.props.project.id,
      },
      this.props.organization,
      {startSession: true}
    );
  };

  handleChange = (pluginId: string, shouldEnable: boolean) => {
    const {projectId, orgId} = this.props.params;
    const actionCreator = shouldEnable ? enablePlugin : disablePlugin;
    actionCreator({projectId, orgId, pluginId});
  };

  render() {
    const {loading, error, plugins} = this.props.plugins || {};
    const {orgId} = this.props.params;

    const title = t('Legacy Integrations');

    return (
      <React.Fragment>
        <SentryDocumentTitle title={title} objSlug={orgId} />
        <SettingsPageHeader title={title} />
        <PermissionAlert />

        <ProjectPlugins
          {...this.props}
          onError={this.fetchData}
          onChange={this.handleChange}
          loading={loading}
          error={error}
          plugins={plugins}
        />
      </React.Fragment>
    );
  }
}

export default withPlugins(ProjectPluginsContainer);
