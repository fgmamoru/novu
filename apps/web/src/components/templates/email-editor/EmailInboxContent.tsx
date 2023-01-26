import { Grid, useMantineTheme } from '@mantine/core';
import { format } from 'date-fns';
import { Controller, useFormContext } from 'react-hook-form';
import { colors, Input, Select } from '../../../design-system';
import { EmailIntegrationInfo } from '../../../pages/templates/editor/EmailIntegrationInfo';
import { useLayouts } from '../../../api/hooks/use-layouts';
import { useEffect } from 'react';

export const EmailInboxContent = ({
  integration,
  index,
  readonly,
}: {
  index: number;
  readonly: boolean;
  integration: any;
}) => {
  const theme = useMantineTheme();
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { layouts, isLoading } = useLayouts(0, 100);

  useEffect(() => {
    const layout = getValues(`steps.${index}.template.layoutId`);
    if (layouts?.length && !layout) {
      getDefaultLayout();
    }
  }, [layouts]);

  function getDefaultLayout() {
    const defaultLayout = layouts?.find((layout) => layout.isDefault);
    setTimeout(() => {
      setValue(`steps.${index}.template.layoutId`, defaultLayout?._id, { shouldValidate: true });
    }, 0);
  }

  return (
    <div
      style={{
        background: theme.colorScheme === 'dark' ? colors.B17 : colors.B98,
        borderRadius: '7px',
        marginBottom: '40px',
        padding: '5px 10px',
      }}
    >
      <Grid grow justify="center" align="stretch">
        <Grid.Col span={3}>
          <div
            style={{
              padding: '15px',
              borderRadius: '7px',
              border: `1px solid ${theme.colorScheme === 'dark' ? colors.B30 : colors.B80}`,
              margin: '5px 0px',
            }}
          >
            <EmailIntegrationInfo integration={integration} field={'from'} />
          </div>
        </Grid.Col>
        <Grid.Col span={4}>
          <div>
            <Controller
              name={`steps.${index}.template.subject` as any}
              control={control}
              render={({ field }) => {
                return (
                  <Input
                    {...field}
                    required
                    error={errors?.steps ? errors.steps[index]?.template?.subject?.message : undefined}
                    disabled={readonly}
                    value={field.value}
                    placeholder="Type the email subject..."
                    data-test-id="emailSubject"
                  />
                );
              }}
            />
          </div>
        </Grid.Col>
        <Grid.Col span={4}>
          <Controller
            name={`steps.${index}.template.preheader` as any}
            control={control}
            render={({ field, fieldState }) => {
              return (
                <Input
                  {...field}
                  error={fieldState.error?.message}
                  disabled={readonly}
                  value={field.value}
                  placeholder="Preheader..."
                  data-test-id="emailPreheader"
                />
              );
            }}
          />
        </Grid.Col>
        <Grid.Col
          span={1}
          style={{
            color: colors.B60,
            fontWeight: 'normal',
            alignSelf: 'center',
            justifyContent: 'stretch',
          }}
        >
          {format(new Date(), 'MMM dd')}
        </Grid.Col>
      </Grid>
      <Controller
        name={`steps.${index}.template.layoutId` as any}
        control={control}
        render={({ field }) => {
          return (
            <Select
              {...field}
              label="Layouts"
              data-test-id="templates-layout"
              loading={isLoading}
              disabled={readonly}
              required
              error={errors?.steps ? errors?.steps[index]?.template?.layoutId?.message : undefined}
              searchable
              placeholder="Select layout"
              data={(layouts || []).map((layout) => ({ value: layout._id as string, label: layout.name }))}
            />
          );
        }}
      />
    </div>
  );
};
