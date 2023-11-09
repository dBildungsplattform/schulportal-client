/* this is used as a base class for all API based services */
import router from '@/router'
import { useAuthStore } from '@/stores/AuthStore'
import axios, { AxiosError, HttpStatusCode } from 'axios'

const axiosApiInstance = axios.create({
  baseURL: '/api/frontend',
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
      const authStore = useAuthStore()
      const route = router.currentRoute.value

      return authStore.login(route.fullPath)
    }

    return error
  }
)

export default axiosApiInstance
