import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { DIN_91379A_EXT, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
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
        .matches(DIN_91379A_EXT, t('admin.klasse.rules.klassenname.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.klasse.rules.klassenname.noLeadingTrailingSpaces'))
        .required(t('admin.klasse.rules.klassenname.required')),
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
