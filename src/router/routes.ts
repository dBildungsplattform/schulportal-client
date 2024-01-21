import type { RouteRecordRaw } from 'vue-router'

const routes: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/admin/users',
    name: 'user-management',
    component: () => import('../views/admin/UserManagementView.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/admin/users/:id',
    name: 'user-details',
    component: () => import('../views/admin/UserDetailsView.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/start',
    name: 'start',
    component: () => import('../views/StartView.vue'),
    meta: {
      requiresAuth: false
    }
  }
]

export default routes
