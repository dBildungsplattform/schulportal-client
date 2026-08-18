import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { type AxiosError, type AxiosResponse } from 'axios';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import {
  RolleApiFactory,
  RollenArt,
  RollenMerkmal,
  RollenSystemRechtEnum,
  type ApplyRollenerweiterungChangesBodyParams,
  type CreateRolleBodyParams,
  type DbiamApplyRollenerweiterungMultiErrorIdsWithI18nKeysInnerI18nKeyEnum,
  type RolleApiInterface,
  type RolleResponse,
  type RolleWithServiceProvidersResponse,
  type UpdateRolleBodyParams,
  type SystemRechtResponse,
  type ServiceProviderIdNameResponse,
  type ServiceProviderResponse,
} from '../api-client/generated/api';
import type { BaseServiceProvider } from './ServiceProviderStore';

const rolleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance);

type RollenerweiterungMultiErrorResponse = {
  code: string | number;
  idsWithI18nKeys: Array<{
    id?: string;
    i18nKey?: DbiamApplyRollenerweiterungMultiErrorIdsWithI18nKeysInnerI18nKeyEnum;
  }>;
};

type RollenerweiterungMultiErrorItem = RollenerweiterungMultiErrorResponse['idsWithI18nKeys'][number];

type RolleState = {
  createdRolle: Rolle | null;
  updatedRolle: RolleWithServiceProvidersResponse | null;
  currentRolle: Rolle | null;
  allRollen: Array<RolleWithServiceProvidersResponse>;
  rollenerweiterungServiceProviders: Array<ServiceProviderResponse>;
  errorCode: string;
  loading: boolean;
  totalRollen: number;
  errors: Map<string, DbiamApplyRollenerweiterungMultiErrorIdsWithI18nKeysInnerI18nKeyEnum>;
};

type RolleGetters = object;
type RolleActions = {
  createRolle: (
    rollenName: string,
    administrationsebene: string,
    rollenArt: RollenArt,
    merkmale: RollenMerkmal[],
    systemrechte: RollenSystemRechtEnum[],
    serviceProvider: string[],
  ) => Promise<void>;
  getAllRollen: (filter: RolleFilter) => Promise<void>;
  getRolleById: (rolleId: string) => Promise<void>;
  getMptRolleById: (rolleId: string, organisationId: string) => Promise<void>;
  getRollenerweiterungenForRolle: (rolleId: string, organisationId: string) => Promise<void>;
  persistRollenerweiterungenForRolle: (filter: PersistRollenerweiterungForRolle) => Promise<void>;
  updateRolle: (
    rolleId: string,
    rollenName: string,
    merkmale: RollenMerkmal[],
    systemrechte: RollenSystemRechtEnum[],
    serviceProviderIds: string[],
    version: number,
  ) => Promise<void>;
  deleteRolleById: (rolleId: string) => Promise<void>;
};

export { RollenArt };
export { RollenMerkmal };
export { RollenSystemRechtEnum as RollenSystemRecht };
export type { RolleResponse };
export type { RolleWithServiceProvidersResponse };

export type Rolle = {
  administeredBySchulstrukturknoten: string;
  id: string;
  merkmale: RollenMerkmal[];
  name: string;
  rollenart: RollenArt;
  systemrechte?: Set<RollenSystemRechtEnum>;
  serviceProviders?: Array<ServiceProviderIdNameResponse>;
  version: number;
};

function mapRolleResponseToRolle(response: RolleWithServiceProvidersResponse): Rolle {
  return {
    administeredBySchulstrukturknoten: response.administeredBySchulstrukturknoten,
    id: response.id,
    merkmale: response.merkmale,
    name: response.name,
    rollenart: response.rollenart,
    systemrechte: new Set(Array.from(response.systemrechte).map((recht: SystemRechtResponse) => recht.name)),
    version: response.version,
    serviceProviders: response.serviceProviders,
  };
}

