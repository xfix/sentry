import React from 'react';

import {openModal} from 'sentry/actionCreators/modal';
import Access from 'sentry/components/acl/access';
import Button from 'sentry/components/button';
import {IconAdd} from 'sentry/icons';
import {t} from 'sentry/locale';
import {LightWeightOrganization} from 'sentry/types';

import CreateSavedSearchModal from './createSavedSearchModal';

type Props = {
  query: string;
  organization: LightWeightOrganization;
  buttonClassName?: string;
  iconOnly?: boolean;
  withTooltip?: boolean;
};

const CreateSavedSearchButton = ({
  buttonClassName,
  withTooltip,
  iconOnly,
  organization,
  ...rest
}: Props) => (
  <Access organization={organization} access={['org:write']}>
    <Button
      title={withTooltip ? t('Add to organization saved searches') : undefined}
      onClick={() =>
        openModal(deps => (
          <CreateSavedSearchModal organization={organization} {...rest} {...deps} />
        ))
      }
      data-test-id="save-current-search"
      size="zero"
      borderless
      type="button"
      aria-label={t('Add to organization saved searches')}
      icon={<IconAdd size="xs" />}
      className={buttonClassName}
    >
      {!iconOnly && t('Create Saved Search')}
    </Button>
  </Access>
);

export default CreateSavedSearchButton;
