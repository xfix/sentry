import React from 'react';

import {mountWithTheme} from 'sentry-test/enzyme';

import Toolbar from 'sentry/components/toolbar';

describe('Toolbar', function () {
  beforeEach(function () {});

  afterEach(function () {});

  it('renders', function () {
    const wrapper = mountWithTheme(
      <Toolbar>
        <div />
      </Toolbar>
    );
    expect(wrapper).toSnapshot();
  });
});
