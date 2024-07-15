import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { DIN_91379A_EXT } from '@/utils/validation';
import type { TypedSchema } from 'vee-validate';

interface ValidationSchema {
  selectedRollenArt: string;
  selectedRollenName: string;
  selectedAdministrationsebene: string;
}


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
