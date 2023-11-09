import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to /*, from */) => {
  const auth = useAuthStore()

  await auth.initializeAuthStatus()

  if (to.meta.requiresAuth && !auth.isAuthed) {
    auth.login(to.fullPath)
  }
})

export default router
