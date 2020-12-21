import styled from '@emotion/styled';

import {PanelHeader} from 'sentry/components/panels';
import space from 'sentry/styles/space';

const Header = styled(PanelHeader)`
  border-top-left-radius: 0;
  padding: ${space(1.5)} ${space(2)};
  font-size: ${p => p.theme.fontSizeSmall};
`;

export default Header;
