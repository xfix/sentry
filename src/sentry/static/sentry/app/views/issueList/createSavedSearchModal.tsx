import React from 'react';

import {addLoadingMessage, clearIndicators} from 'sentry/actionCreators/indicator';
import {ModalRenderProps} from 'sentry/actionCreators/modal';
import {createSavedSearch} from 'sentry/actionCreators/savedSearches';
import {Client} from 'sentry/api';
import Button from 'sentry/components/button';
import {TextField} from 'sentry/components/forms';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {LightWeightOrganization} from 'sentry/types';
import withApi from 'sentry/utils/withApi';

type Props = ModalRenderProps & {
  api: Client;
  query: string;
  organization: LightWeightOrganization;
};

type State = {
  isSaving: boolean;
  name: string;
  error: string | null;
  query: string | null;
};

type FieldOnChangeParameters = Parameters<NonNullable<TextField['props']['onChange']>>[0];

class CreateSavedSearchModal extends React.Component<Props, State> {
  state: State = {
    isSaving: false,
    name: '',
    error: null,
    query: null,
  };

  onSubmit = (e: React.FormEvent) => {
    const {api, organization} = this.props;
    const query = this.state.query || this.props.query;

    e.preventDefault();

    this.setState({isSaving: true});

    addLoadingMessage(t('Saving Changes'));

    createSavedSearch(api, organization.slug, this.state.name, query)
      .then(_data => {
        this.props.closeModal();
        this.setState({
          error: null,
          isSaving: false,
        });
        clearIndicators();
      })
      .catch(err => {
        let error = t('Unable to save your changes.');
        if (err.responseJSON && err.responseJSON.detail) {
          error = err.responseJSON.detail;
        }
        this.setState({
          error,
          isSaving: false,
        });
        clearIndicators();
      });
  };

  handleChangeName = (val: FieldOnChangeParameters) => {
    this.setState({name: String(val)});
  };

  handleChangeQuery = (val: FieldOnChangeParameters) => {
    this.setState({query: String(val)});
  };

  render() {
    const {isSaving, error} = this.state;
    const {Header, Footer, Body, closeModal, query} = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        <Header>
          <h4>{t('Save Current Search')}</h4>
        </Header>

        <Body>
          {this.state.error && (
            <div className="alert alert-error alert-block">{error}</div>
          )}

          <p>{t('All team members will now have access to this search.')}</p>
          <TextField
            key="name"
            name="name"
            label={t('Name')}
            placeholder="e.g. My Search Results"
            required
            onChange={this.handleChangeName}
          />
          <TextField
            key="query"
            name="query"
            label={t('Query')}
            value={query}
            required
            onChange={this.handleChangeQuery}
          />
        </Body>
        <Footer>
          <Button
            priority="default"
            size="small"
            disabled={isSaving}
            onClick={closeModal}
            style={{marginRight: space(1)}}
          >
            {t('Cancel')}
          </Button>
          <Button priority="primary" size="small" disabled={isSaving}>
            {t('Save')}
          </Button>
        </Footer>
      </form>
    );
  }
}

export default withApi(CreateSavedSearchModal);
