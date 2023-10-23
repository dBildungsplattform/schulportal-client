/* this is used as a base class for all API based services */
import axios from 'axios'

const axiosApiInstance = axios.create({
  baseURL: '/api/frontend',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

axiosApiInstance.interceptors.request.use((config) => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null
  const token = user?.data?.access_token
  config.headers.Authorization = `Bearer ${token}`
   
  return config
})

export default axiosApiInstance