export type RolleTableItem = {
  administeredBySchulstrukturknoten: string;
  id: string;
  merkmale: string;
  name: string;
  rollenart: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RolleFormType = {
  selectedAdministrationsebene: string | undefined;
  selectedRollenArt: RollenArt;
  selectedRollenName: string | undefined;
  selectedMerkmale: RollenMerkmal[] | string[];
  selectedServiceProviders: BaseServiceProvider[] | string[];
  selectedSystemRechte: RollenSystemRechtEnum[] | string[];
};

export type RolleFilter = {
  limit?: number;
  offset?: number;
  searchString?: string;
  organisationId?: string;
  rolleIds?: string[];
  systemrechte?: RollenSystemRechtEnum[];
  rollenarten?: Array<RollenArt>;
};

export type PersistRollenerweiterungForRolle = {
  rolleId: string;
  organisationId: string;
  addErweiterungenForServiceProviderIds: Array<string>;
  removeErweiterungenForServiceProviderIds: Array<string>;
};

function containsMultiError(error: unknown): error is AxiosError<RollenerweiterungMultiErrorResponse> {
  const domainError: RollenerweiterungMultiErrorResponse | undefined = (
    error as AxiosError<RollenerweiterungMultiErrorResponse>
  ).response?.data;
  return Boolean(
    domainError &&
    typeof domainError === 'object' &&
    'code' in domainError &&
    'idsWithI18nKeys' in domainError &&
    Array.isArray(domainError.idsWithI18nKeys),
  );
}

export type RolleStore = Store<'rolleStore', RolleState, RolleGetters, RolleActions>;

export const useRolleStore: StoreDefinition<'rolleStore', RolleState, RolleGetters, RolleActions> = defineStore(
  'rolleStore',
  {
    state: (): RolleState => {
      return {
        createdRolle: null,
        updatedRolle: null,
        currentRolle: null,
        allRollen: [],
        rollenerweiterungServiceProviders: [],
        errorCode: '',
        loading: false,
        totalRollen: 0,
        errors: new Map<string, DbiamApplyRollenerweiterungMultiErrorIdsWithI18nKeysInnerI18nKeyEnum>(),
      };
    },
    actions: {
      async createRolle(
        rollenName: string,
        administrationsebene: string,
        rollenArt: RollenArt,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRechtEnum[],
        serviceProvider: string[],
      ): Promise<void> {
        this.loading = true;
        try {
          // Construct the body params object
          const createRolleBodyParams: CreateRolleBodyParams = {
            name: rollenName,
            administeredBySchulstrukturknoten: administrationsebene,
            rollenart: rollenArt,
            // TODO Remove casting when generator issue is fixed from the server side
            merkmale: merkmale as unknown as Set<RollenMerkmal>,
            systemrechte: systemrechte as unknown as Set<RollenSystemRechtEnum>,
            serviceProviderIds: serviceProvider as unknown as Set<string>,
          };
          const { data }: { data: RolleResponse } = await rolleApi.rolleControllerCreateRolle(createRolleBodyParams);
          const receivedSystemrechte: Set<RollenSystemRechtEnum> = new Set(
            Array.from(data.systemrechte).map((recht: SystemRechtResponse) => recht.name),
          );
          this.createdRolle = { ...data, systemrechte: receivedSystemrechte };
          this.currentRolle = this.createdRolle;
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'ROLLE_ERROR');
        } finally {
          this.loading = false;
        }
      },

      async getAllRollen(filter: RolleFilter) {
        this.loading = true;
        try {
          const response: AxiosResponse<Array<RolleWithServiceProvidersResponse>> =
            await rolleApi.rolleControllerFindRollen(
              filter.offset,
              filter.limit,
              filter.searchString,
              filter.organisationId,
              filter.rolleIds,
              filter.systemrechte,
              filter.rollenarten,
            );
          this.allRollen = response.data;
          this.totalRollen = +response.headers['x-paging-total'];
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },

      async getRolleById(rolleId: string): Promise<void> {
        this.loading = true;
        this.errorCode = '';
        try {
          const { data }: { data: RolleWithServiceProvidersResponse } =
            await rolleApi.rolleControllerFindRolleByIdWithServiceProviders(rolleId);
          this.currentRolle = mapRolleResponseToRolle(data);
        } catch (error) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },

      async getMptRolleById(rolleId: string, organisationId: string): Promise<void> {
        this.loading = true;
        this.errorCode = '';
        this.currentRolle = null;
        try {
          const rolleFromList: RolleWithServiceProvidersResponse | undefined = this.allRollen.find(
            (rolle: RolleWithServiceProvidersResponse): boolean => rolle.id === rolleId,
          );
          if (rolleFromList) {
            this.currentRolle = mapRolleResponseToRolle(rolleFromList);
            return;
          }

          const { data }: AxiosResponse<Array<RolleWithServiceProvidersResponse>> =
            await rolleApi.rolleControllerFindRollen(
              undefined,
              undefined,
              undefined,
              organisationId,
              [rolleId],
              [RollenSystemRechtEnum.MptRollenVerwalten],
            );
          const rolle: RolleWithServiceProvidersResponse | undefined = data[0];
          if (!rolle) {
            this.errorCode = 'UNSPECIFIED_ERROR';
            return;
          }
          this.currentRolle = mapRolleResponseToRolle(rolle);
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },

      async getRollenerweiterungenForRolle(rolleId: string, organisationId: string): Promise<void> {
        this.loading = true;
        this.errorCode = '';
        this.rollenerweiterungServiceProviders = [];
        try {
          const { data }: { data: Array<ServiceProviderResponse> } =
            await rolleApi.rolleControllerFindRollenerweiterungenForRolleAndOrga(rolleId, organisationId);
          this.rollenerweiterungServiceProviders = data;
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },

      async persistRollenerweiterungenForRolle(filter: PersistRollenerweiterungForRolle): Promise<void> {
        this.loading = true;
        this.errorCode = '';
        this.errors.clear();
        try {
          const bodyParams: ApplyRollenerweiterungChangesBodyParams = {
            addErweiterungenForServiceProviderIds: filter.addErweiterungenForServiceProviderIds,
            removeErweiterungenForServiceProviderIds: filter.removeErweiterungenForServiceProviderIds,
          };
          await rolleApi.rolleControllerApplyRollenerweiterungChangesForRolle(
            filter.rolleId,
            filter.organisationId,
            bodyParams,
          );
        } catch (error: unknown) {
          if (containsMultiError(error)) {
            const errors: RollenerweiterungMultiErrorResponse['idsWithI18nKeys'] =
              error.response?.data.idsWithI18nKeys ?? [];
            this.errors = new Map<string, DbiamApplyRollenerweiterungMultiErrorIdsWithI18nKeysInnerI18nKeyEnum>(
              errors
                .filter(
                  (item: RollenerweiterungMultiErrorItem): item is Required<RollenerweiterungMultiErrorItem> =>
                    item.id !== undefined && item.i18nKey !== undefined,
                )
                .map((item: Required<RollenerweiterungMultiErrorItem>) => [item.id, item.i18nKey]),
            );
          } else {
            this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
          }
        } finally {
          this.loading = false;
        }
      },

      async updateRolle(
        rolleId: string,
        rollenName: string,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRechtEnum[],
        serviceProviderIds: string[],
        version: number,
      ): Promise<void> {
        this.loading = true;
        this.errorCode = '';
        try {
          const updateRolleBodyParams: UpdateRolleBodyParams = {
            name: rollenName,
            merkmale: merkmale as unknown as Set<RollenMerkmal>,
            systemrechte: systemrechte as unknown as Set<RollenSystemRechtEnum>,
            serviceProviderIds: serviceProviderIds as unknown as Set<string>,
            version: version,
          };
          const { data }: { data: RolleWithServiceProvidersResponse } = await rolleApi.rolleControllerUpdateRolle(
            rolleId,
            updateRolleBodyParams,
          );
          this.updatedRolle = data;
        } catch (error) {
          this.errorCode = getResponseErrorCode(error, 'ROLLE_UPDATE_ERROR');
        } finally {
          this.loading = false;
        }
      },

      async deleteRolleById(rolleId: string): Promise<void> {
        this.loading = true;
        this.errorCode = '';
        try {
          await rolleApi.rolleControllerDeleteRolle(rolleId);
        } catch (error) {
          this.errorCode = getResponseErrorCode(error, 'ROLLE_ERROR');
        } finally {
          this.loading = false;
        }
      },
    },
  },
);
