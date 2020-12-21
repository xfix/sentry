import React from 'react';

import Confirm from 'sentry/components/confirm';
import {t} from 'sentry/locale';
import ConfirmHeader from 'sentry/views/settings/account/accountSecurity/components/confirmHeader';
import TextBlock from 'sentry/views/settings/components/text/textBlock';

type Props = React.ComponentProps<typeof Confirm>;

const message = (
  <React.Fragment>
    <ConfirmHeader>{t('Do you want to remove this method?')}</ConfirmHeader>
    <TextBlock>
      {t(
        'Removing the last authentication method will disable two-factor authentication completely.'
      )}
    </TextBlock>
  </React.Fragment>
);

class RemoveConfirm extends React.Component<Props> {
  static defaultProps = Confirm.defaultProps;

  render() {
    return <Confirm {...this.props} message={message} />;
  }
}

export default RemoveConfirm;
