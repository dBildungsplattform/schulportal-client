import {
  OrganisationsTyp,
  PersonenApiFactory,
  RollenArt,
  RollenMerkmal,
  type PersonenApiInterface,
} from '@/api-client/generated';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { isBefore } from 'date-fns';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { Organisation } from './OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from './PersonenkontextStore';
import { usePersonStore, type PersonStore } from './PersonStore';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);

export enum OperationType {
  MODIFY_ROLLE = 'MODIFY_ROLLE',
  DELETE_PERSON = 'DELETE_PERSON',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ORG_UNASSIGN = 'ORG_UNASSIGN',
}

export type CurrentOperation = {
  type: OperationType | null;
  isRunning: boolean;
  progress: number;
  complete: boolean;
  errors: Map<string, string>;
  data: Map<string, unknown>;
  successMessage?: string;
};

type BulkOperationState = {
  currentOperation: CurrentOperation | null;
};

type BulkOperationGetters = {};

type BulkOperationActions = {
  resetState(): void;
  bulkUnassignPersonenFromOrg(organisationId: string, personIds: string[]): Promise<void>;
  bulkResetPassword(personIds: string[]): Promise<void>;
  bulkModifyPersonenRolle(
    personIDs: string[],
    selectedOrganisationId: string,
    selectedRolleId: string,
    rollen: TranslatedRolleWithAttrs[],
    workflowStepResponseOrganisations: Organisation[],
    befristung?: string,
  ): Promise<void>;
  bulkPersonenDelete(personIDs: string[]): Promise<void>;
};

export type BulkOperationStore = Store<
  'bulkOperationStore',
  BulkOperationState,
  BulkOperationGetters,
  BulkOperationActions
>;

export const useBulkOperationStore: StoreDefinition<
  'bulkOperationStore',
  BulkOperationState,
  BulkOperationGetters,
  BulkOperationActions
> = defineStore({
  id: 'bulkOperationStore',
  state: (): BulkOperationState => ({
    currentOperation: {
      type: null,
      isRunning: false,
      progress: 0,
      complete: false,
      errors: new Map(),
      data: new Map(),
    },
  }),
  actions: {
    resetState() {
      this.currentOperation = {
        type: null,
        isRunning: false,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };
    },

    async bulkUnassignPersonenFromOrg(organisationId: string, personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      this.currentOperation = {
        type: OperationType.ORG_UNASSIGN,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        // Fetch the Zuordnungen for this specific user (To send alongside the new one)
        await personStore.getPersonenuebersichtById(personId);

        // Extract the current Zuordnungen for this person
        const existingZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen ?? [];

        // Remove the selected Organisation and it's children from the existing Zuordnungen
        // This is done by filtering out any Zuordnung that has the same sskId or administriertVon as the selected organisationId
        const updatedZuordnungen: Zuordnung[] = existingZuordnungen.filter(
          (zuordnung: Zuordnung) => zuordnung.sskId !== organisationId && zuordnung.administriertVon !== organisationId,
        );

        if (updatedZuordnungen.length === existingZuordnungen.length) {
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        // Await the processing of each ID
        await personenkontextStore.updatePersonenkontexte(updatedZuordnungen, personId);

        // Update progress for each item processed
        this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;
    },

    async bulkResetPassword(personIds: string[]): Promise<void> {
      this.currentOperation = {
        type: OperationType.RESET_PASSWORD,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIds.length; i++) {
        const id: string = personIds[i]!;

        try {
          const { data }: { data: string } = await personenApi.personControllerResetPasswordByPersonId(id);
          this.currentOperation.data.set(id, data);
        } catch (error: unknown) {
          const errorCode: string = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
          this.currentOperation.errors.set(id, errorCode);
        } finally {
          this.currentOperation.progress = Math.ceil(((i + 1) / personIds.length) * 100);
        }
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;
    },

    async bulkModifyPersonenRolle(
      personIDs: string[],
      selectedOrganisationId: string,
      selectedRolleId: string,
      rollen: TranslatedRolleWithAttrs[],
      workflowStepResponseOrganisations: Organisation[],
      befristung?: string,
    ): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      this.currentOperation = {
        type: OperationType.MODIFY_ROLLE,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      const selectedOrganisation: Organisation | undefined = workflowStepResponseOrganisations.find(
        (orga: Organisation) => orga.id === selectedOrganisationId,
      );

      if (!selectedOrganisation) return;

      const baseZuordnung: Zuordnung = {
        sskId: selectedOrganisation.id,
        rolleId: selectedRolleId,
        klasse: undefined,
        sskDstNr: selectedOrganisation.kennung ?? '',
        sskName: selectedOrganisation.name,
        rolle: rollen.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolleId)?.title ?? '',
        rollenArt: rollen.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolleId)
          ?.rollenart as RollenArt,
        administriertVon: selectedOrganisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: OrganisationsTyp.Schule,
        befristung,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        await personStore.getPersonenuebersichtById(personId);

        const currentZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen || [];
        const newZuordnung: Zuordnung = {
          ...baseZuordnung,
        };

        // If the new kontext is befristet, we use the earliest possible befristung out of all befristungen at the selected organisation and the specified befristung
        if (befristung) {
          newZuordnung.befristung = currentZuordnungen.reduce((earliest: string, zuordnung: Zuordnung) => {
            if (zuordnung.sskId === selectedOrganisation.id && zuordnung.befristung) {
              return isBefore(zuordnung.befristung, earliest) ? zuordnung.befristung : earliest;
            }
            return earliest;
          }, befristung);
        }

        const combinedZuordnungen: Zuordnung[] = [...currentZuordnungen, newZuordnung];

        await personenkontextStore.updatePersonenkontexte(combinedZuordnungen, personId);

        this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);

        if (personenkontextStore.errorCode) {
          this.currentOperation.errors.set(personId, personenkontextStore.errorCode);
          personenkontextStore.errorCode = '';
        }
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;

      this.currentOperation.successMessage = 'admin.rolle.rollenAssignedSuccessfully';

      if (personenkontextStore.errorCode === 'INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN') {
        personenkontextStore.errorCode = '';
      }
    },

    async bulkPersonenDelete(personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();

      this.currentOperation = {
        type: OperationType.DELETE_PERSON,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        await personStore.deletePersonById(personId);

        this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;

      this.currentOperation.successMessage = 'admin.person.deletePersonBulkSuccessMessage';
    },
  },
});
