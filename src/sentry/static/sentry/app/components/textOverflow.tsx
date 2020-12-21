import React from 'react';
import styled from '@emotion/styled';

import overflowEllipsis from 'sentry/styles/overflowEllipsis';
import overflowEllipsisLeft from 'sentry/styles/overflowEllipsisLeft';

type Props = {
  children: React.ReactNode;
  isParagraph?: boolean;
  ellipsisDirection?: 'left' | 'right';
  className?: string;
};

const TextOverflow = styled(({isParagraph, className, children}: Props) => {
  const Component = isParagraph ? 'p' : 'div';
  return <Component className={className}>{children}</Component>;
})`
  ${p => (p.ellipsisDirection === 'right' ? overflowEllipsis : overflowEllipsisLeft)};
  width: auto;
`;

TextOverflow.defaultProps = {
  ellipsisDirection: 'right',
  isParagraph: false,
};

export default TextOverflow;
