import React from 'react';

import {mountWithTheme} from 'sentry-test/enzyme';

import CircleIndicator from 'sentry/components/circleIndicator';

describe('CircleIndicator', function () {
  it('renders', function () {
    const wrapper = mountWithTheme(<CircleIndicator />);
    expect(wrapper).toSnapshot();
  });
});
