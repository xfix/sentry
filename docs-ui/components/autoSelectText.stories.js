import React from 'react';
import {withInfo} from '@storybook/addon-info';

import AutoSelectText from 'sentry/components/autoSelectText';

export default {
  title: 'Utilities/AutoSelectText',
};

export const Default = withInfo('Select text on click')(() => (
  <AutoSelectText>Click to highlight text</AutoSelectText>
));

Default.story = {
  name: 'default',
};
