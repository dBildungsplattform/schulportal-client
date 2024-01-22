import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type Router
} from 'vue-router'
import { useAuthStore, type AuthStore } from '@/stores/AuthStore'
import routes from './routes'

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to: RouteLocationNormalized /*, from */) => {
  const auth: AuthStore = useAuthStore()

  await auth.initializeAuthStatus()

  // Redirect authenticated users trying to access the login page to the start page
  if (to.path === '/' && auth.isAuthed) {
    return { path: '/start' }
  }

  if (to.meta['requiresAuth'] && !auth.isAuthed) {
    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}`
    return false
  }

  return true
})

export default router
