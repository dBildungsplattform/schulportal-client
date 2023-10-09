import { defineStore } from 'pinia'
import router from '@/router'
import ApiService from '@/services/ApiService'

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    /* initialize state from local storage to enable user to stay logged in */
    user: JSON.parse(localStorage.getItem('user') || '{}'),
    returnUrl: ''
  }),
  actions: {
    async login(username: string, password: string) {
      const user = await ApiService().post('/login', { username, password })

      /* update state */
      this.user = user

      /* store token in local storage to keep user logged in between page refreshes */
      localStorage.setItem('user', JSON.stringify(user))

      /* redirect to previous url or default to dashboard */
      router.push(this.returnUrl || '/home')
    },
    logout() {
      this.user = null;
      localStorage.removeItem('user')
      router.push('/login')
    }
  }
})