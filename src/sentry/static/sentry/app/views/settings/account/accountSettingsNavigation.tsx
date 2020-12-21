import React from 'react';

import navigationConfiguration from 'sentry/views/settings/account/navigationConfiguration';
import SettingsNavigation from 'sentry/views/settings/components/settingsNavigation';

const AccountSettingsNavigation = () => (
  <SettingsNavigation navigationObjects={navigationConfiguration} />
);

export default AccountSettingsNavigation;
