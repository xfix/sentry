import React from 'react';

import {ModalRenderProps} from 'sentry/actionCreators/modal';
import {createTeam} from 'sentry/actionCreators/teams';
import {Client} from 'sentry/api';
import CreateTeamForm from 'sentry/components/teams/createTeamForm';
import {t} from 'sentry/locale';
import {Organization, Team} from 'sentry/types';
import withApi from 'sentry/utils/withApi';

type Props = {
  api: Client;
  organization: Organization;
  onClose?: (team: Team) => void;
} & ModalRenderProps;

class CreateTeamModal extends React.Component<Props> {
  handleSubmit = (data: {slug: string}, onSuccess: Function, onError: Function) => {
    const {organization, api} = this.props;
    createTeam(api, data, {orgId: organization.slug})
      .then((resp: Team) => {
        this.handleSuccess(resp);
        onSuccess(resp);
      })
      .catch((err: Error) => {
        onError(err);
      });
  };

  handleSuccess(team: Team) {
    if (this.props.onClose) {
      this.props.onClose(team);
    }

    this.props.closeModal();
  }

  render() {
    const {Body, Header, closeModal, ...props} = this.props;

    return (
      <React.Fragment>
        <Header closeButton onHide={closeModal}>
          {t('Create Team')}
        </Header>
        <Body>
          <CreateTeamForm {...props} onSubmit={this.handleSubmit} />
        </Body>
      </React.Fragment>
    );
  }
}

export default withApi(CreateTeamModal);
