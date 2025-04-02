import type { Ref } from 'vue';
import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { DIN_91379A_EXT, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';

type ValidationSchema = {
  selectedSchultraegerform: string;
  selectedSchultraegername: string;
};

export type SchultraegerFieldDefinitions = {
  selectedSchultraegerform: Ref<string | undefined>;
  selectedSchultraegername: Ref<string | undefined>;
  selectedSchultraegernameProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
};

export const getValidationSchema = (t: (key: string) => string): TypedSchema<ValidationSchema> => {
  return toTypedSchema(
    object({
      selectedSchultraegername: string()
        .matches(DIN_91379A_EXT, t('admin.schultraeger.rules.schultraegername.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.schultraeger.rules.schultraegername.noLeadingTrailingSpaces'))
        .required(t('admin.schultraeger.rules.schultraegername.required')),
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

export const getSchultraegerFieldDefinitions = (
  formContext: ReturnType<typeof useForm>,
): SchultraegerFieldDefinitions => {
  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField } = formContext;

  const [selectedSchultraegerform]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchultraegerform', vuetifyConfig);
  const [selectedSchultraegername, selectedSchultraegernameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchultraegername', vuetifyConfig);

  return {
    selectedSchultraegerform,
    selectedSchultraegername,
    selectedSchultraegernameProps,
  };
};

export const getDirtyState = (formContext: ReturnType<typeof useForm>): boolean => {
  return formContext.isFieldDirty('selectedSchultraegerform') || formContext.isFieldDirty('selectedSchultraegername');
};
