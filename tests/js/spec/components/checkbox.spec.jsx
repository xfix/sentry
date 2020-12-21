import React from 'react';

import {mountWithTheme} from 'sentry-test/enzyme';

import Checkbox from 'sentry/components/checkbox';

describe('Checkbox', function () {
  it('renders', function () {
    const component = mountWithTheme(<Checkbox onChange={() => {}} />);

    expect(component).toSnapshot();
  });
});
