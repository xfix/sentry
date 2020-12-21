import React from 'react';
import {Location} from 'history';

import {Organization} from 'sentry/types';
import EventView from 'sentry/utils/discover/eventView';
import {WebVital} from 'sentry/utils/discover/fields';
import VitalsCardDiscoverQuery from 'sentry/views/performance/vitalDetail/vitalsCardsDiscoverQuery';

import {VitalsCard} from '../vitalsCards';

type Props = {
  eventView: EventView;
  organization: Organization;
  location: Location;
  vitalName: WebVital;
  hideBar?: boolean;
  hideVitalPercentNames?: boolean;
  hideDurationDetail?: boolean;
};

export default function vitalInfo(props: Props) {
  const {
    vitalName,
    eventView,
    organization,
    location,
    hideVitalPercentNames,
    hideDurationDetail,
  } = props;
  return (
    <VitalsCardDiscoverQuery
      eventView={eventView}
      orgSlug={organization.slug}
      location={location}
      onlyVital={vitalName}
    >
      {({isLoading, tableData}) => (
        <React.Fragment>
          <VitalsCard
            tableData={tableData}
            isLoading={isLoading}
            {...props}
            noBorder
            showVitalPercentNames={!hideVitalPercentNames}
            showDurationDetail={!hideDurationDetail}
          />
        </React.Fragment>
      )}
    </VitalsCardDiscoverQuery>
  );
}
