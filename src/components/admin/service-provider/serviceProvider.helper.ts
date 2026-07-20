import { RollenArt } from '@/stores/RolleStore';
import { ServiceProviderMerkmal } from '@/stores/ServiceProviderStore';

type Translate = (key: string) => string;

function getRollenartLabel(rollenart: RollenArt, t: Translate): string {
  return t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rollenart}`);
}

export function formatServiceProviderRollenartenWhitelist(
  rollenartenWhitelist: RollenArt[] | undefined,
  t: Translate,
): string {
  if (!rollenartenWhitelist?.length) {
    return t('angebot.noRestrictions');
  }

  return rollenartenWhitelist.map((rollenart: RollenArt) => getRollenartLabel(rollenart, t)).join(', ');
}

export function extractAnbietenInMerkmale(merkmale: ServiceProviderMerkmal[]): ServiceProviderMerkmal[] {
  return merkmale.filter((merkmal: ServiceProviderMerkmal) => {
    switch (merkmal) {
      case ServiceProviderMerkmal.AnbietenInSchulischerAngebotsverwaltung:
      case ServiceProviderMerkmal.AnbietenInSchulischerRollenverwaltung:
        return true;
      default:
        return false;
    }
  });
}

export function formatServiceProviderAnbietenMerkmale(merkmale: ServiceProviderMerkmal[], t: Translate): string {
  const anbietenInMerkmale: ServiceProviderMerkmal[] = extractAnbietenInMerkmale(merkmale);
  if (anbietenInMerkmale.length === 0) {
    return t('none');
  }
  return anbietenInMerkmale
    .map((merkmal: ServiceProviderMerkmal) => {
      switch (merkmal) {
        case ServiceProviderMerkmal.AnbietenInSchulischerAngebotsverwaltung:
          return t('angebot.schulischeAngebotsverwaltung');
        case ServiceProviderMerkmal.AnbietenInSchulischerRollenverwaltung:
          return t('angebot.schulischeRollenverwaltung');
        default:
          return '';
      }
    })
    .join(', ');
}
