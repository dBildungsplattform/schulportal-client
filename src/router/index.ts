import { createRouter, createWebHistory, type Router } from 'vue-router'
import { useAuthStore, type AuthStore } from '@/stores/AuthStore'
import routes from './routes'

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to /*, from */) => {
  const auth: AuthStore = useAuthStore()

  await auth.initializeAuthStatus()

  if (to.meta['requiresAuth'] && !auth.isAuthed) {
    auth.login(to.fullPath)
  }
})

export default router
