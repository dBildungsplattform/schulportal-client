import type { Ref } from 'vue';
import { useI18n, type Composer } from 'vue-i18n';

export enum ItemType {
  KO_PERS = 'KO_PERS',
}

export type LabelValue = {
  label: string;
  labelAbbr?: string;
  value: string | null;
  type?: ItemType;
  testIdLabel: string;
  testIdValue: string;
};

export type SchulDaten = {
  title: string;
  labelAndValues: LabelValue[];
  info?: string | null;
  schulAdmins?: string[];
};

/**
 * Maps a person's data to an array of label-value objects for display purposes.
 *
 * @param person - The person object containing personal data.
 * @param options - Optional configuration object.
 * @param options.hasKoPersMerkmal - A Vue ref indicating if the person has the KoPersMerkmal attribute.
 * @param options.includeKoPers - Whether to include the KoPers number in the result (default: true).
 * @param options.testIdPrefix - Prefix for test IDs used in the label-value objects.
 * @returns An array of `LabelValue` objects representing the person's data for UI display.
 *
 * @remarks
 * - Uses i18n for label translations.
 * - Optionally includes username and KoPers number based on input and options.
 */
export function mapToLabelValues(
  person: {
    vorname: string;
    familienname: string;
    username?: string;
    personalnummer: string | null;
  },
  {
    hasKoPersMerkmal,
    includeKoPers = true,
    testIdPrefix = '',
  }: {
    hasKoPersMerkmal?: Ref<boolean>;
    includeKoPers?: boolean;
    testIdPrefix?: string;
  } = {},
): LabelValue[] {
  const { t }: Composer = useI18n();
  const data: LabelValue[] = [];

  data.push({
    label: t('profile.fullName'),
    value: `${person.vorname} ${person.familienname}`,
    testIdLabel: `${testIdPrefix}fullName-label`,
    testIdValue: `${testIdPrefix}fullName-value`,
  });

  if (person.username) {
    data.push({
      label: t('person.userName'),
      value: person.username,
      testIdLabel: `${testIdPrefix}userName-label`,
      testIdValue: `${testIdPrefix}userName-value`,
    });
  }

  if (includeKoPers && (person.personalnummer || hasKoPersMerkmal?.value)) {
    data.push({
      label: t('profile.koPersNummer'),
      labelAbbr: t('profile.koPersNummerAbbr'),
      value: person.personalnummer,
      type: ItemType.KO_PERS,
      testIdLabel: `${testIdPrefix}kopersnummer-label`,
      testIdValue: `${testIdPrefix}kopersnummer-value`,
    });
  }

  return data;
}
