import React from 'react';

import Role from 'sentry/components/acl/role';
import {EventAttachment, Organization} from 'sentry/types';
import withOrganization from 'sentry/utils/withOrganization';

type Props = {
  organization: Organization;
  projectId: string;
  eventId: string;
  attachment: EventAttachment;
  children: (downloadUrl: string | null) => React.ReactNode;
};

class AttachmentUrl extends React.PureComponent<Props> {
  getDownloadUrl() {
    const {attachment, organization, eventId, projectId} = this.props;
    return `/api/0/projects/${organization.slug}/${projectId}/events/${eventId}/attachments/${attachment.id}/`;
  }

  render() {
    const {children, organization} = this.props;
    return (
      <Role role={organization.attachmentsRole}>
        {({hasRole}) => children(hasRole ? this.getDownloadUrl() : null)}
      </Role>
    );
  }
}

export default withOrganization(AttachmentUrl);
