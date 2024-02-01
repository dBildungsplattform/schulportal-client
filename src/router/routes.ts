import type { RouteRecordRaw } from 'vue-router'

const routes: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: false
    }
  },
  {
    path: '/admin/users',
    name: 'user-management',
    component: () => import('../views/admin/UserManagementView.vue'),
    meta: {
      requiresAuth: false,
      layout: 'AdminLayout'
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
    path: '/admin/create-role',
    name: 'create-role',
    component: () => import('../views/admin/UserRoleCreateView.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/start',
    name: 'start',
    component: () => import('../views/StartView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: true
    }
  }
  
]

export default routes
