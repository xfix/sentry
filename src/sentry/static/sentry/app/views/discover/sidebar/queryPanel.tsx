import React from 'react';

import PageHeading from 'sentry/components/pageHeading';
import {IconClose} from 'sentry/icons/iconClose';

import {QueryPanelCloseLink, QueryPanelContainer, QueryPanelTitle} from '../styles';

type QueryPanelProps = {
  title: any;
  onClose: () => void;
};

export default class QueryPanel extends React.Component<QueryPanelProps> {
  render() {
    const {title, onClose} = this.props;
    return (
      <QueryPanelContainer>
        <QueryPanelTitle>
          <PageHeading>{title}</PageHeading>

          <QueryPanelCloseLink to="" onClick={onClose}>
            <IconClose color="gray200" />
          </QueryPanelCloseLink>
        </QueryPanelTitle>
        {this.props.children}
      </QueryPanelContainer>
    );
  }
}
