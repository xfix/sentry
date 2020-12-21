import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import Button from 'sentry/components/button';
import Collapsible from 'sentry/components/collapsible';
import ProjectBadge from 'sentry/components/idBadge/projectBadge';
import Link from 'sentry/components/links/link';
import {tn} from 'sentry/locale';
import overflowEllipsis from 'sentry/styles/overflowEllipsis';
import space from 'sentry/styles/space';
import {ReleaseProject} from 'sentry/types';

import {SectionHeading, Wrapper} from './styles';

type Props = {
  projects: ReleaseProject[];
  location: Location;
};

function OtherProjects({projects, location}: Props) {
  return (
    <Wrapper>
      <SectionHeading>
        {tn(
          'Other Project for This Release',
          'Other Projects for This Release',
          projects.length
        )}
      </SectionHeading>

      <Collapsible
        expandButton={({onExpand, numberOfCollapsedItems}) => (
          <Button priority="link" onClick={onExpand}>
            {tn(
              'Show %s collapsed project',
              'Show %s collapsed projects',
              numberOfCollapsedItems
            )}
          </Button>
        )}
      >
        {projects.map(project => (
          <Row key={project.id}>
            <StyledLink
              to={{
                pathname: location.pathname,
                query: {...location.query, project: project.id, yAxis: undefined},
              }}
            >
              <ProjectBadge project={project} avatarSize={16} />
            </StyledLink>
          </Row>
        ))}
      </Collapsible>
    </Wrapper>
  );
}

const Row = styled('div')`
  margin-bottom: ${space(0.25)};
  font-size: ${p => p.theme.fontSizeMedium};
  color: ${p => p.theme.blue300};
  ${overflowEllipsis}
`;

const StyledLink = styled(Link)`
  display: inline-block;
`;

export default OtherProjects;
