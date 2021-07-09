import {Fragment, useEffect, useState} from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import Tooltip from 'app/components/tooltip';
import space from 'app/styles/space';

import {ParseResult, Token, TokenResult} from './parser';
import {isWithinToken} from './utils';

type Props = {
  /**
   * The result from parsing the search query string
   */
  parsedQuery: ParseResult;
  /**
   * The current location of the cursror within the query. This is used to
   * highlight active tokens and trigger error tooltips.
   */
  cursorPosition?: number;
};

/**
 * Renders the parsed query with syntax highlighting.
 */
export default function HighlightQuery({parsedQuery, cursorPosition}: Props) {
  const result = renderResult(parsedQuery, cursorPosition ?? -1);

  return <Fragment>{result}</Fragment>;
}

function renderResult(result: ParseResult, cursor: number) {
  return result
    .map(t => renderToken(t, cursor))
    .map((renderedToken, i) => <Fragment key={i}>{renderedToken}</Fragment>);
}

function renderToken(token: TokenResult<Token>, cursor: number) {
  switch (token.type) {
    case Token.Spaces:
      return token.value;

    case Token.Filter:
      return <FilterToken filter={token} cursor={cursor} />;

    case Token.ValueTextList:
    case Token.ValueNumberList:
      return <ListToken token={token} cursor={cursor} />;

    case Token.ValueNumber:
      return <NumberToken token={token} />;

    case Token.ValueBoolean:
      return <Boolean>{token.text}</Boolean>;

    case Token.ValueIso8601Date:
      return <DateTime>{token.text}</DateTime>;

    case Token.LogicGroup:
      return <LogicGroup>{renderResult(token.inner, cursor)}</LogicGroup>;

    case Token.LogicBoolean:
      return <LogicBoolean>{token.value}</LogicBoolean>;

    default:
      return token.text;
  }
}

const FilterToken = ({
  filter,
  cursor,
}: {
  filter: TokenResult<Token.Filter>;
  cursor: number;
}) => {
  const isActive = isWithinToken(filter, cursor);

  // This state tracks if the cursor has left the filter token. We initialize it
  // to !isActive in the case where the filter token is rendered without the
  // cursor initally being in it.
  const [hasLeft, setHasLeft] = useState(!isActive);

  // Trigger the effect when isActive changes to updated whether the cursor has
  // left the token.
  useEffect(() => {
    if (!isActive && !hasLeft) {
      setHasLeft(true);
    }
  }, [isActive]);

  const showInvalid = hasLeft && !!filter.invalid;
  const showTooltip = showInvalid && isActive;

  return (
    <Tooltip
      disabled={!showTooltip}
      title={filter.invalid?.reason}
      popperStyle={{maxWidth: '350px'}}
      forceShow
    >
      <Filter active={isActive} invalid={showInvalid}>
        {filter.negated && <Negation>!</Negation>}
        <KeyToken token={filter.key} negated={filter.negated} />
        {filter.operator && <Operator>{filter.operator}</Operator>}
        <Value>{renderToken(filter.value, cursor)}</Value>
      </Filter>
    </Tooltip>
  );
};

const KeyToken = ({
  token,
  negated,
}: {
  token: TokenResult<Token.KeySimple | Token.KeyAggregate | Token.KeyExplicitTag>;
  negated?: boolean;
}) => {
  let value: React.ReactNode = token.text;

  if (token.type === Token.KeyExplicitTag) {
    value = (
      <ExplicitKey prefix={token.prefix}>
        {token.key.quoted ? `"${token.key.value}"` : token.key.value}
      </ExplicitKey>
    );
  }

  return <Key negated={!!negated}>{value}:</Key>;
};

const ListToken = ({
  token,
  cursor,
}: {
  token: TokenResult<Token.ValueNumberList | Token.ValueTextList>;
  cursor: number;
}) => (
  <InList>
    {token.items.map(({value, separator}) => [
      <ListComma key="comma">{separator}</ListComma>,
      renderToken(value, cursor),
    ])}
  </InList>
);

const NumberToken = ({token}: {token: TokenResult<Token.ValueNumber>}) => (
  <Fragment>
    {token.value}
    <Unit>{token.unit}</Unit>
  </Fragment>
);

type FilterProps = {
  active: boolean;
  invalid: boolean;
};

const colorType = (p: FilterProps) =>
  `${p.invalid ? 'invalid' : 'valid'}${p.active ? 'Active' : ''}` as const;

const Filter = styled('span')<FilterProps>`
  --token-bg: ${p => p.theme.searchTokenBackground[colorType(p)]};
  --token-border: ${p => p.theme.searchTokenBorder[colorType(p)]};
  --token-value-color: ${p => (p.invalid ? p.theme.red300 : p.theme.blue300)};
`;

const filterCss = css`
  background: var(--token-bg);
  border: 0.5px solid var(--token-border);
  padding: ${space(0.25)} 0;
`;

const Negation = styled('span')`
  ${filterCss};
  border-right: none;
  padding-left: 1px;
  margin-left: -2px;
  font-weight: bold;
  border-radius: 2px 0 0 2px;
  color: ${p => p.theme.red300};
`;

const Key = styled('span')<{negated: boolean}>`
  ${filterCss};
  border-right: none;
  font-weight: bold;
  ${p =>
    !p.negated
      ? css`
          border-radius: 2px 0 0 2px;
          padding-left: 1px;
          margin-left: -2px;
        `
      : css`
          border-left: none;
          margin-left: 0;
        `};
`;

const ExplicitKey = styled('span')<{prefix: string}>`
  &:before,
  &:after {
    color: ${p => p.theme.subText};
  }
  &:before {
    content: '${p => p.prefix}[';
  }
  &:after {
    content: ']';
  }
`;

const Operator = styled('span')`
  ${filterCss};
  border-left: none;
  border-right: none;
  margin: -1px 0;
  color: ${p => p.theme.orange400};
`;

const Value = styled('span')`
  ${filterCss};
  border-left: none;
  border-radius: 0 2px 2px 0;
  color: var(--token-value-color);
  margin: -1px -2px -1px 0;
  padding-right: 1px;
`;

const Unit = styled('span')`
  font-weight: bold;
  color: ${p => p.theme.green300};
`;

const LogicBoolean = styled('span')`
  font-weight: bold;
  color: ${p => p.theme.red300};
`;

const Boolean = styled('span')`
  color: ${p => p.theme.pink300};
`;

const DateTime = styled('span')`
  color: ${p => p.theme.green300};
`;

const ListComma = styled('span')`
  color: ${p => p.theme.gray300};
`;

const InList = styled('span')`
  &:before {
    content: '[';
    font-weight: bold;
    color: ${p => p.theme.purple300};
  }
  &:after {
    content: ']';
    font-weight: bold;
    color: ${p => p.theme.purple300};
  }

  ${Value} {
    color: ${p => p.theme.purple300};
  }
`;

const LogicGroup = styled(({children, ...props}) => (
  <span {...props}>
    <span>(</span>
    {children}
    <span>)</span>
  </span>
))`
  > span:first-child,
  > span:last-child {
    position: relative;
    color: transparent;

    &:before {
      position: absolute;
      top: -5px;
      color: ${p => p.theme.orange400};
      font-size: 16px;
      font-weight: bold;
    }
  }

  > span:first-child:before {
    left: -3px;
    content: '(';
  }
  > span:last-child:before {
    right: -3px;
    content: ')';
  }
`;
