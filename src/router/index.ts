import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to /*, from */) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.user) {
    auth.returnUrl = to.fullPath
    return '/login'
  }
})

export default router
