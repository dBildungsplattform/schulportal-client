import type { RouteRecordRaw } from 'vue-router';

const routes: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: false,
      requiresStepUp: false,
    },
  },
  {
    path: '/admin/personen',
    name: 'person-management',
    component: () => import('../views/admin/PersonManagementView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'personenverwaltung',
    },
  },
  {
    path: '/admin/personen/:id',
    name: 'person-details',
    component: () => import('../views/admin/PersonDetailsView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'personenverwaltung',
    },
  },
  {
    path: '/admin/personen/new',
    name: 'create-person',
    component: () => import('../views/admin/PersonCreationView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'personenverwaltung',
    },
  },
  {
    path: '/admin/klassen',
    name: 'klasse-management',
    component: () => import('../views/admin/KlassenManagementView.vue'),
    meta: {
      requiresAuth: true,
      layout: 'AdminLayout',
      requiresStepUp: true,
      requiresPermission: 'klassenverwaltung',
    },
  },
  {
    path: '/admin/klassen/new',
    name: 'create-klasse',
    component: () => import('../views/admin/KlasseCreationView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'klassenverwaltung',
    },
  },
  {
    path: '/admin/klassen/:id',
    name: 'klasse-details',
    component: () => import('../views/admin/KlasseDetailsView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'klassenverwaltung',
    },
  },
  {
    path: '/admin/rollen/new',
    name: 'create-rolle',
    component: () => import('../views/admin/rollen/RolleCreationView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'rollenverwaltung',
    },
  },
  {
    path: '/admin/rollen/:id',
    name: 'rolle-details',
    component: () => import('../views/admin/rollen/RolleDetailsView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'rollenverwaltung',
    },
  },
  {
    path: '/admin/rollen',
    name: 'rolle-management',
    component: () => import('../views/admin/rollen/RolleManagementView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'rollenverwaltung',
    },
  },
  {
    path: '/admin/schulen/new',
    name: 'create-schule',
    component: () => import('../views/admin/SchuleCreationView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'schulverwaltung',
    },
  },
  {
    path: '/admin/schulen',
    name: 'schule-management',
    component: () => import('../views/admin/SchuleManagementView.vue'),
    meta: {
      layout: 'AdminLayout',
      requiresAuth: true,
      requiresStepUp: true,
      requiresPermission: 'schulverwaltung',
    },
  },
  {
    path: '/start',
    name: 'start',
    component: () => import('../views/StartView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: true,
      requiresStepUp: false,
    },
  },
  {
    path: '/login-error',
    name: 'login-error',
    component: () => import('../views/UnknownUserErrorView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: {
      layout: 'DefaultLayout',
      requiresAuth: true,
      requiresHighLoa: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
];

export default routes;
