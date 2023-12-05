/* this is used as a base class for all API based services */
import router from '@/router'
import axios, { AxiosError, HttpStatusCode, type AxiosResponse, type AxiosInstance } from 'axios'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const axiosApiInstance: AxiosInstance = axios.create({
  baseURL: '/',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

axiosApiInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === HttpStatusCode.Unauthorized) {
      const route: RouteLocationNormalizedLoaded = router.currentRoute.value

      return `/api/frontend/login?redirectUrl=${route.fullPath}`
    }

    return Promise.reject(error)
  }
)

export default axiosApiInstance
