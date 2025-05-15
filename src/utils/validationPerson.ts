import { toTypedSchema } from '@vee-validate/yup';
import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
import { array, object, string, StringSchema, type AnyObject } from 'yup';
import { DDMMYYYY, DIN_91379A, NO_LEADING_TRAILING_SPACES } from './validation';
import { isBefristungspflichtRolle } from './befristung';
import { notInPast, isValidDate } from './date';
import { isLernRolle, isKopersRolle } from './validationPersonenkontext';
import type { ComputedRef, Ref } from 'vue';
import { type TranslatedRolleWithAttrs, useRollen } from '@/composables/useRollen';

export type PersonCreationForm = {
  selectedOrganisation: string;
  selectedRollen: string[];
  selectedVorname: string;
  selectedFamilienname: string;
  selectedKlasse: string;
  selectedBefristung: Date;
  selectedBefristungOption: string;
  selectedKopersNr: string;
};

const rollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

export const getValidationSchema = (
  t: (key: string) => string,
  hasNoKopersNr: Ref<boolean | undefined>,
): TypedSchema<PersonCreationForm> => {
  return toTypedSchema(
    object({
      selectedRollen: array()
        .of(string().required(t('admin.rolle.rules.rolle.required')))
        .min(1, t('admin.rolle.rules.rolle.required')),
      selectedVorname: string()
        .matches(DIN_91379A, t('admin.person.rules.vorname.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.vorname.noLeadingTrailingSpaces'))
        .min(2, t('admin.person.rules.vorname.min'))
        .required(t('admin.person.rules.vorname.required')),
      selectedFamilienname: string()
        .matches(DIN_91379A, t('admin.person.rules.familienname.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.familienname.noLeadingTrailingSpaces'))
        .min(2, t('admin.person.rules.familienname.min'))
        .required(t('admin.person.rules.familienname.required')),
      selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
      selectedKlasse: string().when('selectedRollen', {
        is: (selectedRolleIds: string[]) => isLernRolle(selectedRolleIds),
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
      }),
      selectedKopersNr: string()
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.kopersNr.noLeadingTrailingSpaces'))
        .when('selectedRollen', {
          is: (selectedRolleIds: string[]) => isKopersRolle(selectedRolleIds, rollen.value) && !hasNoKopersNr.value,
          then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
            schema.required(t('admin.person.rules.kopersNr.required')),
        }),
      selectedBefristung: string()
        .test('notInPast', t('admin.befristung.rules.pastDateNotAllowed'), notInPast)
        .test('isValidDate', t('admin.befristung.rules.invalidDateNotAllowed'), isValidDate)
        .matches(DDMMYYYY, t('admin.befristung.rules.format'))
        .when(['selectedRolle', 'selectedBefristungOption'], {
          is: (selectedRolleIds: string[], selectedBefristungOption: string | undefined) =>
            isBefristungspflichtRolle(selectedRolleIds) && selectedBefristungOption === undefined,
          then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
            schema.required(t('admin.befristung.rules.required')),
        }),
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

type FieldProps = BaseFieldProps & { error: boolean; 'error-messages': Array<string> };

type FieldDefinition<T> = [Ref<T>, Ref<FieldProps>];

export type PersonFieldDefinitions = {
  selectedOrganisation: Ref<string | undefined>;
  selectedOrganisationProps: Ref<FieldProps>;
  selectedRollen: Ref<string[] | undefined>;
  selectedRollenProps: Ref<FieldProps>;
  selectedVorname: Ref<string>;
  selectedVornameProps: Ref<FieldProps>;
  selectedFamilienname: Ref<string>;
  selectedFamiliennameProps: Ref<FieldProps>;
  selectedKlasse: Ref<string | undefined>;
  selectedKlasseProps: Ref<FieldProps>;
  selectedBefristung: Ref<string | undefined>;
  selectedBefristungProps: Ref<FieldProps>;
  selectedBefristungOption: Ref<string | undefined>;
  selectedBefristungOptionProps: Ref<FieldProps>;
  selectedKopersNr: Ref<string | undefined>;
  selectedKopersNrProps: Ref<FieldProps>;
};

export const getPersonFieldDefinitions = (formContext: ReturnType<typeof useForm>): PersonFieldDefinitions => {
  const [selectedOrganisation, selectedOrganisationProps]: FieldDefinition<string | undefined> =
    formContext.defineField('selectedOrganisation', getVuetifyConfig);
  const [selectedRollen, selectedRollenProps]: FieldDefinition<string[] | undefined> = formContext.defineField(
    'selectedRollen',
    getVuetifyConfig,
  );
  const [selectedVorname, selectedVornameProps]: FieldDefinition<string> = formContext.defineField(
    'selectedVorname',
    getVuetifyConfig,
  );
  const [selectedFamilienname, selectedFamiliennameProps]: FieldDefinition<string> = formContext.defineField(
    'selectedFamilienname',
    getVuetifyConfig,
  );
  const [selectedKlasse, selectedKlasseProps]: FieldDefinition<string | undefined> = formContext.defineField(
    'selectedKlasse',
    getVuetifyConfig,
  );
  const [selectedBefristung, selectedBefristungProps]: FieldDefinition<string | undefined> = formContext.defineField(
    'selectedBefristung',
    getVuetifyConfig,
  );
  const [selectedBefristungOption, selectedBefristungOptionProps]: FieldDefinition<string | undefined> =
    formContext.defineField('selectedBefristungOption', getVuetifyConfig);
  const [selectedKopersNr, selectedKopersNrProps]: FieldDefinition<string | undefined> = formContext.defineField(
    'selectedKopersNr',
    getVuetifyConfig,
  );

  return {
    selectedOrganisation,
    selectedOrganisationProps,
    selectedRollen,
    selectedRollenProps,
    selectedVorname,
    selectedVornameProps,
    selectedFamilienname,
    selectedFamiliennameProps,
    selectedKlasse,
    selectedKlasseProps,
    selectedBefristung,
    selectedBefristungProps,
    selectedBefristungOption,
    selectedBefristungOptionProps,
    selectedKopersNr,
    selectedKopersNrProps,
  };
};

export const isFormDirty = (formContext: ReturnType<typeof useForm>): boolean => {
  return (
    formContext.isFieldDirty('selectedOrganisation') ||
    formContext.isFieldDirty('selectedRollen') ||
    formContext.isFieldDirty('selectedVorname') ||
    formContext.isFieldDirty('selectedFamilienname') ||
    formContext.isFieldDirty('selectedKlasse') ||
    formContext.isFieldDirty('selectedBefristung') ||
    formContext.isFieldDirty('selectedBefristungOption') ||
    formContext.isFieldDirty('selectedKopersNr')
  );
};
