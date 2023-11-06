import { defineStore } from 'pinia'
import router from '@/router'
import ApiService from '@/services/ApiService'

export const useAuthStore = defineStore({
  id: 'authStore',
  state: () => ({
    /* initialize state from local storage to enable user to stay logged in */
    errorCode: '' as string,
    loading: false as boolean,
    returnUrl: '',
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null
  }),
  actions: {
    async login(username: string, password: string) {
      this.loading = true
      try {
        const user = await ApiService.post('/login', { username, password })

        /* update state */
        this.user = user

        /* store token in local storage to keep user logged in between page refreshes */
        localStorage.setItem('user', JSON.stringify(user))

        /* redirect to previous url or default to dashboard */
        router.push(this.returnUrl || '/home')

        this.loading = false
      } catch (error: any) {
        this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('user')
      router.push('/login')
    },

    async resetPassword(userId: string) {
      this.loading = true
      try {
        const { data } = await ApiService.patch('/person/' + userId + '/password')
        this.loading = false
        return data
      } catch (error: any) {
        this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    }
  }
})
