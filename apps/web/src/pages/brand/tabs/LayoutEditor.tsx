import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { EmailCustomCodeEditor } from '../../../components/templates/email-editor/EmailCustomCodeEditor';
import { Center, Grid, Group, Modal, Title, useMantineTheme } from '@mantine/core';
import { ArrowLeft } from '../../../design-system/icons';
import { Button, Checkbox, colors, Input, Text, LoadingOverlay, shadows } from '../../../design-system';
import { useEnvController } from '../../../store/use-env-controller';
import { errorMessage, successMessage } from '../../../utils/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { parse } from '@handlebars/parser';
import { getTemplateVariables, ITemplateVariable, isReservedVariableName, LayoutId } from '@novu/shared';

import { QueryKeys } from '../../../api/query.keys';
import { VariableManager } from '../../../components/templates/VariableManager';
import { VariablesManagement } from '../../../components/templates/email-editor/variables-management/VariablesManagement';
import { useLayoutsEditor } from '../../../api/hooks/use-layouts-editor';
import { usePrompt } from '../../../hooks/use-prompt';
import { UnsavedChangesModal } from '../../../components/templates/UnsavedChangesModal';

interface ILayoutForm {
  content: string;
  name: string;
  description: string;
  isDefault: boolean;
  variables: ITemplateVariable[];
}
const defaultFormValues = {
  content: '',
  name: '',
  description: '',
  isDefault: false,
  variables: [],
};
export function LayoutEditor({
  id = '',
  editMode = false,
  goBack,
}: {
  id?: string;
  editMode?: boolean;
  goBack: () => void;
}) {
  const { readonly, environment } = useEnvController();
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const [ast, setAst] = useState<any>({ body: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [layoutId, setLayoutId] = useState<LayoutId>(id);

  const { layout, isLoading, createNewLayout, updateLayout } = useLayoutsEditor(layoutId);

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { isDirty },
  } = useForm<ILayoutForm>({
    defaultValues: defaultFormValues,
  });
  const [showModal, confirmNavigation, cancelNavigation] = usePrompt(isDirty);

  const layoutContent = watch('content');
  const variablesArray = useFieldArray({ control, name: `variables` });
  const variableArray = watch(`variables`, []);

  useEffect(() => {
    if (layout) {
      if (layout.content) {
        setValue('content', layout?.content);
      }
      if (layout.name) {
        setValue('name', layout?.name);
      }
      if (layout.description) {
        setValue('description', layout?.description);
      }
      if (layout.variables) {
        setValue('variables', layout?.variables);
      }
      if (layout.isDefault != null) {
        setValue('isDefault', layout?.isDefault);
      }
    }
  }, [layout]);

  useEffect(() => {
    if (environment && layout) {
      if (environment._id !== layout._environmentId) {
        if (layout._parentId) {
          setLayoutId(layout._parentId);
        } else {
          goBack();
        }
      }
    }
  }, [environment, layout]);

  useMemo(() => {
    const variables = getTemplateVariables(ast.body).filter(
      ({ name }) => !isReservedVariableName(name)
    ) as ITemplateVariable[];
    const arrayFields = [...(variableArray || [])];

    variables.forEach((vari) => {
      if (!arrayFields.find((field) => field.name === vari.name)) {
        arrayFields.push(vari);
      }
    });
    arrayFields.forEach((vari, ind) => {
      if (!variables.find((field) => field.name === vari.name)) {
        delete arrayFields[ind];
      }
    });

    variablesArray.replace(arrayFields.filter((field) => !!field));
  }, [ast]);

  useEffect(() => {
    try {
      setAst(parse(layoutContent));
    } catch (e) {
      return;
    }
  }, [layoutContent]);

  async function onSubmitLayout(data) {
    try {
      if (editMode) {
        await updateLayout({ layoutId: id, data });
      } else {
        await createNewLayout(data);
      }
      await queryClient.refetchQueries([QueryKeys.getLayoutsList]);

      successMessage(`Layout ${editMode ? 'Updated' : 'Created'}!`);
      goBack();
    } catch (e: any) {
      errorMessage(e.message || 'Unexpected error occurred');
    }
  }

  return (
    <LoadingOverlay visible={isLoading}>
      <Center mb={15} data-test-id="go-back-button" onClick={() => goBack()} inline style={{ cursor: 'pointer' }}>
        <ArrowLeft color={colors.B60} />
        <Text ml={5} color={colors.B60}>
          Go Back
        </Text>
      </Center>
      <form name={'layout-form'} onSubmit={handleSubmit(onSubmitLayout)}>
        <Grid grow>
          <Grid.Col span={9}>
            <Grid gutter={30} grow>
              <Grid.Col md={5} sm={12}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      mb={30}
                      data-test-id="layout-name"
                      disabled={readonly}
                      required
                      value={field.value || ''}
                      label="Layout Name"
                      placeholder="Layout name goes here..."
                    />
                  )}
                />
              </Grid.Col>
              <Grid.Col md={5} sm={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ''}
                      disabled={readonly}
                      mb={30}
                      data-test-id="layout-description"
                      label="Layout Description"
                      placeholder="Describe your layout..."
                    />
                  )}
                />
              </Grid.Col>
            </Grid>

            <Controller
              name="content"
              data-test-id="layout-content"
              control={control}
              render={({ field }) => {
                return <EmailCustomCodeEditor onChange={field.onChange} value={field.value} />;
              }}
            />
          </Grid.Col>
          <Grid.Col
            span={3}
            style={{
              maxWidth: '350px',
            }}
          >
            <VariablesManagement
              index={0}
              openVariablesModal={() => {
                setModalOpen(true);
              }}
              path="variables"
              control={control}
            />
          </Grid.Col>
        </Grid>
        <Group position="right" py={20}>
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => {
              return (
                <Checkbox
                  checked={field.value === true}
                  disabled={readonly}
                  onChange={field.onChange}
                  data-test-id="is-default-layout"
                  label="Set as Default"
                />
              );
            }}
          />

          <Button disabled={readonly} submit data-test-id="submit-layout">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </Group>
      </form>
      <Modal
        opened={modalOpen}
        overlayColor={theme.colorScheme === 'dark' ? colors.BGDark : colors.BGLight}
        overlayOpacity={0.7}
        styles={{
          modal: {
            backgroundColor: theme.colorScheme === 'dark' ? colors.B15 : colors.white,
            width: '90%',
          },
          body: {
            paddingTop: '5px',
            paddingInline: '8px',
          },
        }}
        title={<Title>Variables</Title>}
        sx={{ backdropFilter: 'blur(10px)' }}
        shadow={theme.colorScheme === 'dark' ? shadows.dark : shadows.medium}
        radius="md"
        size="lg"
        onClose={() => {
          setModalOpen(false);
        }}
        centered
        overflow="inside"
      >
        <VariableManager index={0} variablesArray={variablesArray} path="" control={control} />
        <Group position="right">
          <Button
            data-test-id="close-var-manager-modal"
            mt={30}
            onClick={() => {
              setModalOpen(false);
            }}
          >
            Close
          </Button>
        </Group>
      </Modal>
      <UnsavedChangesModal
        isOpen={showModal}
        cancelNavigation={cancelNavigation}
        confirmNavigation={confirmNavigation}
      />
    </LoadingOverlay>
  );
}
