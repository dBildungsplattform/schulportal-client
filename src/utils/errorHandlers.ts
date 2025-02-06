import { isAxiosError } from 'axios';

export function getResponseErrorCode(error: unknown, defaultErrorCode: string): string {
  if (isAxiosError(error)) {
    /* some endpoints respond an error string inside data.i18nKey, some endpoints respond with an error string inside data.code */
    const errorCode: string = error.response?.data.i18nKey ? error.response.data.i18nKey : error.response?.data.code;

    return errorCode || defaultErrorCode;
  }

  /* if an unknown error occurs, return UNSPECIFIED_ERROR */
  return 'UNSPECIFIED_ERROR';
}

/* some endpoints respond with an error message, so we have to cover that case as well */
export function getResponseErrorMesage(error: unknown): string {
  /* if an unknown error occurs, return UNSPECIFIED_ERROR */
  let errorCode: string = 'UNSPECIFIED_ERROR';

  if (isAxiosError(error)) {
    errorCode = error.response?.data.message ? error.response.data.message : 'UNSPECIFIED_ERROR';
  }

  return errorCode;
}
