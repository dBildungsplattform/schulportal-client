import { RollenArt } from '@/stores/RolleStore';

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
