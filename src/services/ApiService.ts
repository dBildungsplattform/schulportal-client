/* this is used as a base class for all API based services */
import router from '@/router'
import axios, { AxiosError, HttpStatusCode } from 'axios'

const axiosApiInstance = axios.create({
  baseURL: '/',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

axiosApiInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error instanceof AxiosError && error.response?.status === HttpStatusCode.Unauthorized) {
      const route = router.currentRoute.value

      return `/api/frontend/login?redirectUrl=${route.fullPath}`
    }

    return error
  }
)

export default axiosApiInstance
