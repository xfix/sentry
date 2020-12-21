import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import {SectionHeading} from 'sentry/components/charts/styles';
import GlobalSelectionLink from 'sentry/components/globalSelectionLink';
import Tooltip from 'sentry/components/tooltip';
import {IconLink} from 'sentry/icons';
import {t} from 'sentry/locale';
import overflowEllipsis from 'sentry/styles/overflowEllipsis';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';
import {decodeScalar} from 'sentry/utils/queryString';
import {stringifyQueryObject, tokenizeSearch} from 'sentry/utils/tokenizeSearch';
import {FilterViews} from 'sentry/views/performance/landing';
import {DEFAULT_MAX_DURATION} from 'sentry/views/performance/trends/utils';
import {getPerformanceLandingUrl} from 'sentry/views/performance/utils';

type Props = {
  organization: Organization;
  location: Location;
  project: Project | null;
};

function ProjectQuickLinks({organization, project, location}: Props) {
  function getTrendsLink() {
    const queryString = decodeScalar(location.query.query);
    const conditions = tokenizeSearch(queryString || '');
    conditions.setTagValues('tpm()', ['>0.01']);
    conditions.setTagValues('transaction.duration', ['>0', `<${DEFAULT_MAX_DURATION}`]);

    return {
      pathname: getPerformanceLandingUrl(organization),
      query: {
        project: project?.id,
        cursor: undefined,
        query: stringifyQueryObject(conditions),
        view: FilterViews.TRENDS,
      },
    };
  }

  const quickLinks = [
    {
      title: t('User Feedback'),
      to: {
        pathname: `/organizations/${organization.slug}/user-feedback/`,
        query: {project: project?.id},
      },
    },
    {
      title: t('Key Transactions'),
      to: {
        pathname: getPerformanceLandingUrl(organization),
        query: {project: project?.id},
      },
      disabled: !organization.features.includes('performance-view'),
    },
    {
      title: t('Most Improved/Regressed Transactions'),
      to: getTrendsLink(),
      disabled: !organization.features.includes('performance-view'),
    },
  ];

  return (
    <Section>
      <SectionHeading>{t('Quick Links')}</SectionHeading>
      {quickLinks
        // push disabled links to the bottom
        .sort((link1, link2) => Number(!!link1.disabled) - Number(!!link2.disabled))
        .map(({title, to, disabled}) => (
          <div key={title}>
            <Tooltip
              title={t("You don't have access to this feature")}
              disabled={!disabled}
            >
              <QuickLink to={to} disabled={disabled}>
                <IconLink />
                <QuickLinkText>{title}</QuickLinkText>
              </QuickLink>
            </Tooltip>
          </div>
        ))}
    </Section>
  );
}

const Section = styled('section')`
  margin-bottom: ${space(2)};
`;

const QuickLink = styled(p =>
  p.disabled ? (
    <span className={p.className}>{p.children}</span>
  ) : (
    <GlobalSelectionLink {...p} />
  )
)<{
  disabled?: boolean;
}>`
  margin-bottom: ${space(1)};
  display: grid;
  align-items: center;
  gap: ${space(1)};
  grid-template-columns: auto 1fr;

  ${p =>
    p.disabled &&
    `
    color: ${p.theme.gray200};
    cursor: not-allowed;
  `}
`;

const QuickLinkText = styled('span')`
  ${overflowEllipsis}
`;

export default ProjectQuickLinks;
