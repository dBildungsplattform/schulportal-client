import { describe, expect, test } from 'vitest';
import routes from '@/router/routes';

type RouteConfigExpectation = {
  name: string;
  path: string;
  layout?: 'DefaultLayout' | 'AdminLayout';
  requiresAuth?: boolean;
  requiresPermission?: string | string[];
  redirect?: string;
};

const routeExpectations: RouteConfigExpectation[] = [
  {
    name: 'landing',
    path: '/',
    layout: 'DefaultLayout',
    requiresAuth: false,
  },
  {
    name: 'person-management',
    path: '/admin/personen',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'personenverwaltung',
  },
  {
    name: 'person-details',
    path: '/admin/personen/:id',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'personenverwaltung',
  },
  {
    name: 'create-person',
    path: '/admin/personen/new',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: ['personenverwaltung', 'personenanlegen'],
  },
  // {
  //   name: 'person-import',
  //   path: '/admin/personen/import',
  //   layout: 'AdminLayout',
  //   requiresAuth: true,
  //   requiresPermission: 'personenimport',
  // },
  {
    name: 'klasse-management',
    path: '/admin/klassen',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'klassenverwaltung',
  },
  {
    name: 'create-klasse',
    path: '/admin/klassen/new',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'klassenverwaltung',
  },
  {
    name: 'klasse-details',
    path: '/admin/klassen/:id',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'klassenverwaltung',
  },
  {
    name: 'create-rolle',
    path: '/admin/rollen/new',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'rollenverwaltung',
  },
  {
    name: 'rolle-details',
    path: '/admin/rollen/:id',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'rollenverwaltung',
  },
  {
    name: 'rolle-management',
    path: '/admin/rollen',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'rollenverwaltung',
  },
  {
    name: 'schule-management',
    path: '/admin/schulen',
    layout: 'AdminLayout',
    requiresAuth: true,
    requiresPermission: 'schulverwaltung',
  },
  {
    name: 'start',
    path: '/start',
    layout: 'DefaultLayout',
    requiresAuth: true,
  },
  {
    name: 'login-error',
    path: '/login-error',
  },
  {
    name: 'profile',
    path: '/profile',
    layout: 'DefaultLayout',
    requiresAuth: true,
  },
  {
    name: 'imprint',
    path: '/impressum',
    layout: 'DefaultLayout',
    requiresAuth: false,
  },
  {
    name: 'help',
    path: '/hilfe',
    layout: 'DefaultLayout',
    requiresAuth: false,
  },
  {
    name: 'instructions',
    path: '/anleitungen',
    redirect: '/hilfe',
  },
  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
  },
  {
    name: 'no-second-factor',
    path: '/no-second-factor',
  },
  // {
  //   name: 'rolle-mapping',
  //   path: '/admin/rolle/mapping/:lms',
  //   layout: 'AdminLayout',
  //   requiresAuth: true,
  //   requiresPermission: 'rollenverwaltung',
  // },
];

function assertRouteConfig(expectation: RouteConfigExpectation): void {
  const route: (typeof routes)[number] | undefined = routes.find(
    (r: (typeof routes)[number]) => r.name === expectation.name,
  );

  expect(route).toBeDefined();
  expect(route?.path).toBe(expectation.path);

  if (expectation.layout !== undefined) {
    expect(route?.meta?.['layout']).toBe(expectation.layout);
  }

  if (expectation.requiresAuth !== undefined) {
    expect(route?.meta?.['requiresAuth']).toBe(expectation.requiresAuth);
  }

  if (expectation.redirect !== undefined) {
    expect(route?.redirect).toBe(expectation.redirect);
  }

  if (expectation.requiresPermission !== undefined) {
    const actualPermission: unknown = route?.meta?.['requiresPermission'];
    const expectedPermissions: string[] = Array.isArray(expectation.requiresPermission)
      ? expectation.requiresPermission
      : [expectation.requiresPermission];

    const actualPermissions: string[] = Array.isArray(actualPermission)
      ? (actualPermission as string[])
      : [actualPermission as string];

    expect(actualPermissions).toEqual(expectedPermissions);
  }
}

describe('routes configuration', () => {
  routeExpectations.forEach((expectation: RouteConfigExpectation) => {
    test(`route ${expectation.name} is configured correctly`, () => {
      assertRouteConfig(expectation);
    });
  });
});
