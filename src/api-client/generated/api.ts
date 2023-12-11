/* tslint:disable */
/* eslint-disable */
/**
 * dBildungs IAM
 * The dBildungs IAM server API description
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import type { Configuration } from './configuration';
import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
import type { RequestArgs } from './base';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, BaseAPI, RequiredError } from './base';

/**
 * 
 * @export
 * @interface CreatePersonBodyParams
 */
export interface CreatePersonBodyParams {
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'username': string;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'email'?: string;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'referrer'?: string;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'mandant': string;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'stammorganisation'?: string;
    /**
     * 
     * @type {PersonNameParams}
     * @memberof CreatePersonBodyParams
     */
    'name': PersonNameParams;
    /**
     * 
     * @type {PersonBirthParams}
     * @memberof CreatePersonBodyParams
     */
    'geburt'?: PersonBirthParams;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'geschlecht'?: CreatePersonBodyParamsGeschlechtEnum;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'lokalisierung'?: string;
    /**
     * 
     * @type {string}
     * @memberof CreatePersonBodyParams
     */
    'vertrauensstufe'?: CreatePersonBodyParamsVertrauensstufeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof CreatePersonBodyParams
     */
    'auskunftssperre'?: boolean;
}

export const CreatePersonBodyParamsGeschlechtEnum = {
    M: 'm',
    W: 'w',
    D: 'd',
    X: 'x'
} as const;

export type CreatePersonBodyParamsGeschlechtEnum = typeof CreatePersonBodyParamsGeschlechtEnum[keyof typeof CreatePersonBodyParamsGeschlechtEnum];
export const CreatePersonBodyParamsVertrauensstufeEnum = {
    Kein: 'KEIN',
    Unbe: 'UNBE',
    Teil: 'TEIL',
    Voll: 'VOLL'
} as const;

export type CreatePersonBodyParamsVertrauensstufeEnum = typeof CreatePersonBodyParamsVertrauensstufeEnum[keyof typeof CreatePersonBodyParamsVertrauensstufeEnum];

/**
 * 
 * @export
 * @interface FrontendControllerPersons200Response
 */
export interface FrontendControllerPersons200Response {
    /**
     * 
     * @type {number}
     * @memberof FrontendControllerPersons200Response
     */
    'offset': number;
    /**
     * 
     * @type {number}
     * @memberof FrontendControllerPersons200Response
     */
    'limit': number;
    /**
     * 
     * @type {number}
     * @memberof FrontendControllerPersons200Response
     */
    'total': number;
    /**
     * 
     * @type {Array<PersonendatensatzResponse>}
     * @memberof FrontendControllerPersons200Response
     */
    'items'?: Array<PersonendatensatzResponse>;
}
/**
 * 
 * @export
 * @interface FrontendControllerPersons200ResponseAllOf
 */
export interface FrontendControllerPersons200ResponseAllOf {
    /**
     * 
     * @type {Array<PersonendatensatzResponse>}
     * @memberof FrontendControllerPersons200ResponseAllOf
     */
    'items'?: Array<PersonendatensatzResponse>;
}
/**
 * 
 * @export
 * @interface LoeschungResponse
 */
export interface LoeschungResponse {
    /**
     * 
     * @type {string}
     * @memberof LoeschungResponse
     */
    'zeitpunkt': string;
}
/**
 * 
 * @export
 * @interface PaginatedResponseDto
 */
export interface PaginatedResponseDto {
    /**
     * 
     * @type {number}
     * @memberof PaginatedResponseDto
     */
    'offset': number;
    /**
     * 
     * @type {number}
     * @memberof PaginatedResponseDto
     */
    'limit': number;
    /**
     * 
     * @type {number}
     * @memberof PaginatedResponseDto
     */
    'total': number;
}
/**
 * 
 * @export
 * @interface PersonBirthParams
 */
export interface PersonBirthParams {
    /**
     * 
     * @type {string}
     * @memberof PersonBirthParams
     */
    'datum'?: string;
    /**
     * 
     * @type {string}
     * @memberof PersonBirthParams
     */
    'geburtsort'?: string;
}
/**
 * 
 * @export
 * @interface PersonNameParams
 */
