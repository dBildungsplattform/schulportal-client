import type { Organisation } from '@/stores/OrganisationStore';
import type { ServiceProviderKategorie, ServiceProviderMerkmal } from '@/stores/ServiceProviderStore';

export type RollenerweiterungAssignErrorDialogProps = {
  isDialogVisible: boolean;
  filename?: string;
  dstNr: string;
  serviceProviderName: string;
  errors: MappedRollenerweiterungAssignError[];
};

export type MappedRollenerweiterungAssignError = {
  rolle: string;
  message: string;
};

export type ServiceProviderForm = {
  selectedOrganisationId: string | undefined;
  name: string;
  url: string;
  logo: string;
  kategorie: ServiceProviderKategorie;
  nachtraeglichZuweisbar: boolean;
  verfuegbarFuerRollenerweiterung: boolean;
  requires2fa: boolean;
};

export type ServiceProviderFormSubmitData = {
  selectedOrganisation?: Organisation;
  name: string;
  url: string;
  logo: string;
  kategorie: ServiceProviderKategorie;
  merkmale: ServiceProviderMerkmal[];
  requires2fa: boolean;
};

export type ServiceProviderFormProps = {
  initialValues: Partial<ServiceProviderForm>;
  /**
   * Sets fields into dirty states
   */
  cachedValues?: Partial<ServiceProviderForm>;
  systemrecht: RollenSystemRecht;
  showUnsavedChangesDialog: boolean;
  errorCode?: string;
  loading?: boolean;
  isEditMode?: boolean;
};
