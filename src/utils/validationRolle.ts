import type { Ref } from 'vue';
import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { DIN_91379A_EXT } from '@/utils/validation';
import { type BaseFieldProps, type TypedSchema } from 'vee-validate';
import type { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';

type ValidationSchema = {
  selectedRollenArt: string;
  selectedRollenName: string;
  selectedAdministrationsebene: string;
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

export const getRolleFieldDefinitions = (defineField) => {
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
