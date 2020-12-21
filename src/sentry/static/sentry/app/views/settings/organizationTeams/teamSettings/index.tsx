import React from 'react';
import {RouteComponentProps} from 'react-router';
import PropTypes from 'prop-types';

import {addErrorMessage, addSuccessMessage} from 'sentry/actionCreators/indicator';
import {removeTeam, updateTeamSuccess} from 'sentry/actionCreators/teams';
import Button from 'sentry/components/button';
import Confirm from 'sentry/components/confirm';
import {Panel, PanelHeader} from 'sentry/components/panels';
import teamSettingsFields from 'sentry/data/forms/teamSettingsFields';
import {IconDelete} from 'sentry/icons';
import {t, tct} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import {Scope, Team} from 'sentry/types';
import AsyncView from 'sentry/views/asyncView';
import Field from 'sentry/views/settings/components/forms/field';
import Form from 'sentry/views/settings/components/forms/form';
import JsonForm from 'sentry/views/settings/components/forms/jsonForm';
import FormModel from 'sentry/views/settings/components/forms/model';

import TeamModel from './model';

type Props = {
  team: Team;
} & RouteComponentProps<{orgId: string; teamId: string}, {}>;

type State = AsyncView['state'];

export default class TeamSettings extends AsyncView<Props, State> {
  static contextTypes = {
    router: PropTypes.object,
    location: PropTypes.object,
    organization: SentryTypes.Organization,
  };

  model = new TeamModel(this.props.params.orgId, this.props.params.teamId);

  getTitle() {
    return 'Team Settings';
  }

  getEndpoints() {
    return [];
  }

  handleSubmitSuccess = (resp: any, model: FormModel, id?: string) => {
    updateTeamSuccess(resp.slug, resp);
    if (id === 'slug') {
      addSuccessMessage(t('Team name changed'));
      this.props.router.replace(
        `/settings/${this.props.params.orgId}/teams/${model.getValue(id)}/settings/`
      );
      this.setState({loading: true});
    }
  };

  handleRemoveTeam = async () => {
    await removeTeam(this.api, this.props.params);
    this.props.router.replace(`/settings/${this.props.params.orgId}/teams/`);
  };

  renderBody() {
    const {location, organization} = this.context;
    const {team} = this.props;

    const access = new Set<Scope>(organization.access);

    return (
      <React.Fragment>
        <Form
          model={this.model}
          apiMethod="PUT"
          saveOnBlur
          allowUndo
          onSubmitSuccess={this.handleSubmitSuccess}
          onSubmitError={() => addErrorMessage(t('Unable to save change'))}
          initialData={{
            name: team.name,
            slug: team.slug,
          }}
        >
          <JsonForm access={access} location={location} forms={teamSettingsFields} />
        </Form>

        <Panel>
          <PanelHeader>{t('Remove Team')}</PanelHeader>
          <Field
            help={t(
              "This may affect team members' access to projects and associated alert delivery."
            )}
          >
            <div>
              <Confirm
                disabled={!access.has('team:admin')}
                onConfirm={this.handleRemoveTeam}
                priority="danger"
                message={tct('Are you sure you want to remove the team [team]?', {
                  team: `#${team.slug}`,
                })}
              >
                <Button
                  icon={<IconDelete />}
                  priority="danger"
                  disabled={!access.has('team:admin')}
                >
                  {t('Remove Team')}
                </Button>
              </Confirm>
            </div>
          </Field>
        </Panel>
      </React.Fragment>
    );
  }
}
