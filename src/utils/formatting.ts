import type { Organisation } from '@/stores/OrganisationStore';

export const getDisplayNameForOrg = (org: Pick<Organisation, 'kennung' | 'name'>): string =>
  org.kennung ? `${org.kennung} (${org.name.trim()})` : org.name;