export interface PersonNameParams {
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'familienname': string;
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'vorname': string;
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'initialenfamilienname'?: string;
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'initialenvorname'?: string;
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'rufname'?: string;
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'titel'?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof PersonNameParams
     */
    'anrede'?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof PersonNameParams
     */
    'namenssuffix'?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof PersonNameParams
     */
    'namenspraefix'?: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof PersonNameParams
     */
    'sortierindex'?: string;
}
/**
 * 
 * @export
 * @interface PersonResponse
 */
export interface PersonResponse {
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'id': string;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'referrer': string;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'mandant': string;
    /**
     * 
     * @type {PersonNameParams}
     * @memberof PersonResponse
     */
    'name': PersonNameParams;
    /**
     * 
     * @type {PersonBirthParams}
     * @memberof PersonResponse
     */
    'geburt': PersonBirthParams;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'stammorganisation': string;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'geschlecht': string;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'lokalisierung': string;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'vertrauensstufe': PersonResponseVertrauensstufeEnum;
    /**
     * 
     * @type {string}
     * @memberof PersonResponse
     */
    'revision': string;
    /**
     * Initiales Benutzerpasswort, muss nach der ersten Anmeldung geändert werden
     * @type {string}
     * @memberof PersonResponse
     */
    'startpasswort': string;
}

export const PersonResponseVertrauensstufeEnum = {
    Kein: 'KEIN',
    Unbe: 'UNBE',
    Teil: 'TEIL',
    Voll: 'VOLL'
} as const;

export type PersonResponseVertrauensstufeEnum = typeof PersonResponseVertrauensstufeEnum[keyof typeof PersonResponseVertrauensstufeEnum];

/**
 * 
 * @export
 * @interface PersonendatensatzResponse
 */
export interface PersonendatensatzResponse {
    /**
     * 
     * @type {PersonResponse}
     * @memberof PersonendatensatzResponse
     */
    'person': PersonResponse;
    /**
     * 
     * @type {Array<PersonenkontextResponse>}
     * @memberof PersonendatensatzResponse
     */
    'personenkontexte': Array<PersonenkontextResponse>;
}
/**
 * 
 * @export
 * @interface PersonenkontextResponse
 */
export interface PersonenkontextResponse {
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'id': string;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'referrer': string;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'mandant': string;
    /**
     * 
     * @type {object}
     * @memberof PersonenkontextResponse
     */
    'organisation': object;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'rolle': string;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'personenstatus': string;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'jahrgangsstufe': string;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'sichtfreigabe': string;
    /**
     * 
     * @type {LoeschungResponse}
     * @memberof PersonenkontextResponse
     */
    'loeschung': LoeschungResponse;
    /**
     * 
     * @type {string}
     * @memberof PersonenkontextResponse
     */
    'revision': string;
}
/**
 * 
 * @export
 * @interface ServiceProviderInfoResponse
 */
export interface ServiceProviderInfoResponse {
    /**
     * 
     * @type {string}
     * @memberof ServiceProviderInfoResponse
     */
    'id': string;
    /**
     * 
     * @type {string}
     * @memberof ServiceProviderInfoResponse
     */
    'name': string;
    /**
     * 
     * @type {string}
     * @memberof ServiceProviderInfoResponse
     */
    'url': string;
}
/**
 * 
 * @export
 * @interface UserinfoResponse
 */
export interface UserinfoResponse {
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'sub': string;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'name': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'given_name': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'family_name': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'middle_name': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'nickname': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'preferred_username': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'profile': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'picture': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'website': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'email': string | null;
    /**
     * 
     * @type {boolean}
     * @memberof UserinfoResponse
     */
    'email_verified': boolean | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'gender': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'birthdate': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'zoneinfo': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'locale': string | null;
    /**
     * 
     * @type {string}
     * @memberof UserinfoResponse
     */
    'phone_number': string | null;
    /**
     * 
     * @type {number}
     * @memberof UserinfoResponse
     */
    'updated_at': number | null;
}

/**
 * FrontendApi - axios parameter creator
 * @export
 */
