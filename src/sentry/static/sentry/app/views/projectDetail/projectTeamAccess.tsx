import React from 'react';
import styled from '@emotion/styled';

import Button from 'sentry/components/button';
import {SectionHeading} from 'sentry/components/charts/styles';
import Collapsible from 'sentry/components/collapsible';
import IdBadge from 'sentry/components/idBadge';
import Link from 'sentry/components/links/link';
import Placeholder from 'sentry/components/placeholder';
import {t, tn} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';

type Props = {
  organization: Organization;
  project?: Project | null;
};

function ProjectTeamAccess({organization, project}: Props) {
  function renderInnerBody() {
    if (!project) {
      return <Placeholder height="23px" />;
    }

    if (project.teams.length === 0) {
      const hasPermission = organization.access.includes('project:write');
      return (
        <Button
          to={`/settings/${organization.slug}/projects/${project.slug}/teams/`}
          disabled={!hasPermission}
          title={hasPermission ? undefined : t('You do not have permission to do this')}
          priority="primary"
          size="small"
        >
          {t('Assign Team')}
        </Button>
      );
    }

    return (
      <Collapsible
        expandButton={({onExpand, numberOfCollapsedItems}) => (
          <Button priority="link" onClick={onExpand}>
            {tn(
              'Show %s collapsed team',
              'Show %s collapsed teams',
              numberOfCollapsedItems
            )}
          </Button>
        )}
      >
        {project.teams.map(team => (
          <StyledLink
            to={`/settings/${organization.slug}/teams/${team.slug}/`}
            key={team.slug}
          >
            <IdBadge team={team} hideAvatar />
          </StyledLink>
        ))}
      </Collapsible>
    );
  }

  return (
    <Section>
      <SectionHeading>{t('Team Access')}</SectionHeading>

      <div>{renderInnerBody()}</div>
    </Section>
  );
}

ProjectTeamAccess.propTypes = {
  organization: SentryTypes.Organization.isRequired,
  project: SentryTypes.Project,
};

const Section = styled('section')`
  margin-bottom: ${space(2)};
`;

const StyledLink = styled(Link)`
  display: block;
  margin-bottom: ${space(0.5)};
`;

export default ProjectTeamAccess;
