import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  DbiamPersonenuebersichtApiFactory,
  OrganisationsTyp,
  PersonenApiFactory,
  PersonenFrontendApiFactory,
  RollenMerkmal,
  type DbiamCreatePersonWithPersonenkontexteBodyParams,
  type DbiamPersonenuebersichtApiInterface,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type LockUserBodyParams,
  type PersonenApiInterface,
  type PersonendatensatzResponse,
  type PersonenFrontendApiInterface,
  type PersonenuebersichtBodyParams,
  type PersonFrontendControllerFindPersons200Response,
  type PersonMetadataBodyParams,
  type PersonResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import { type DbiamPersonenkontextBodyParams, type Zuordnung } from './PersonenkontextStore';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);
const personenFrontendApi: PersonenFrontendApiInterface = PersonenFrontendApiFactory(undefined, '', axiosApiInstance);
const personenuebersichtApi: DbiamPersonenuebersichtApiInterface = DbiamPersonenuebersichtApiFactory(
  undefined,
  '',
  axiosApiInstance,
);

export enum EmailStatus {
  Enabled = 'ENABLED',
  Disabled = 'DISABLED',
  Requested = 'REQUESTED',
  Failed = 'FAILED',
}

export enum SortField {
  Familienname = 'familienname',
  Vorname = 'vorname',
  Personalnummer = 'personalnummer',
  Referrer = 'referrer',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export enum LockKeys {
  PersonId = 'personId',
  LockedBy = 'locked_by',
  CreatedAt = 'created_at',
  LockedUntil = 'locked_until',
  LockOccasion = 'lock_occasion',
  MANUELL_GESPERRT = 'MANUELL_GESPERRT',
}
export type UserLock = {
  personId: string;
  locked_by: string;
  created_at: string;
  locked_until: string;
  lock_occasion: string;
};

export type Person = {
  id: PersonResponse['id'];
  name: PersonResponse['name'];
  referrer: PersonResponse['referrer'];
  revision: PersonResponse['revision'];
  personalnummer: PersonResponse['personalnummer'];
  isLocked: PersonResponse['isLocked'];
  userLock: UserLock[] | null;
  lastModified: PersonResponse['lastModified'];
  email: PersonResponse['email'];
};

type PersonenWithRolleAndZuordnung = {
  rollen: string;
  administrationsebenen: string;
  klassen: string;
  person: Person;
}[];

export type PersonWithUebersicht =
  | {
      personId: string;
      vorname: string;
      nachname: string;
      benutzername: string;
      lastModifiedZuordnungen: string | null;
      zuordnungen: {
        klasse?: string | undefined;
        sskId: string;
        rolleId: string;
        sskName: string;
        sskDstNr: string;
        rolle: string;
        administriertVon: string;
        typ: OrganisationsTyp;
        editable: boolean;
        merkmale: RollenMerkmal;
        befristung: string;
      }[];
    }
  | undefined;

export type PersonTableItem = {
  person: Person;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePersonBodyParams = DbiamCreatePersonWithPersonenkontexteBodyParams;
export type CreatedPersonenkontext = DbiamPersonenkontextBodyParams;

export enum PersonLockOccasion {
  MANUELL_GESPERRT = 'MANUELL_GESPERRT',
  KOPERS_GESPERRT = 'KOPERS_GESPERRT',
}

export function parseUserLock(unparsedArray: object[]): UserLock[] {
  const parsedLocks: UserLock[] = [];

  for (const unparsed of unparsedArray) {
    const result: Partial<UserLock> = {};

    if (LockKeys.LockOccasion in unparsed && unparsed[LockKeys.LockOccasion] == PersonLockOccasion.MANUELL_GESPERRT) {
      // Process "MANUELL_GESPERRT" entries
      if (LockKeys.LockedBy in unparsed) {
        result.locked_by = '' + unparsed[LockKeys.LockedBy];
      }
      if (LockKeys.CreatedAt in unparsed) {
        result.created_at = '' + unparsed[LockKeys.CreatedAt];
      }
      if (LockKeys.LockedUntil in unparsed) {
        result.locked_until = '' + unparsed[LockKeys.LockedUntil];
        // Parse the UTC date
        const utcDate: Date = new Date(result.locked_until);

        // Adjust date for MESZ (German summer time) if necessary
        if (utcDate.getTimezoneOffset() >= -120) {
          utcDate.setDate(utcDate.getDate() - 1);
        }
        result.locked_until = utcDate.toLocaleDateString('de-DE');
      }
      result.lock_occasion = '' + unparsed[LockKeys.LockOccasion];
    } else if (
      LockKeys.LockOccasion in unparsed &&
      unparsed[LockKeys.LockOccasion] == PersonLockOccasion.KOPERS_GESPERRT
    ) {
      result.lock_occasion = '' + unparsed[LockKeys.LockOccasion];
    }

    if (Object.keys(result).length > 0) {
      parsedLocks.push(result as UserLock);
    }
  }

  return parsedLocks;
}

export function mapPersonendatensatzResponseToPersonendatensatz(
  response: PersonendatensatzResponse,
): Personendatensatz {
  const userLock: UserLock[] | null = parseUserLock(
    Array.isArray(response.person.userLock) ? response.person.userLock : [],
  );
  const person: Person = {
    id: response.person.id,
    name: response.person.name,
    referrer: response.person.referrer,
    revision: response.person.revision,
    personalnummer: response.person.personalnummer,
    isLocked: response.person.isLocked,
    userLock: userLock,
    lastModified: response.person.lastModified,
    email: response.person.email,
  };
  return { person };
}

export type Personendatensatz = {
  person: Person;
};

export type { PersonendatensatzResponse };

type PersonState = {
  errorCode: string;
  loading: boolean;
  totalPersons: number;
  currentPerson: Personendatensatz | null;
  personenWithUebersicht: PersonenWithRolleAndZuordnung | null;
  personenuebersicht: DBiamPersonenuebersichtResponse | null;
  patchedPerson: PersonendatensatzResponse | null;
  newPassword: string | null;
};

export type PersonFilter = {
  limit?: number;
  offset?: number;
  organisationIDs?: Array<string>;
  rolleIDs?: Array<string>;
  searchFilter?: string;
  sortOrder?: SortOrder;
  sortField?: SortField;
};

type PersonGetters = {};
type PersonActions = {
  resetState: () => void;
  getAllPersons: (filter: PersonFilter) => Promise<void>;
  getPersonById: (personId: string) => Promise<Personendatensatz>;
  resetPassword: (personId: string) => Promise<void>;
  deletePersonById: (personId: string) => Promise<void>;
  lockPerson: (personId: string, bodyParams: LockUserBodyParams) => Promise<void>;
  syncPersonById: (personId: string) => Promise<void>;
  getPersonenuebersichtById: (personId: string) => Promise<void>;
  changePersonMetadataById: (
    personId: string,
    vorname: string,
    familienname: string,
    personalnummer?: string,
  ) => Promise<void>;
};

export type PersonStore = Store<'personStore', PersonState, PersonGetters, PersonActions>;

export const usePersonStore: StoreDefinition<'personStore', PersonState, PersonGetters, PersonActions> = defineStore({
  id: 'personStore',
  state: (): PersonState => {
    return {
      personenWithUebersicht: null,
      personenuebersicht: null,
      errorCode: '',
      loading: false,
      totalPersons: 0,
      currentPerson: null,
      patchedPerson: null,
      newPassword: null,
    };
  },
  actions: {
    resetState() {
      this.$reset();
    },
    async getAllPersons(filter: PersonFilter) {
      this.loading = true;
      try {
        // Fetch all persons
        const { data }: AxiosResponse<PersonFrontendControllerFindPersons200Response> =
          await personenFrontendApi.personFrontendControllerFindPersons(
            filter.offset,
            filter.limit,
            undefined,
            undefined,
            undefined,
            undefined,
            filter.organisationIDs,
            filter.rolleIDs,
            filter.searchFilter,
            filter.sortOrder,
            filter.sortField,
          );

        // Store the fetched persons
        const allPersons: PersonendatensatzResponse[] = data.items;
        this.totalPersons = +data.total;

        // Fetch overviews for all persons
        const personIds: string[] = data.items.map((person: PersonendatensatzResponse) => person.person.id);
        if (personIds.length === 0) {
          this.personenWithUebersicht = null;
          return;
        }
        const bodyParams: PersonenuebersichtBodyParams = {
          personIds: personIds,
        };
        const { data: uebersichten }: { data: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response } =
          await personenuebersichtApi.dBiamPersonenuebersichtControllerFindPersonenuebersichten(bodyParams);
        const allUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response = uebersichten;

        // Aggregate the personen with their uebersichten
        this.personenWithUebersicht = allPersons
          .map(mapPersonendatensatzResponseToPersonendatensatz)
          .map((person: Personendatensatz) => {
            const uebersicht: PersonWithUebersicht = allUebersichten.items.find(
              (ueb: PersonWithUebersicht) => ueb?.personId === person.person.id,
            );

            const uniqueRollen: Set<string> = new Set<string>();
            uebersicht?.zuordnungen.forEach((zuordnung: Zuordnung) => uniqueRollen.add(zuordnung.rolle));
            const rollenZuordnungen: string = uniqueRollen.size > 0 ? Array.from(uniqueRollen).join(', ') : '---';

            const uniqueAdministrationsebenen: Set<string> = new Set<string>();
            uebersicht?.zuordnungen
              .filter((zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse)
              .forEach((zuordnung: Zuordnung) =>
                uniqueAdministrationsebenen.add(zuordnung.sskDstNr ? zuordnung.sskDstNr : zuordnung.sskName),
              );
            const administrationsebenen: string =
              uniqueAdministrationsebenen.size > 0 ? Array.from(uniqueAdministrationsebenen).join(', ') : '---';

            const klassenZuordnungen: string = uebersicht?.zuordnungen.some(
              (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
            )
              ? uebersicht.zuordnungen
                  .filter((zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse)
                  .map((zuordnung: Zuordnung) => (zuordnung.sskName.length ? zuordnung.sskName : '---'))
                  .join(', ')
              : '---';

            /* Check if person has personalnummer and show it, 
              if not, check if kopersrolle exists and show "fehlt",
              if not, show "---"
            */
            const hasKopersRolle: boolean = !!uebersicht?.zuordnungen.find((zuordnung: Zuordnung) =>
              zuordnung.merkmale.includes(RollenMerkmal.KopersPflicht),
            );
            let personalnummer: string;

            if (person.person.personalnummer) {
              personalnummer = person.person.personalnummer;
            } else if (hasKopersRolle) {
              personalnummer = 'fehlt';
            } else {
              personalnummer = '---';
            }

            return {
              ...person,
              rollen: rollenZuordnungen,
              administrationsebenen: administrationsebenen,
              klassen: klassenZuordnungen,
              person: { ...person.person, personalnummer: personalnummer },
            };
          });
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data?.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getPersonById(personId: string): Promise<Personendatensatz> {
      this.loading = true;
      this.errorCode = '';
      try {
        const { data }: AxiosResponse<PersonendatensatzResponse, unknown> =
          await personenApi.personControllerFindPersonById(personId);
        this.currentPerson = mapPersonendatensatzResponseToPersonendatensatz(data);
        return this.currentPerson;
      } catch (error) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(personId: string): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: string } = await personenApi.personControllerResetPasswordByPersonId(personId);
        this.newPassword = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },
    async deletePersonById(personId: string) {
      this.loading = true;
      try {
        await personenApi.personControllerDeletePersonById(personId);
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async lockPerson(personId: string, bodyParams: LockUserBodyParams): Promise<void> {
      this.loading = true;
      try {
        await personenApi.personControllerLockPerson(personId, bodyParams);
        await this.getPersonById(personId);
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async syncPersonById(personId: string) {
      this.loading = true;
      try {
        await personenApi.personControllerSyncPerson(personId);
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getPersonenuebersichtById(personId: string): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenuebersichtResponse } =
          await personenuebersichtApi.dBiamPersonenuebersichtControllerFindPersonenuebersichtenByPerson(personId);
        this.personenuebersicht = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async changePersonMetadataById(
      personId: string,
      vorname: string,
      familienname: string,
      personalnummer?: string,
    ): Promise<void> {
      this.loading = true;
      try {
        const personMetadataBodyParams: PersonMetadataBodyParams = {
          vorname: vorname,
          familienname: familienname,
          personalnummer: personalnummer,
          revision: this.currentPerson?.person.revision ?? '',
          lastModified: this.currentPerson?.person.lastModified ?? '',
        };
        const { data }: { data: PersonendatensatzResponse } = await personenApi.personControllerUpdateMetadata(
          personId,
          personMetadataBodyParams,
        );

        this.patchedPerson = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ERROR_LOADING_USER';
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
