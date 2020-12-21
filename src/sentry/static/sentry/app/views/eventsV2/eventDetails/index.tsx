import React from 'react';
import {Params} from 'react-router/lib/Router';
import styled from '@emotion/styled';
import {Location} from 'history';
import PropTypes from 'prop-types';

import LightWeightNoProjectMessage from 'sentry/components/lightWeightNoProjectMessage';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import {PageContent} from 'sentry/styles/organization';
import {Organization} from 'sentry/types';
import EventView from 'sentry/utils/discover/eventView';
import withOrganization from 'sentry/utils/withOrganization';

import EventDetailsContent from './content';

type Props = {
  organization: Organization;
  location: Location;
  params: Params;
};

class EventDetails extends React.Component<Props> {
  static propTypes: any = {
    organization: SentryTypes.Organization.isRequired,
    location: PropTypes.object.isRequired,
  };

  getEventSlug = (): string => {
    const {eventSlug} = this.props.params;

    if (typeof eventSlug === 'string') {
      return eventSlug.trim();
    }

    return '';
  };

  getEventView = (): EventView => {
    const {location} = this.props;

    return EventView.fromLocation(location);
  };

  getDocumentTitle = (name: string | undefined): Array<string> =>
    typeof name === 'string' && String(name).trim().length > 0
      ? [String(name).trim(), t('Discover')]
      : [t('Discover')];

  render() {
    const {organization, location, params} = this.props;
    const eventView = this.getEventView();

    const documentTitle = this.getDocumentTitle(eventView.name).join(' - ');

    return (
      <SentryDocumentTitle title={documentTitle} objSlug={organization.slug}>
        <StyledPageContent>
          <LightWeightNoProjectMessage organization={organization}>
            <EventDetailsContent
              organization={organization}
              location={location}
              params={params}
              eventView={eventView}
              eventSlug={this.getEventSlug()}
            />
          </LightWeightNoProjectMessage>
        </StyledPageContent>
      </SentryDocumentTitle>
    );
  }
}

export default withOrganization(EventDetails);

const StyledPageContent = styled(PageContent)`
  padding: 0;
`;
