import React from 'react';

import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import {IconChevron} from 'sentry/icons';

type PaginationProps = {
  getNextPage: () => void;
  getPreviousPage: () => void;
  previous?: string | null;
  next?: string | null;
};

export default class Pagination extends React.Component<PaginationProps> {
  render() {
    const {getPreviousPage, getNextPage, previous, next} = this.props;

    return (
      <ButtonBar merged>
        <Button
          className="btn"
          disabled={!previous}
          size="xsmall"
          icon={<IconChevron direction="left" size="xs" />}
          onClick={getPreviousPage}
        />
        <Button
          className="btn"
          disabled={!next}
          size="xsmall"
          icon={<IconChevron direction="right" size="xs" />}
          onClick={getNextPage}
        />
      </ButtonBar>
    );
  }
}
