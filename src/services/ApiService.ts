/* this is used as a base class for all API based services */
import axios, { AxiosError, HttpStatusCode, type AxiosResponse, type AxiosInstance } from 'axios';

const axiosApiInstance: AxiosInstance = axios.create({
  baseURL: '/',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

axiosApiInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === HttpStatusCode.Unauthorized) {
      window.location.href = `/api/auth/login?redirectUrl=${location.href}`;
    }

    return Promise.reject(error);
  },
);

export default axiosApiInstance;
