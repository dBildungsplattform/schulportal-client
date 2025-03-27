import type { Organisation } from '@/stores/OrganisationStore';

export const getDisplayNameForOrg = (org: Organisation): string =>
  org.kennung ? `${org.kennung} (${org.name.trim()})` : org.name;
