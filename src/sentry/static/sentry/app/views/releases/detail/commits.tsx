import React from 'react';
import {RouteComponentProps} from 'react-router';

import {Client} from 'sentry/api';
import CommitRow from 'sentry/components/commitRow';
import {Body, Main} from 'sentry/components/layouts/thirds';
import Pagination from 'sentry/components/pagination';
import {Panel, PanelBody, PanelHeader} from 'sentry/components/panels';
import {t} from 'sentry/locale';
import {Commit, Repository} from 'sentry/types';
import {formatVersion} from 'sentry/utils/formatters';
import routeTitleGen from 'sentry/utils/routeTitle';
import withApi from 'sentry/utils/withApi';
import AsyncView from 'sentry/views/asyncView';

import EmptyState from './emptyState';
import RepositorySwitcher from './repositorySwitcher';
import {getCommitsByRepository, getQuery, getReposToRender} from './utils';
import withRepositories from './withRepositories';

type Props = RouteComponentProps<{orgId: string; release: string}, {}> & {
  api: Client;
  repositories: Array<Repository>;
  projectSlug: string;
  activeRepository?: Repository;
} & AsyncView['props'];

type State = {
  commits: Commit[];
} & AsyncView['state'];

class Commits extends AsyncView<Props, State> {
  getTitle() {
    const {params} = this.props;
    const {orgId} = params;

    return routeTitleGen(
      t('Commits - Release %s', formatVersion(params.release)),
      orgId,
      false
    );
  }

  getDefaultState(): State {
    return {
      ...super.getDefaultState(),
      commits: [],
    };
  }

  getEndpoints(): ReturnType<AsyncView['getEndpoints']> {
    const {params, projectSlug, activeRepository, location} = this.props;
    const {orgId, release} = params;
    const query = getQuery({location, activeRepository});

    return [
      [
        'commits',
        `/projects/${orgId}/${projectSlug}/releases/${encodeURIComponent(
          release
        )}/commits/`,
        {query},
      ],
    ];
  }

  renderContent() {
    const {commits, commitsPageLinks} = this.state;
    const {activeRepository} = this.props;

    if (!commits.length) {
      return (
        <EmptyState>
          {!activeRepository
            ? t('There are no commits associated with this release.')
            : t(
                'There are no commits associated with this release in the %s repository.',
                activeRepository.name
              )}
        </EmptyState>
      );
    }

    const commitsByRepository = getCommitsByRepository(commits);
    const reposToRender = getReposToRender(Object.keys(commitsByRepository));

    return (
      <React.Fragment>
        {reposToRender.map(repoName => (
          <Panel key={repoName}>
            <PanelHeader>{repoName}</PanelHeader>
            <PanelBody>
              {commitsByRepository[repoName]?.map(commit => (
                <CommitRow key={commit.id} commit={commit} />
              ))}
            </PanelBody>
          </Panel>
        ))}
        <Pagination pageLinks={commitsPageLinks} />
      </React.Fragment>
    );
  }

  renderBody() {
    const {location, router, activeRepository, repositories} = this.props;

    return (
      <React.Fragment>
        {repositories.length > 1 && (
          <RepositorySwitcher
            repositories={repositories}
            activeRepository={activeRepository}
            location={location}
            router={router}
          />
        )}
        {this.renderContent()}
      </React.Fragment>
    );
  }

  renderComponent() {
    return (
      <Body>
        <Main fullWidth>{super.renderComponent()}</Main>
      </Body>
    );
  }
}

export default withApi(withRepositories(Commits));
