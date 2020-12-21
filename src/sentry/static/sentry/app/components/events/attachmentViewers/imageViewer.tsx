import React from 'react';

import {
  getAttachmentUrl,
  ViewerProps,
} from 'sentry/components/events/attachmentViewers/utils';
import {PanelItem} from 'sentry/components/panels';

export default function ImageViewer(props: ViewerProps) {
  return (
    <PanelItem justifyContent="center">
      <img src={getAttachmentUrl(props, true)} />
    </PanelItem>
  );
}
