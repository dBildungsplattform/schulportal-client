import { EmailStatus } from '@/stores/PersonStore';
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
  tooltip?: string;
};

export type SchulDaten = {
  title: string;
  labelAndValues: LabelValue[];
  info?: string | null;
  schulAdmins?: string[];
};

export type EmailStatusObject = {
  status: EmailStatus;
  address?: string;
};

/**
 * Maps a person's data to an array of label-value objects for display purposes.
 *
 * @param person - The person object containing personal data.
 * @param options - Optional configuration object.
 * @param options.hasKoPersMerkmal - A Vue ref indicating if the person has the KoPersMerkmal attribute.
 * @param options.includeKoPers - Whether to include the KoPers number in the result (default: true).
 * @param options.includeEmail - Whether to include the email field.
 * @param options.email - Optional email object with status and address.
 * @param options.testIdPrefix - Prefix for test IDs used in the label-value objects.
 * @returns An array of `LabelValue` objects representing the person's data for UI display.
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
    includeEmail = false,
    email,
    testIdPrefix = '',
  }: {
    hasKoPersMerkmal?: Ref<boolean>;
    includeKoPers?: boolean;
    includeEmail?: boolean;
    email?: EmailStatusObject | null;
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

  if (includeEmail && email) {
    let value: string | null = null;
    let tooltip: string | undefined;

    switch (email.status) {
      case EmailStatus.Enabled:
        value = email.address ?? '';
        break;
      case EmailStatus.Requested:
        value = t('profile.emailStatusRequested');
        tooltip = t('profile.emailStatusRequestedHover');
        break;
      case EmailStatus.Disabled:
        value = t('profile.emailStatusDisabled');
        tooltip = t('profile.emailStatusDisabledHover');
        break;
      case EmailStatus.Failed:
        value = t('profile.emailStatusFailed');
        tooltip = t('profile.emailStatusFailedHover');
        break;
    }

    data.push({
      label: t('profile.email'),
      value,
      tooltip,
      testIdLabel: `${testIdPrefix}email-label`,
      testIdValue: `${testIdPrefix}email-value`,
    });
  }

  return data;
}
