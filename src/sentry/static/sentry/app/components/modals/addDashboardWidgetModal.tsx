import React from 'react';
import styled from '@emotion/styled';
import cloneDeep from 'lodash/cloneDeep';
import pick from 'lodash/pick';
import set from 'lodash/set';

import {validateWidget} from 'sentry/actionCreators/dashboards';
import {addSuccessMessage} from 'sentry/actionCreators/indicator';
import {ModalRenderProps} from 'sentry/actionCreators/modal';
import {Client} from 'sentry/api';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import WidgetQueryForm from 'sentry/components/dashboards/widgetQueryForm';
import SelectControl from 'sentry/components/forms/selectControl';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {GlobalSelection, Organization, TagCollection} from 'sentry/types';
import withApi from 'sentry/utils/withApi';
import withGlobalSelection from 'sentry/utils/withGlobalSelection';
import withTags from 'sentry/utils/withTags';
import {DISPLAY_TYPE_CHOICES} from 'sentry/views/dashboardsV2/data';
import {DashboardDetails, Widget, WidgetQuery} from 'sentry/views/dashboardsV2/types';
import WidgetCard from 'sentry/views/dashboardsV2/widgetCard';
import {generateFieldOptions} from 'sentry/views/eventsV2/utils';
import Input from 'sentry/views/settings/components/forms/controls/input';
import Field from 'sentry/views/settings/components/forms/field';

export type DashboardWidgetModalOptions = {
  organization: Organization;
  dashboard: DashboardDetails;
  selection: GlobalSelection;
  widget?: Widget;
  onAddWidget: (data: Widget) => void;
  onUpdateWidget?: (nextWidget: Widget) => void;
};

type Props = ModalRenderProps &
  DashboardWidgetModalOptions & {
    api: Client;
    organization: Organization;
    selection: GlobalSelection;
    tags: TagCollection;
  };

type ValidationError = {
  [key: string]: string[] | ValidationError[] | ValidationError;
};

type FlatValidationError = {
  [key: string]: string | FlatValidationError[] | FlatValidationError;
};

type State = {
  title: string;
  displayType: Widget['displayType'];
  interval: Widget['interval'];
  queries: Widget['queries'];
  errors?: Record<string, any>;
  loading: boolean;
};

const newQuery = {
  name: '',
  fields: ['count()'],
  conditions: '',
};

function mapErrors(
  data: ValidationError,
  update: FlatValidationError
): FlatValidationError {
  Object.keys(data).forEach((key: string) => {
    const value = data[key];
    // Recurse into nested objects.
    if (Array.isArray(value) && typeof value[0] === 'string') {
      update[key] = value[0];
    } else if (Array.isArray(value) && typeof value[0] === 'object') {
      update[key] = (value as ValidationError[]).map(item => mapErrors(item, {}));
    } else {
      update[key] = mapErrors(value as ValidationError, {});
    }
  });

  return update;
}

class AddDashboardWidgetModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const {widget} = props;

    if (!widget) {
      this.state = {
        title: '',
        displayType: 'line',
        interval: '5m',
        queries: [{...newQuery}],
        errors: undefined,
        loading: false,
      };
      return;
    }

    this.state = {
      title: widget.title,
      displayType: widget.displayType,
      interval: widget.interval,
      queries: widget.queries,
      errors: undefined,
      loading: false,
    };
  }

  handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const {
      api,
      closeModal,
      organization,
      onAddWidget,
      onUpdateWidget,
      widget: previousWidget,
    } = this.props;
    this.setState({loading: true});
    try {
      const widgetData: Widget = pick(this.state, [
        'title',
        'displayType',
        'interval',
        'queries',
      ]);
      await validateWidget(api, organization.slug, widgetData);

      if (typeof onUpdateWidget === 'function' && !!previousWidget) {
        onUpdateWidget({
          id: previousWidget?.id,
          ...widgetData,
        });
        addSuccessMessage(t('Updated widget.'));
      } else {
        onAddWidget(widgetData);
        addSuccessMessage(t('Added widget.'));
      }

      closeModal();
    } catch (err) {
      const errors = mapErrors(err?.responseJSON ?? {}, {});
      this.setState({errors});
    } finally {
      this.setState({loading: false});
    }
  };

  handleFieldChange = (field: string) => (value: string) => {
    this.setState(prevState => {
      const newState = cloneDeep(prevState);
      set(newState, field, value);
      return newState;
    });
  };

  handleQueryChange = (widgetQuery: WidgetQuery, index: number) => {
    this.setState(prevState => {
      const newState = cloneDeep(prevState);
      set(newState, `queries.${index}`, widgetQuery);

      return newState;
    });
  };

  handleQueryRemove = (index: number) => {
    this.setState(prevState => {
      const newState = cloneDeep(prevState);
      newState.queries.splice(index, index + 1);

      return newState;
    });
  };

  render() {
    const {
      Footer,
      Body,
      Header,
      api,
      closeModal,
      organization,
      selection,
      tags,
      onUpdateWidget,
      widget: previousWidget,
    } = this.props;
    const state = this.state;
    const errors = state.errors;

    // TODO(mark) Figure out how to get measurement keys here.
    const fieldOptions = generateFieldOptions({
      organization,
      tagKeys: Object.values(tags).map(({key}) => key),
      measurementKeys: [],
    });

    const isUpdatingWidget = typeof onUpdateWidget === 'function' && !!previousWidget;

    return (
      <React.Fragment>
        <Header closeButton onHide={closeModal}>
          <h4>{isUpdatingWidget ? t('Edit Widget') : t('Add Widget')}</h4>
        </Header>
        <Body>
          <DoubleFieldWrapper>
            <Field
              data-test-id="widget-name"
              label={t('Widget Name')}
              inline={false}
              flexibleControlStateSize
              stacked
              error={errors?.title}
              required
            >
              <Input
                type="text"
                name="title"
                required
                value={state.title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.handleFieldChange('title')(event.target.value);
                }}
              />
            </Field>
            <Field
              data-test-id="chart-type"
              label={t('Chart Type')}
              inline={false}
              flexibleControlStateSize
              stacked
              error={errors?.displayType}
              required
            >
              <SelectControl
                deprecatedSelectControl
                required
                options={DISPLAY_TYPE_CHOICES.slice()}
                name="displayType"
                label={t('Chart Style')}
                value={state.displayType}
                onChange={this.handleFieldChange('displayType')}
              />
            </Field>
          </DoubleFieldWrapper>
          {state.queries.map((query, i) => {
            return (
              <WidgetQueryForm
                key={i}
                api={api}
                organization={organization}
                selection={selection}
                fieldOptions={fieldOptions}
                widgetQuery={query}
                canRemove={state.queries.length > 1}
                onRemove={() => this.handleQueryRemove(i)}
                onChange={(widgetQuery: WidgetQuery) =>
                  this.handleQueryChange(widgetQuery, i)
                }
                errors={errors?.queries?.[i]}
              />
            );
          })}
          <WidgetCard
            api={api}
            organization={organization}
            selection={selection}
            widget={this.state}
            isEditing={false}
            onDelete={() => undefined}
            onEdit={() => undefined}
          />
        </Body>
        <Footer>
          <ButtonBar gap={1}>
            <Button
              external
              href="https://docs.sentry.io/product/error-monitoring/dashboards/"
            >
              {t('Read the docs')}
            </Button>
            <Button
              data-test-id="add-widget"
              priority="primary"
              type="button"
              onClick={this.handleSubmit}
              disabled={state.loading}
              busy={state.loading}
            >
              {isUpdatingWidget ? t('Update Widget') : t('Add Widget')}
            </Button>
          </ButtonBar>
        </Footer>
      </React.Fragment>
    );
  }
}

const DoubleFieldWrapper = styled('div')`
  display: inline-grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: ${space(1)};
  width: 100%;
`;

export default withApi(withGlobalSelection(withTags(AddDashboardWidgetModal)));
