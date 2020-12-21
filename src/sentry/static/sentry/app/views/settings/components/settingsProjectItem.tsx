import React from 'react';
import styled from '@emotion/styled';

import Link from 'sentry/components/links/link';
import ProjectLabel from 'sentry/components/projectLabel';
import BookmarkStar from 'sentry/components/projects/bookmarkStar';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';

type Props = {
  project: Project;
  organization: Organization;
};

type State = {
  isBookmarked: boolean;
};

class ProjectItem extends React.Component<Props, State> {
  state = {
    isBookmarked: this.props.project.isBookmarked,
  };

  handleToggleBookmark = (isBookmarked: State['isBookmarked']) => {
    this.setState({isBookmarked});
  };

  render() {
    const {project, organization} = this.props;

    return (
      <Wrapper>
        <BookmarkLink
          organization={organization}
          project={project}
          isBookmarked={this.state.isBookmarked}
          onToggle={this.handleToggleBookmark}
        />
        <Link to={`/settings/${organization.slug}/projects/${project.slug}/`}>
          <ProjectLabel project={project} />
        </Link>
      </Wrapper>
    );
  }
}

const Wrapper = styled('div')`
  display: flex;
  align-items: center;
`;

const BookmarkLink = styled(BookmarkStar)`
  margin-right: ${space(1)};
  margin-top: -${space(0.25)};
`;

export default ProjectItem;