export const FrontendApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Creates a new person.
         * @param {CreatePersonBodyParams} createPersonBodyParams 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerCreatePerson: async (createPersonBodyParams: CreatePersonBodyParams, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'createPersonBodyParams' is not null or undefined
            assertParamExists('frontendControllerCreatePerson', 'createPersonBodyParams', createPersonBodyParams)
            const localVarPath = `/api/frontend/personen`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(createPersonBodyParams, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Info about logged in user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerInfo: async (options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/frontend/logininfo`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Used to start OIDC authentication.
         * @param {string} [redirectUrl] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerLogin: async (redirectUrl?: string, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/frontend/login`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (redirectUrl !== undefined) {
                localVarQueryParameter['redirectUrl'] = redirectUrl;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Used to log out the current user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerLogout: async (options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/frontend/logout`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Resets the users password.
         * @param {string} personId The id for the account.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPasswordReset: async (personId: string, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'personId' is not null or undefined
            assertParamExists('frontendControllerPasswordReset', 'personId', personId)
            const localVarPath = `/api/frontend/personen/{personId}/password`
                .replace(`{${"personId"}}`, encodeURIComponent(String(personId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PATCH', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Lists personen.
         * @param {number} [offset] The offset of the paginated list.
         * @param {number} [limit] The requested limit for the page size.
         * @param {string} [referrer] 
         * @param {string} [familienname] 
         * @param {string} [vorname] 
         * @param {'ja' | 'nein'} [sichtfreigabe] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPersons: async (offset?: number, limit?: number, referrer?: string, familienname?: string, vorname?: string, sichtfreigabe?: 'ja' | 'nein', options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/frontend/personen`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (referrer !== undefined) {
                localVarQueryParameter['referrer'] = referrer;
            }

            if (familienname !== undefined) {
                localVarQueryParameter['familienname'] = familienname;
            }

            if (vorname !== undefined) {
                localVarQueryParameter['vorname'] = vorname;
            }

            if (sichtfreigabe !== undefined) {
                localVarQueryParameter['sichtfreigabe'] = sichtfreigabe;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Providers the user has access to.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerProvider: async (options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/frontend/provider`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * FrontendApi - functional programming interface
 * @export
 */
export const FrontendApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = FrontendApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Creates a new person.
         * @param {CreatePersonBodyParams} createPersonBodyParams 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerCreatePerson(createPersonBodyParams: CreatePersonBodyParams, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PersonendatensatzResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerCreatePerson(createPersonBodyParams, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Info about logged in user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerInfo(options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<UserinfoResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerInfo(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Used to start OIDC authentication.
         * @param {string} [redirectUrl] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerLogin(redirectUrl?: string, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerLogin(redirectUrl, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Used to log out the current user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerLogout(options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerLogout(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Resets the users password.
         * @param {string} personId The id for the account.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerPasswordReset(personId: string, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<string>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerPasswordReset(personId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Lists personen.
         * @param {number} [offset] The offset of the paginated list.
         * @param {number} [limit] The requested limit for the page size.
         * @param {string} [referrer] 
         * @param {string} [familienname] 
         * @param {string} [vorname] 
         * @param {'ja' | 'nein'} [sichtfreigabe] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerPersons(offset?: number, limit?: number, referrer?: string, familienname?: string, vorname?: string, sichtfreigabe?: 'ja' | 'nein', options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<FrontendControllerPersons200Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerPersons(offset, limit, referrer, familienname, vorname, sichtfreigabe, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Providers the user has access to.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerProvider(options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<ServiceProviderInfoResponse>>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerProvider(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * FrontendApi - factory interface
 * @export
 */
export const FrontendApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = FrontendApiFp(configuration)
    return {
        /**
         * 
         * @summary Creates a new person.
         * @param {CreatePersonBodyParams} createPersonBodyParams 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerCreatePerson(createPersonBodyParams: CreatePersonBodyParams, options?: any): AxiosPromise<PersonendatensatzResponse> {
            return localVarFp.frontendControllerCreatePerson(createPersonBodyParams, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Info about logged in user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerInfo(options?: any): AxiosPromise<UserinfoResponse> {
            return localVarFp.frontendControllerInfo(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Used to start OIDC authentication.
         * @param {string} [redirectUrl] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerLogin(redirectUrl?: string, options?: any): AxiosPromise<void> {
            return localVarFp.frontendControllerLogin(redirectUrl, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Used to log out the current user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerLogout(options?: any): AxiosPromise<void> {
            return localVarFp.frontendControllerLogout(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Resets the users password.
         * @param {string} personId The id for the account.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPasswordReset(personId: string, options?: any): AxiosPromise<string> {
            return localVarFp.frontendControllerPasswordReset(personId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Lists personen.
         * @param {number} [offset] The offset of the paginated list.
         * @param {number} [limit] The requested limit for the page size.
         * @param {string} [referrer] 
         * @param {string} [familienname] 
         * @param {string} [vorname] 
         * @param {'ja' | 'nein'} [sichtfreigabe] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPersons(offset?: number, limit?: number, referrer?: string, familienname?: string, vorname?: string, sichtfreigabe?: 'ja' | 'nein', options?: any): AxiosPromise<FrontendControllerPersons200Response> {
            return localVarFp.frontendControllerPersons(offset, limit, referrer, familienname, vorname, sichtfreigabe, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Providers the user has access to.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerProvider(options?: any): AxiosPromise<Array<ServiceProviderInfoResponse>> {
            return localVarFp.frontendControllerProvider(options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * FrontendApi - interface
 * @export
 * @interface FrontendApi
 */
export interface FrontendApiInterface {
    /**
     * 
     * @summary Creates a new person.
     * @param {CreatePersonBodyParams} createPersonBodyParams 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerCreatePerson(createPersonBodyParams: CreatePersonBodyParams, options?: AxiosRequestConfig): AxiosPromise<PersonendatensatzResponse>;

    /**
     * 
     * @summary Info about logged in user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerInfo(options?: AxiosRequestConfig): AxiosPromise<UserinfoResponse>;

    /**
     * 
     * @summary Used to start OIDC authentication.
     * @param {string} [redirectUrl] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerLogin(redirectUrl?: string, options?: AxiosRequestConfig): AxiosPromise<void>;

    /**
     * 
     * @summary Used to log out the current user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerLogout(options?: AxiosRequestConfig): AxiosPromise<void>;

    /**
     * 
     * @summary Resets the users password.
     * @param {string} personId The id for the account.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerPasswordReset(personId: string, options?: AxiosRequestConfig): AxiosPromise<string>;

    /**
     * 
     * @summary Lists personen.
     * @param {number} [offset] The offset of the paginated list.
     * @param {number} [limit] The requested limit for the page size.
     * @param {string} [referrer] 
     * @param {string} [familienname] 
     * @param {string} [vorname] 
     * @param {'ja' | 'nein'} [sichtfreigabe] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerPersons(offset?: number, limit?: number, referrer?: string, familienname?: string, vorname?: string, sichtfreigabe?: 'ja' | 'nein', options?: AxiosRequestConfig): AxiosPromise<FrontendControllerPersons200Response>;

    /**
     * 
     * @summary Providers the user has access to.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerProvider(options?: AxiosRequestConfig): AxiosPromise<Array<ServiceProviderInfoResponse>>;

}

/**
 * FrontendApi - object-oriented interface
 * @export
 * @class FrontendApi
 * @extends {BaseAPI}
 */
export class FrontendApi extends BaseAPI implements FrontendApiInterface {
    /**
     * 
     * @summary Creates a new person.
     * @param {CreatePersonBodyParams} createPersonBodyParams 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerCreatePerson(createPersonBodyParams: CreatePersonBodyParams, options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerCreatePerson(createPersonBodyParams, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Info about logged in user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerInfo(options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerInfo(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Used to start OIDC authentication.
     * @param {string} [redirectUrl] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerLogin(redirectUrl?: string, options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerLogin(redirectUrl, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Used to log out the current user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerLogout(options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerLogout(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Resets the users password.
     * @param {string} personId The id for the account.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerPasswordReset(personId: string, options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerPasswordReset(personId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Lists personen.
     * @param {number} [offset] The offset of the paginated list.
     * @param {number} [limit] The requested limit for the page size.
     * @param {string} [referrer] 
     * @param {string} [familienname] 
     * @param {string} [vorname] 
     * @param {'ja' | 'nein'} [sichtfreigabe] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerPersons(offset?: number, limit?: number, referrer?: string, familienname?: string, vorname?: string, sichtfreigabe?: 'ja' | 'nein', options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerPersons(offset, limit, referrer, familienname, vorname, sichtfreigabe, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Providers the user has access to.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerProvider(options?: AxiosRequestConfig) {
        return FrontendApiFp(this.configuration).frontendControllerProvider(options).then((request) => request(this.axios, this.basePath));
    }
}


