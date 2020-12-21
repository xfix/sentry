import React from 'react';
import {CacheProvider} from '@emotion/core'; // This is needed to set "speedy" = false (for percy)
import {cache} from 'emotion'; // eslint-disable-line emotion/no-vanilla
import {ThemeProvider} from 'emotion-theming';

import {loadPreferencesState} from 'sentry/actionCreators/preferences';
import ConfigStore from 'sentry/stores/configStore';
import GlobalStyles from 'sentry/styles/global';
import {Config} from 'sentry/types';
import theme, {darkTheme, Theme} from 'sentry/utils/theme';
import withConfig from 'sentry/utils/withConfig';

type Props = {
  config: Config;
};

type State = {
  theme: Theme;
};

class Main extends React.Component<Props, State> {
  state = {
    theme: ConfigStore.get('theme') === 'dark' ? darkTheme : theme,
  };

  componentDidMount() {
    loadPreferencesState();
  }

  componentDidUpdate(prevProps: Props) {
    const {config} = this.props;
    if (config.theme !== prevProps.config.theme) {
      // eslint-disable-next-line
      this.setState({
        theme: config.theme === 'dark' ? darkTheme : theme,
      });
    }
  }

  render() {
    return (
      <ThemeProvider<Theme> theme={this.state.theme}>
        <GlobalStyles
          isDark={this.props.config.theme === 'dark'}
          theme={this.state.theme}
        />
        <CacheProvider value={cache}>{this.props.children}</CacheProvider>
      </ThemeProvider>
    );
  }
}

export default withConfig(Main);
