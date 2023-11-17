/** Generate by swagger-axios-codegen */
// @ts-nocheck
/* eslint-disable */

/** Generate by swagger-axios-codegen */
/* eslint-disable */
// @ts-nocheck
import axiosStatic, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IRequestOptions extends AxiosRequestConfig {
  /** only in axios interceptor config*/
  loading?: boolean;
  showError?: boolean;
}

export interface IRequestConfig {
  method?: any;
  headers?: any;
  url?: any;
  data?: any;
  params?: any;
}

// Add options interface
export interface ServiceOptions {
  axios?: AxiosInstance;
  /** only in axios interceptor config*/
  loading: boolean;
  showError: boolean;
}

// Add default options
export const serviceOptions: ServiceOptions = {};

// Instance selector
export function axios(configs: IRequestConfig, resolve: (p: any) => void, reject: (p: any) => void): Promise<any> {
  if (serviceOptions.axios) {
    return serviceOptions.axios
      .request(configs)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
  } else {
    throw new Error('please inject yourself instance like axios  ');
  }
}

export function getConfigs(method: string, contentType: string, url: string, options: any): IRequestConfig {
  const configs: IRequestConfig = {
    loading: serviceOptions.loading,
    showError: serviceOptions.showError,
    ...options,
    method,
    url
  };
  configs.headers = {
    ...options.headers,
    'Content-Type': contentType
  };
  return configs;
}

export const basePath = '';

export interface IList<T> extends Array<T> {}
export interface List<T> extends Array<T> {}
export interface IDictionary<TValue> {
  [key: string]: TValue;
}
export interface Dictionary<TValue> extends IDictionary<TValue> {}

export interface IListResult<T> {
  items?: T[];
}

export class ListResultDto<T> implements IListResult<T> {
  items?: T[];
}

export interface IPagedResult<T> extends IListResult<T> {
  totalCount?: number;
  items?: T[];
}

export class PagedResultDto<T = any> implements IPagedResult<T> {
  totalCount?: number;
  items?: T[];
}

// customer definition
// empty

