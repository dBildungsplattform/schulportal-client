import type { Ref } from 'vue';
import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { DIN_91379A_EXT } from '@/utils/validation';
import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
import type { RolleFormType, RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';

type ValidationSchema = {
  selectedRollenArt: string;
  selectedRollenName: string;
  selectedAdministrationsebene: string;
};

export type RolleFieldDefinitions = {
  selectedAdministrationsebene: Ref<string | undefined>;
  selectedAdministrationsebeneProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  selectedRollenArt: Ref<RollenArt | undefined>;
  selectedRollenArtProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  selectedRollenName: Ref<string | undefined>;
  selectedRollenNameProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  selectedMerkmale: Ref<RollenMerkmal[] | undefined>;
  selectedMerkmaleProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  selectedServiceProviders: Ref<string[] | undefined>;
  selectedServiceProvidersProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  selectedSystemRechte: Ref<RollenSystemRecht[] | undefined>;
  selectedSystemRechteProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
};

export const getValidationSchema = (t: (key: string) => string): TypedSchema<ValidationSchema> => {
  return toTypedSchema(
    object({
      selectedRollenArt: string().required(t('admin.rolle.rules.rollenart.required')),
      selectedRollenName: string()
        .max(200, t('admin.rolle.rules.rollenname.length'))
        .matches(DIN_91379A_EXT, t('admin.rolle.rules.rollenname.matches'))
        .required(t('admin.rolle.rules.rollenname.required')),
      selectedAdministrationsebene: string().required(t('admin.administrationsebene.rules.required')),
    }),
  );
};

export const getVuetifyConfig = (state: {
  errors: Array<string>;
}): { props: { error: boolean; 'error-messages': Array<string> } } => ({
  props: {
    error: !!state.errors.length,
    'error-messages': state.errors,
  },
});

const vuetifyConfig = (state: {
  errors: Array<string>;
}): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);

export const getRolleFieldDefinitions = (formContext: ReturnType<typeof useForm>): RolleFieldDefinitions => {
  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField } = formContext;

  const [selectedAdministrationsebene, selectedAdministrationsebeneProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedAdministrationsebene', vuetifyConfig);

  const [selectedRollenArt, selectedRollenArtProps]: [
    Ref<RollenArt | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRollenArt', vuetifyConfig);

  const [selectedRollenName, selectedRollenNameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRollenName', vuetifyConfig);

  const [selectedMerkmale, selectedMerkmaleProps]: [
    Ref<RollenMerkmal[] | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedMerkmale', vuetifyConfig);

  const [selectedServiceProviders, selectedServiceProvidersProps]: [
    Ref<string[] | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedServiceProviders', vuetifyConfig);

  const [selectedSystemRechte, selectedSystemRechteProps]: [
    Ref<RollenSystemRecht[] | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSystemRechte', vuetifyConfig);

  return {
    selectedAdministrationsebene,
    selectedAdministrationsebeneProps,
    selectedRollenArt,
    selectedRollenArtProps,
    selectedRollenName,
    selectedRollenNameProps,
    selectedMerkmale,
    selectedMerkmaleProps,
    selectedServiceProviders,
    selectedServiceProvidersProps,
    selectedSystemRechte,
    selectedSystemRechteProps,
  };
};

export const getDirtyState = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/typedef
  const { isFieldDirty } = useForm<RolleFormType>({
    validationSchema: getValidationSchema,
  });

  return (
    isFieldDirty('selectedAdministrationsebene') ||
    isFieldDirty('selectedRollenArt') ||
    isFieldDirty('selectedRollenName') ||
    isFieldDirty('selectedMerkmale') ||
    isFieldDirty('selectedSystemRechte')
  );
};
