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


import { Configuration } from './configuration';
import globalAxios from 'axios';
import type { AxiosPromise, AxiosInstance } from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from './base';


/**
 * FrontendApi - axios parameter creator
 * @export
 */
export const FrontendApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Info about logged in user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerInfo: async (options: any = {}): Promise<RequestArgs> => {
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


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
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
        frontendControllerLogin: async (redirectUrl?: string, options: any = {}): Promise<RequestArgs> => {
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


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
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
        frontendControllerLogout: async (options: any = {}): Promise<RequestArgs> => {
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


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {string} personId The id for the account.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPasswordReset: async (personId: string, options: any = {}): Promise<RequestArgs> => {
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


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPersons: async (options: any = {}): Promise<RequestArgs> => {
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


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerProvider: async (options: any = {}): Promise<RequestArgs> => {
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


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
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
         * @summary Info about logged in user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerInfo(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
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
        async frontendControllerLogin(redirectUrl?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerLogin(redirectUrl, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Used to log out the current user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerLogout(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerLogout(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @param {string} personId The id for the account.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerPasswordReset(personId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerPasswordReset(personId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerPersons(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.frontendControllerPersons(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async frontendControllerProvider(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
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
         * @summary Info about logged in user.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerInfo(options?: any): AxiosPromise<void> {
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
         * @param {string} personId The id for the account.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPasswordReset(personId: string, options?: any): AxiosPromise<void> {
            return localVarFp.frontendControllerPasswordReset(personId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerPersons(options?: any): AxiosPromise<void> {
            return localVarFp.frontendControllerPersons(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        frontendControllerProvider(options?: any): AxiosPromise<void> {
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
     * @summary Info about logged in user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerInfo(options?: any): AxiosPromise<void>;

    /**
     * 
     * @summary Used to start OIDC authentication.
     * @param {string} [redirectUrl] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerLogin(redirectUrl?: string, options?: any): AxiosPromise<void>;

    /**
     * 
     * @summary Used to log out the current user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerLogout(options?: any): AxiosPromise<void>;

    /**
     * 
     * @param {string} personId The id for the account.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerPasswordReset(personId: string, options?: any): AxiosPromise<void>;

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerPersons(options?: any): AxiosPromise<void>;

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApiInterface
     */
    frontendControllerProvider(options?: any): AxiosPromise<void>;

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
     * @summary Info about logged in user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerInfo(options?: any) {
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
    public frontendControllerLogin(redirectUrl?: string, options?: any) {
        return FrontendApiFp(this.configuration).frontendControllerLogin(redirectUrl, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Used to log out the current user.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerLogout(options?: any) {
        return FrontendApiFp(this.configuration).frontendControllerLogout(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @param {string} personId The id for the account.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerPasswordReset(personId: string, options?: any) {
        return FrontendApiFp(this.configuration).frontendControllerPasswordReset(personId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerPersons(options?: any) {
        return FrontendApiFp(this.configuration).frontendControllerPersons(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FrontendApi
     */
    public frontendControllerProvider(options?: any) {
        return FrontendApiFp(this.configuration).frontendControllerProvider(options).then((request) => request(this.axios, this.basePath));
    }
}