export class PersonService {
  /**
   *
   */
  static personControllerCreatePerson(
    params: {
      /** requestBody */
      body?: CreatePersonBodyParams;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/person';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static personControllerFindPersons(
    params: {
      /** The offset of the paginated list. */
      offset?: number;
      /** The requested limit for the page size. */
      limit?: number;
      /**  */
      referrer?: string;
      /**  */
      familienname?: string;
      /**  */
      vorname?: string;
      /**  */
      sichtfreigabe?: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<PersonendatensatzResponse[]> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/person';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = {
        offset: params['offset'],
        limit: params['limit'],
        referrer: params['referrer'],
        familienname: params['familienname'],
        vorname: params['vorname'],
        sichtfreigabe: params['sichtfreigabe']
      };

      /** 适配ios13，get请求不允许带body */

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static personControllerFindPersonById(
    params: {
      /** The id for the account. */
      personId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/person/{personId}';
      url = url.replace('{personId}', params['personId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      /** 适配ios13，get请求不允许带body */

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static personControllerCreatePersonenkontext(
    params: {
      /** The id for the account. */
      personId: string;
      /** requestBody */
      body?: CreatePersonenkontextBodyParams;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/person/{personId}/personenkontexte';
      url = url.replace('{personId}', params['personId'] + '');

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static personControllerFindPersonenkontexte(
    params: {
      /** The id for the account. */
      personId: string;
      /**  */
      referrer?: string;
      /**  */
      rolle?: string;
      /**  */
      personenstatus?: string;
      /**  */
      sichtfreigabe?: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/person/{personId}/personenkontexte';
      url = url.replace('{personId}', params['personId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);
      configs.params = {
        referrer: params['referrer'],
        rolle: params['rolle'],
        personenstatus: params['personenstatus'],
        sichtfreigabe: params['sichtfreigabe']
      };

      /** 适配ios13，get请求不允许带body */

      axios(configs, resolve, reject);
    });
  }
}

export class OrganisationService {
  /**
   *
   */
  static organisationControllerCreateOrganisation(
    params: {
      /** requestBody */
      body?: CreateOrganisationBodyParams;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/organisation';

      const configs: IRequestConfig = getConfigs('post', 'application/json', url, options);

      let data = params.body;

      configs.data = data;

      axios(configs, resolve, reject);
    });
  }
  /**
   *
   */
  static organisationControllerFindOrganisationById(
    params: {
      /** The id of an organization */
      organisationId: string;
    } = {} as any,
    options: IRequestOptions = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/organisation/{organisationId}';
      url = url.replace('{organisationId}', params['organisationId'] + '');

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      /** 适配ios13，get请求不允许带body */

      axios(configs, resolve, reject);
    });
  }
}

export class RolleService {
  /**
   *
   */
  static providerControllerGetServiceProvidersByPersonId(options: IRequestOptions = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      let url = basePath + '/api/provider';

      const configs: IRequestConfig = getConfigs('get', 'application/json', url, options);

      /** 适配ios13，get请求不允许带body */

      axios(configs, resolve, reject);
    });
  }
}

export interface PersonNameParams {
  /**  */
  familienname: string;

  /**  */
  vorname: string;

  /**  */
  initialenfamilienname?: string;

  /**  */
  initialenvorname?: string;

  /**  */
  rufname?: string;

  /**  */
  titel?: string;

  /**  */
  anrede?: string[];

  /**  */
  namenssuffix?: string[];

  /**  */
  namenspraefix: string[];

  /**  */
  sortierindex?: string;
}

export interface PersonBirthParams {
  /**  */
  datum?: Date;

  /**  */
  geburtsort?: string;
}

export interface CreatePersonBodyParams {
  /**  */
  username: string;

  /**  */
  email?: string;

  /**  */
  referrer?: string;

  /**  */
  mandant: string;

  /**  */
  stammorganisation?: string;

  /**  */
  name: PersonNameParams;

  /**  */
  geburt: CombinedGeburtTypes;

  /**  */
  geschlecht?: EnumCreatePersonBodyParamsGeschlecht;

  /**  */
  lokalisierung?: string;

  /**  */
  vertrauensstufe?: EnumCreatePersonBodyParamsVertrauensstufe;

  /**  */
  auskunftssperre?: boolean;
}

export interface CreatePersonenkontextBodyParams {
  /**  */
  referrer?: string;

  /**  */
  rolle: EnumCreatePersonenkontextBodyParamsRolle;

  /**  */
  personenstatus?: EnumCreatePersonenkontextBodyParamsPersonenstatus;

  /**  */
  jahrgangsstufe?: EnumCreatePersonenkontextBodyParamsJahrgangsstufe;
}

export interface PersonResponse {
  /**  */
  id: string;

  /**  */
  referrer?: string;

  /**  */
  mandant: string;

  /**  */
  name: CombinedNameTypes;

  /**  */
  geburt: CombinedGeburtTypes;

  /**  */
  stammorganisation?: string;

  /**  */
  geschlecht: string;

  /**  */
  lokalisierung: string;

  /**  */
  vertrauensstufe: string;
}

export interface PersonendatensatzResponse {
  /**  */
  person: CombinedPersonTypes;
}

export interface CreateOrganisationBodyParams {
  /**  */
  kennung: string;

  /**  */
  name: string;

  /**  */
  namensergaenzung: string;

  /**  */
  kuerzel: string;

  /**  */
  typ: EnumCreateOrganisationBodyParamsTyp;
}
export type CombinedGeburtTypes = PersonBirthParams;
export enum EnumCreatePersonBodyParamsGeschlecht {
  'm' = 'm',
  'f' = 'f',
  'd' = 'd',
  'x' = 'x'
}
export enum EnumCreatePersonBodyParamsVertrauensstufe {
  'kein' = 'kein',
  'unbe' = 'unbe',
  'teil' = 'teil',
  'voll' = 'voll'
}
export enum EnumCreatePersonenkontextBodyParamsRolle {
  'LERN' = 'LERN',
  'LEHR' = 'LEHR',
  'EXTERN' = 'EXTERN',
  'ORGADMIN' = 'ORGADMIN',
  'LEIT' = 'LEIT',
  'SYSADMIN' = 'SYSADMIN'
}
export enum EnumCreatePersonenkontextBodyParamsPersonenstatus {
  'AKTIV' = 'AKTIV'
}
export enum EnumCreatePersonenkontextBodyParamsJahrgangsstufe {
  'KEY_01' = '01',
  'KEY_02' = '02',
  'KEY_03' = '03',
  'KEY_04' = '04',
  'KEY_05' = '05',
  'KEY_06' = '06',
  'KEY_07' = '07',
  'KEY_08' = '08',
  'KEY_09' = '09',
  'KEY_10' = '10'
}
export type CombinedNameTypes = PersonNameParams;
export type CombinedPersonTypes = PersonResponse;
export enum EnumCreateOrganisationBodyParamsTyp {
  'SCHULE' = 'SCHULE',
  'ANBIETER' = 'ANBIETER',
  'SONSTIGE ORGANISATION / EINRICHTUNG' = 'SONSTIGE ORGANISATION / EINRICHTUNG',
  'UNBESTAETIGT' = 'UNBESTAETIGT'
}
