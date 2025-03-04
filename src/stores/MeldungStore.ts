import {
  DefaultApiFactory,
  type CreateOrUpdateMeldungBodyParams,
  type DefaultApiInterface,
  type MeldungResponse,
} from '@/api-client/generated';
import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import type { AxiosResponse } from 'axios';
import { defineStore, type Store, type StoreDefinition } from 'pinia';

const meldungenApi: DefaultApiInterface = DefaultApiFactory(undefined, '', axiosApiInstance);

export type Meldung = {
  id?: string;
  text: string;
  status: MeldungStatus;
  revision?: number;
};

export enum MeldungStatus {
  VEROEFFENTLICHT = 'VEROEFFENTLICHT',
  NICHT_VEROEFFENTLICHT = 'NICHT_VEROEFFENTLICHT',
}
type MeldungState = {
  meldungen: Meldung[];
  currentMeldung: Meldung | null;
  loading: boolean;
  errorCode: string;
};

type MeldungGetters = {};

type MeldungActions = {
  getAllMeldungen: () => Promise<void>;
  getCurrentMeldung: () => Promise<void>;
  createOrUpdateMeldung: (meldung: Meldung) => Promise<void>;
};

export type MeldungStore = Store<'meldungStore', MeldungState, MeldungGetters, MeldungActions>;

export const useMeldungStore: StoreDefinition<'meldungStore', MeldungState, MeldungGetters, MeldungActions> =
  defineStore({
    id: 'meldungStore',
    state: (): MeldungState => {
      return {
        meldungen: [],
        currentMeldung: null,
        loading: false,
        errorCode: '',
      };
    },
    actions: {
      async getAllMeldungen() {
        this.loading = true;
        this.errorCode = '';
        try {
          const { data }: AxiosResponse<Array<MeldungResponse>> = await meldungenApi.meldungControllerGetAllMeldungen();
          this.meldungen = data.map((meldung: MeldungResponse) => ({
            id: meldung.id,
            text: meldung.inhalt,
            status: meldung.status as MeldungStatus,
            revision: meldung.revision,
          }));
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },
      async getCurrentMeldung() {
        this.loading = true;
        this.errorCode = '';
        try {
          const { data }: AxiosResponse<MeldungResponse | null> =
            await meldungenApi.meldungControllerGetCurrentMeldung();
          if (data) {
            this.currentMeldung = {
              id: data.id,
              text: data.inhalt,
              status: data.status as MeldungStatus,
              revision: data.revision,
            };
          }
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },
      async createOrUpdateMeldung(meldung: Meldung) {
        this.loading = true;
        this.errorCode = '';
        try {
          const params: CreateOrUpdateMeldungBodyParams = {
            id: meldung.id,
            inhalt: meldung.text,
            status: meldung.status,
            revision: meldung.revision ?? 0,
          };
          await meldungenApi.meldungControllerCreateOrUpdateMeldung(params);
          await this.getAllMeldungen();
        } catch (error: unknown) {
          this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        } finally {
          this.loading = false;
        }
      },
    },
  });
