import React from 'react';
import styled from '@emotion/styled';

import Button from 'sentry/components/button';
import Confirm from 'sentry/components/confirm';
import FlowLayout from 'sentry/components/flowLayout';
import SpreadLayout from 'sentry/components/spreadLayout';
import Toolbar from 'sentry/components/toolbar';
import ToolbarHeader from 'sentry/components/toolbarHeader';
import {t} from 'sentry/locale';
import GroupingStore from 'sentry/stores/groupingStore';
import space from 'sentry/styles/space';
import {callIfFunction} from 'sentry/utils/callIfFunction';

type Props = {
  onMerge: () => void;
  v2: boolean;
};

const inititalState = {
  mergeCount: 0,
};

type State = typeof inititalState;

class SimilarToolbar extends React.Component<Props, State> {
  state: State = inititalState;

  componentWillUnmount() {
    callIfFunction(this.listener);
  }

  onGroupChange = ({mergeList}) => {
    if (!mergeList?.length) {
      return;
    }

    if (mergeList.length !== this.state.mergeCount) {
      this.setState({mergeCount: mergeList.length});
    }
  };

  listener = GroupingStore.listen(this.onGroupChange, undefined);

  render() {
    const {onMerge, v2} = this.props;
    const {mergeCount} = this.state;

    return (
      <Toolbar>
        <SpreadLayout responsive>
          <StyledFlowLayout>
            <FlowLayout>
              <Actions>
                <Confirm
                  data-test-id="merge"
                  disabled={mergeCount === 0}
                  message={t('Are you sure you want to merge these issues?')}
                  onConfirm={onMerge}
                >
                  <Button size="small" title={t('Merging %s issues', mergeCount)}>
                    {t('Merge %s', `(${mergeCount || 0})`)}
                  </Button>
                </Confirm>
              </Actions>
            </FlowLayout>
          </StyledFlowLayout>

          <Columns>
            <StyledToolbarHeader className="event-count-header">
              {t('Events')}
            </StyledToolbarHeader>

            {v2 ? (
              <StyledToolbarHeader className="event-similar-header">
                {t('Score')}
              </StyledToolbarHeader>
            ) : (
              <React.Fragment>
                <StyledToolbarHeader className="event-similar-header">
                  {t('Exception')}
                </StyledToolbarHeader>
                <StyledToolbarHeader className="event-similar-header">
                  {t('Message')}
                </StyledToolbarHeader>
              </React.Fragment>
            )}
          </Columns>
        </SpreadLayout>
      </Toolbar>
    );
  }
}
export default SimilarToolbar;

const Actions = styled('div')`
  margin-left: ${space(3)};
  padding: ${space(0.5)} 0;
`;

const StyledFlowLayout = styled(FlowLayout)`
  flex: 1;
`;

const Columns = styled('div')`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 300px;
  width: 300px;
`;

const StyledToolbarHeader = styled(ToolbarHeader)`
  flex: 1;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: ${space(0.5)} 0;
`;
