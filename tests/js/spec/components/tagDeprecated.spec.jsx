import React from 'react';

import {mountWithTheme} from 'sentry-test/enzyme';

import Tag from 'sentry/components/tagDeprecated';

describe('Tag', function () {
  it('renders', function () {
    const wrapper = mountWithTheme(
      <Tag priority="info" border size="small">
        Text to Copy
      </Tag>
    );
    expect(wrapper).toSnapshot();
  });
});
