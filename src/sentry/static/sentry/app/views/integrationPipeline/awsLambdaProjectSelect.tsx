import React from 'react';
import styled from '@emotion/styled';

import {t} from 'sentry/locale';
import {Project} from 'sentry/types';
import {uniqueId} from 'sentry/utils/guid';
import Form from 'sentry/views/settings/components/forms/form';
import JsonForm from 'sentry/views/settings/components/forms/jsonForm';
import {JsonFormObject} from 'sentry/views/settings/components/forms/type';

const ID_NAME = 'AWS_EXTERNAL_ID';
const getAwsExternalId = () => {
  let awsExternalId = window.localStorage.getItem(ID_NAME);
  if (!awsExternalId) {
    awsExternalId = uniqueId();
    window.localStorage.setItem(ID_NAME, awsExternalId);
  }
  return awsExternalId;
};

export default function AwsLambdaProjectSelect({projects}: {projects: Project[]}) {
  const formFields: JsonFormObject = {
    title: t('Select a project to use for your AWS Lambda functions'),
    fields: [
      {
        name: 'projectId',
        type: 'sentry_project_selector',
        required: true,
        label: t('Project'),
        inline: false,
        projects,
      },
    ],
  };
  const handleSubmit = ({projectId}: {projectId: string}) => {
    // redirect to the same URL but with the project_id set
    const {
      location: {origin},
    } = window;
    const awsExternalId = getAwsExternalId();
    const newUrl = `${origin}/extensions/aws_lambda/setup/?project_id=${projectId}&aws_external_id=${awsExternalId}`;
    window.location.replace(newUrl);
  };
  return (
    <StyledForm onSubmit={handleSubmit}>
      <JsonForm forms={[formFields]} />
    </StyledForm>
  );
}

const StyledForm = styled(Form)`
  max-width: 500px;
  margin: 50px;
`;
