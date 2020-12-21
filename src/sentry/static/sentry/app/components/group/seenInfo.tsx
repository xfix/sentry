import React from 'react';
import {css} from '@emotion/core';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import DateTime from 'sentry/components/dateTime';
import {Body, Header, Hovercard} from 'sentry/components/hovercard';
import TimeSince from 'sentry/components/timeSince';
import Version from 'sentry/components/version';
import VersionHoverCard from 'sentry/components/versionHoverCard';
import {t} from 'sentry/locale';
import overflowEllipsis from 'sentry/styles/overflowEllipsis';
import space from 'sentry/styles/space';
import {Release} from 'sentry/types';
import {defined, toTitleCase} from 'sentry/utils';
import theme from 'sentry/utils/theme';

type RelaxedDateType = React.ComponentProps<typeof TimeSince>['date'];

type Props = {
  orgSlug: string;
  projectSlug: string;
  projectId: string;
  hasRelease: boolean;
  title: string;
  date: RelaxedDateType;
  dateGlobal: RelaxedDateType;
  release?: Release;
  environment?: string;
};

class SeenInfo extends React.Component<Props> {
  static propTypes = {
    orgSlug: PropTypes.string.isRequired,
    projectSlug: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    date: PropTypes.any,
    dateGlobal: PropTypes.any,
    release: PropTypes.shape({
      version: PropTypes.string.isRequired,
    }),
    environment: PropTypes.string,
  };

  static contextTypes = {
    organization: PropTypes.object,
  };

  shouldComponentUpdate(nextProps: Props) {
    const {date, release} = this.props;

    return release?.version !== nextProps.release?.version || date !== nextProps.date;
  }

  getReleaseTrackingUrl() {
    const {orgSlug, projectSlug} = this.props;

    return `/settings/${orgSlug}/projects/${projectSlug}/release-tracking/`;
  }

  render() {
    const {
      date,
      dateGlobal,
      environment,
      release,
      orgSlug,
      projectSlug,
      projectId,
    } = this.props;
    return (
      <HovercardWrapper>
        <StyledHovercard
          header={
            <div>
              <TimeSinceWrapper>
                {t('Any Environment')}
                <TimeSince date={dateGlobal} disabledAbsoluteTooltip />
              </TimeSinceWrapper>
              {environment && (
                <TimeSinceWrapper>
                  {toTitleCase(environment)}
                  {date ? (
                    <TimeSince date={date} disabledAbsoluteTooltip />
                  ) : (
                    <span>{t('N/A')}</span>
                  )}
                </TimeSinceWrapper>
              )}
            </div>
          }
          body={
            date ? (
              <StyledDateTime date={date} />
            ) : (
              <NoEnvironment>{t(`N/A for ${environment}`)}</NoEnvironment>
            )
          }
          position="top"
          tipColor={theme.gray500}
        >
          <DateWrapper>
            {date ? (
              <TooltipWrapper>
                <StyledTimeSince date={date} disabledAbsoluteTooltip />
              </TooltipWrapper>
            ) : dateGlobal && environment === '' ? (
              <React.Fragment>
                <TimeSince date={dateGlobal} disabledAbsoluteTooltip />
                <StyledTimeSince date={dateGlobal} disabledAbsoluteTooltip />
              </React.Fragment>
            ) : (
              <NoDateTime>{t('N/A')}</NoDateTime>
            )}
          </DateWrapper>
        </StyledHovercard>
        <DateWrapper>
          {defined(release) ? (
            <React.Fragment>
              {t('in release ')}
              <VersionHoverCard
                orgSlug={orgSlug}
                projectSlug={projectSlug}
                releaseVersion={release.version}
              >
                <span>
                  <Version version={release.version} projectId={projectId} />
                </span>
              </VersionHoverCard>
            </React.Fragment>
          ) : null}
        </DateWrapper>
      </HovercardWrapper>
    );
  }
}

const dateTimeCss = p => css`
  color: ${p.theme.gray300};
  font-size: ${p.theme.fontSizeMedium};
  display: flex;
  justify-content: center;
`;

const HovercardWrapper = styled('div')`
  display: flex;
`;

const DateWrapper = styled('div')`
  margin-bottom: ${space(2)};
  ${overflowEllipsis};
`;

const StyledDateTime = styled(DateTime)`
  ${dateTimeCss};
`;

const NoEnvironment = styled('div')`
  ${dateTimeCss};
`;

const NoDateTime = styled('span')`
  margin-right: ${space(0.5)};
`;

const TooltipWrapper = styled('span')`
  margin-right: ${space(0.25)};
  svg {
    margin-right: ${space(0.5)};
    position: relative;
    top: 1px;
  }
`;

const TimeSinceWrapper = styled('div')`
  font-size: ${p => p.theme.fontSizeSmall};
  margin-bottom: ${space(0.5)};
  display: flex;
  justify-content: space-between;
`;

const StyledTimeSince = styled(TimeSince)`
  font-size: ${p => p.theme.fontSizeMedium};
`;

const StyledHovercard = styled(Hovercard)`
  width: 250px;
  font-weight: normal;
  border: 1px solid ${p => p.theme.gray500};
  background: ${p => p.theme.gray500};
  ${Header} {
    font-weight: normal;
    color: ${p => p.theme.white};
    background: ${p => p.theme.gray500};
    border-bottom: 1px solid ${p => p.theme.gray400};
  }
  ${Body} {
    padding: ${space(1.5)};
  }
`;

export default SeenInfo;
