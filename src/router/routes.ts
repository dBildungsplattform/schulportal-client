import type { RouteMeta, RouteRecordRaw } from 'vue-router';

type Layout = 'DefaultLayout' | 'AdminLayout';

interface BaseMeta extends RouteMeta {
  layout: Layout;
  requiresAuth: boolean;
}

type AdminMeta = BaseMeta & { layout: 'AdminLayout' };
type DefaultLayoutMeta = BaseMeta & { layout: 'DefaultLayout' };

const adminMeta: AdminMeta = {
  layout: 'AdminLayout',
  requiresAuth: true,
};

const defaultLayoutMetaAuthenticated: DefaultLayoutMeta = {
  layout: 'DefaultLayout',
  requiresAuth: true,
};

const defaultLayoutMetaPublic: DefaultLayoutMeta = {
  layout: 'DefaultLayout',
  requiresAuth: false,
};

const routes: readonly RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingView.vue'),
    meta: defaultLayoutMetaPublic,
  },
  {
    path: '/admin/personen',
    name: 'person-management',
    component: () => import('../views/admin/PersonManagementView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'personenverwaltung',
    },
  },
  {
    path: '/admin/personen/:id',
    name: 'person-details',
    component: () => import('../views/admin/PersonDetailsView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'personenverwaltung',
    },
  },
  {
    path: '/admin/personen/new',
    name: 'create-person',
    component: () => import('../views/admin/PersonCreationView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: ['personenverwaltung', 'personenanlegen'],
    },
  },
  /*
  {
    path: '/admin/personen/import',
    name: 'person-import',
    component: () => import('../views/admin/PersonImportView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'personenimport',
    },
  },
  */
  {
    path: '/admin/klassen',
    name: 'klasse-management',
    component: () => import('../views/admin/organisationen/KlassenManagementView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'klassenverwaltung',
    },
  },
  {
    path: '/admin/klassen/new',
    name: 'create-klasse',
    component: () => import('../views/admin/organisationen/KlasseCreationView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'klassenverwaltung',
    },
  },
  {
    path: '/admin/klassen/:id',
    name: 'klasse-details',
    component: () => import('../views/admin/organisationen/KlasseDetailsView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'klassenverwaltung',
    },
  },
  {
    path: '/admin/rollen/new',
    name: 'create-rolle',
    component: () => import('../views/admin/rollen/RolleCreationView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'rollenverwaltung',
    },
  },
  {
    path: '/admin/rollen/:id',
    name: 'rolle-details',
    component: () => import('../views/admin/rollen/RolleDetailsView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'rollenverwaltung',
    },
  },
  {
    path: '/admin/rollen',
    name: 'rolle-management',
    component: () => import('../views/admin/rollen/RolleManagementView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'rollenverwaltung',
    },
  },
  {
    path: '/admin/schulen',
    name: 'schule-management',
    component: () => import('../views/admin/organisationen/SchuleManagementView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'schulverwaltung',
    },
  },
  {
    path: '/start',
    name: 'start',
    component: () => import('../views/StartView.vue'),
    meta: defaultLayoutMetaAuthenticated,
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
    meta: defaultLayoutMetaAuthenticated,
  },
  {
    path: '/impressum',
    name: 'imprint',
    component: () => import('../views/ImprintView.vue'),
    meta: defaultLayoutMetaPublic,
  },
  {
    path: '/hilfe',
    name: 'help',
    component: () => import('../views/InstructionsView.vue'),
    meta: defaultLayoutMetaPublic,
  },
  {
    path: '/hilfe/kontakt',
    name: 'help-contact',
    component: () => import('../views/HelpContactView.vue'),
    meta: defaultLayoutMetaPublic,
  },
  {
    path: '/hilfe/faq',
    name: 'help-faq',
    component: () => import('../views/HelpFaqView.vue'),
    meta: defaultLayoutMetaPublic,
  },
  {
    path: '/anleitungen',
    name: 'instructions',
    redirect: '/hilfe',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
  {
    path: '/no-second-factor',
    name: 'no-second-factor',
    component: () => import('../views/NoSecondFactorView.vue'),
  },
  {
    path: '/admin/rolle/mapping/:lms',
    name: 'rolle-mapping',
    component: () => import('../views/admin/RolleMappingView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'rollenverwaltung',
    },
  },
  /*
  {
    path: '/admin/schultraeger',
    name: 'schultraeger-management',
    component: () => import('../views/admin/organisationen/SchultraegerManagementView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'schultraegerverwaltung',
    },
  },
  {
    path: '/admin/schultraeger/new',
    name: 'create-schultraeger',
    component: () => import('../views/admin/organisationen/SchultraegerCreationView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'schultraegerverwaltung',
    },
  },
  {
    path: '/admin/schultraeger/:id',
    name: 'schultraeger-details',
    component: () => import('../views/admin/organisationen/SchultraegerDetailsView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'schultraegerverwaltung',
    },
  },
  {
    path: '/admin/hinweise/new',
    name: 'hinweise-creation',
    component: () => import('../views/admin/HinweiseCreationView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: ['portalverwaltung', 'hinweisebearbeiten'],
    },
  },
  {
    path: '/admin/schulen/new',
    name: 'create-schule',
    component: () => import('../views/admin/organisationen/SchuleCreationView.vue'),
    meta: {
      ...adminMeta,
      requiresPermission: 'schulverwaltung',
    },
  },
  */
];

export default routes;
