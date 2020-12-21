import React from 'react';

import EventDataSection from 'sentry/components/events/eventDataSection';
import Line from 'sentry/components/events/interfaces/frame/line';
import {t} from 'sentry/locale';
import {Event, Frame} from 'sentry/types';

type Props = {
  type: string;
  data: Frame;
  event: Event;
};

const TemplateInterface = ({type, data, event}: Props) => (
  <EventDataSection type={type} title={t('Template')}>
    <div className="traceback no-exception">
      <ul>
        <Line data={data} event={event} registers={{}} components={[]} isExpanded />
      </ul>
    </div>
  </EventDataSection>
);
export default TemplateInterface;
