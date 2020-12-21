import React from 'react';

import Feature from 'sentry/components/acl/feature';
import {Organization} from 'sentry/types';
import withOrganization from 'sentry/utils/withOrganization';

type Props = {
  organization: Organization;
};

class AlertsContainer extends React.Component<Props> {
  render() {
    const {children, organization} = this.props;
    return (
      <Feature organization={organization} features={['incidents']}>
        {({hasFeature: hasMetricAlerts}) => (
          <React.Fragment>
            {children && React.isValidElement(children)
              ? React.cloneElement(children, {
                  organization,
                  hasMetricAlerts,
                })
              : children}
          </React.Fragment>
        )}
      </Feature>
    );
  }
}

export default withOrganization(AlertsContainer);
