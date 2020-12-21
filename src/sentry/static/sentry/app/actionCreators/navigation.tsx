import React from 'react';
import {InjectedRouter} from 'react-router/lib/Router';
import {Location} from 'history';

import {openModal} from 'sentry/actionCreators/modal';
import NavigationActions from 'sentry/actions/navigationActions';
import ContextPickerModal from 'sentry/components/contextPickerModal';

// TODO(ts): figure out better typing for react-router here
export function navigateTo(to: string, router: InjectedRouter & {location?: Location}) {
  // Check for placeholder params
  const needOrg = to.indexOf(':orgId') > -1;
  const needProject = to.indexOf(':projectId') > -1;
  const comingFromProjectId = router?.location?.query?.project;

  if (needOrg || needProject) {
    openModal(
      modalProps => (
        <ContextPickerModal
          {...modalProps}
          nextPath={to}
          needOrg={needOrg}
          needProject={needProject}
          comingFromProjectId={
            Array.isArray(comingFromProjectId) ? '' : comingFromProjectId || ''
          }
          onFinish={path => {
            modalProps.closeModal();
            setTimeout(() => router.push(path), 0);
          }}
        />
      ),
      {}
    );
  } else {
    router.push(to);
  }
}

export function setLastRoute(route: string) {
  NavigationActions.setLastRoute(route);
}
