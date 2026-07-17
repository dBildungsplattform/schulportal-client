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

export function formatServiceProviderAnbietenMerkmale(merkmale: ServiceProviderMerkmal[], t: Translate): string {
  return merkmale
    .map((merkmal: ServiceProviderMerkmal) => {
      if (merkmal === ServiceProviderMerkmal.AnbietenInSchulischerAngebotsverwaltung) {
        return t('angebot.schulischeAngebotsverwaltung');
      }
      if (merkmal === ServiceProviderMerkmal.AnbietenInSchulischerRollenverwaltung) {
        return t('angebot.schulischeRollenverwaltung');
      }
      return '';
    })
    .filter((merkmal: string) => merkmal !== '')
    .join(', ');
}
