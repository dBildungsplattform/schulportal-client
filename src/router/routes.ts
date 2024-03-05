import type { RouteRecordRaw } from 'vue-router';

const routes: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: false,
    },
  },
  {
    path: '/admin/personen',
    name: 'person-management',
    component: () => import('../views/admin/PersonManagementView.vue'),
    meta: {
      requiresAuth: true,
      layout: 'AdminLayout',
    },
  },
  {
    path: '/admin/personen/:id',
    name: 'person-details',
    component: () => import('../views/admin/PersonDetailsView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
    },
  },
  {
    path: '/admin/personen/new',
    name: 'create-person',
    component: () => import('../views/admin/PersonCreationView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
    },
  },
  {
    path: '/admin/rolle/new',
    name: 'create-rolle',
    component: () => import('../views/admin/RolleCreationView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
    },
  },
  {
    path: '/admin/rollen',
    name: 'rolle-management',
    component: () => import('../views/admin/RolleManagementView.vue'),
    meta: {
      requiresAuth: true,
      layout: 'AdminLayout',
    },
  },
  {
    path: '/admin/schulen',
    name: 'schule-management',
    component: () => import('../views/admin/SchuleManagementView.vue'),
    meta: {
      requiresAuth: true,
      layout: 'AdminLayout',
    },
  },
  {
    path: '/start',
    name: 'start',
    component: () => import('../views/StartView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: true,
    },
  },
];

export default routes;
