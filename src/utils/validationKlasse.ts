import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { DIN_91379A_EXT, HAS_LETTER_OR_NUMBER, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
import type { TypedSchema } from 'vee-validate';

type ValidationSchema = {
  selectedSchule: string;
  selectedKlassenname: string;
};

export const getValidationSchema = (t: (key: string) => string): TypedSchema<ValidationSchema> => {
  return toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.klasse.rules.schule.required')),
      selectedKlassenname: string()
        .matches(HAS_LETTER_OR_NUMBER, t('admin.klasse.rules.klassenname.mustContainLetterOrNumber')) // Specific error for no letters/numbers
        .matches(DIN_91379A_EXT, t('admin.klasse.rules.klassenname.matches')) // Generic validation for class name format
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.klasse.rules.klassenname.noLeadingTrailingSpaces')) // Error for leading/trailing spaces
        .required(t('admin.klasse.rules.klassenname.required')), // Error for empty value
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
