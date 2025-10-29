import { isAxiosError } from 'axios';

// Type the error response data structure otherwise eslint complains
type ApiErrorData = {
  i18nKey?: string;
  code?: string;
  message?: string;
};

export function getResponseErrorCode(error: unknown, defaultErrorCode: string): string {
  if (isAxiosError<ApiErrorData>(error)) {
    const data: ApiErrorData | undefined = error.response?.data;
    const errorCode: string | undefined = data?.i18nKey ?? data?.code;
    return errorCode ?? defaultErrorCode;
  }

  return 'UNSPECIFIED_ERROR';
}

/* some endpoints respond with an error message, so we have to cover that case as well */
export function getResponseErrorMessage(error: unknown): string {
  let errorCode: string = 'UNSPECIFIED_ERROR';

  if (isAxiosError<ApiErrorData>(error)) {
    const msg: string = error.response?.data?.message ?? 'UNSPECIFIED_ERROR';
    errorCode = msg;
  }

  return errorCode;
}
