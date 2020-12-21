import React from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import Button from 'sentry/components/button';
import {t} from 'sentry/locale';
import {growIn} from 'sentry/styles/animations';
import space from 'sentry/styles/space';

type Props = {
  onSubmit: () => void;
  disabled?: boolean;
};

const MultipleSelectorSubmitRow = ({onSubmit, disabled = false}: Props) => (
  <SubmitButtonContainer>
    <SubmitButton disabled={disabled} onClick={onSubmit} size="xsmall" priority="primary">
      {t('Apply')}
    </SubmitButton>
  </SubmitButtonContainer>
);

MultipleSelectorSubmitRow.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

const SubmitButtonContainer = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

const SubmitButton = styled(Button)`
  animation: 0.1s ${growIn} ease-in;
  margin: ${space(0.5)} 0;
`;

export default MultipleSelectorSubmitRow;
