import { createRouter, createWebHistory, type RouteLocationNormalized, type Router } from 'vue-router';
import { StepUpLevel, useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import routes from './routes';
type Permission =
  | 'klassenverwaltung'
  | 'personenanlegen'
  | 'personenimport'
  | 'personenverwaltung'
  | 'rollenverwaltung'
  | 'schulverwaltung'
  | 'schultraegerverwaltung';

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(
    _from: RouteLocationNormalized,
    _to: RouteLocationNormalized,
    savedPosition: { left?: number; top?: number } | null,
  ) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

function handleGoToPreviousPage(): void {
  const previousUrl: string | null = sessionStorage.getItem('previousUrl');
  router.push(previousUrl ?? '/start');
}

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const authStore: AuthStore = useAuthStore();
  await authStore.initializeAuthStatus();
  if (to.path != '/profile' && to.path != '/no-second-factor') sessionStorage.setItem('previousUrl', to.path);

  if (to.path === '/no-second-factor') {
    const personId: string | null | undefined = authStore.currentUser?.personId;
    if (!personId) return false;
    const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
    await twoFactorAuthentificationStore.get2FAState(personId);
    if (twoFactorAuthentificationStore.hasToken) {
      handleGoToPreviousPage();
      return false;
    }
  }

  // Redirect authenticated users trying to access the login page to the start page
  if (to.path === '/' && authStore.isAuthed) {
    return { path: '/start' };
  }

  if (to.meta['requiresAuth'] && !authStore.isAuthed) {
    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}`;
    return false;
  }

  if (to.meta['requiredStepUpLevel'] === StepUpLevel.GOLD && authStore.acr !== StepUpLevel.GOLD) {
    const personId: string | null | undefined = authStore.currentUser?.personId;
    if (!personId) return false;
    const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
    await twoFactorAuthentificationStore.get2FAState(personId);
    if (!twoFactorAuthentificationStore.hasToken) {
      router.push(`/no-second-factor`);
      return false;
    }

    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}&requiredStepUpLevel=${StepUpLevel.GOLD}`;
    return false;
  }

  if (to.meta['requiresPermission']) {
    const requiredPermissions: Permission[] = Array.isArray(to.meta['requiresPermission'])
      ? to.meta['requiresPermission']
      : [to.meta['requiresPermission']];

    // Check if user has ALL required permissions
    const hasAllPermissions: boolean = requiredPermissions.every((permission: Permission) => {
      switch (permission) {
        case 'personenverwaltung':
          return authStore.hasPersonenverwaltungPermission;
        case 'personenanlegen':
          return authStore.hasPersonenAnlegenPermission;
        case 'personenimport':
          return authStore.hasImportPermission;
        case 'klassenverwaltung':
          return authStore.hasKlassenverwaltungPermission;
        case 'rollenverwaltung':
          return authStore.hasRollenverwaltungPermission;
        case 'schulverwaltung':
          return authStore.hasSchulverwaltungPermission;
        case 'schultraegerverwaltung':
          return authStore.hasSchulverwaltungPermission;
        default:
          return false;
      }
    });

    if (hasAllPermissions) {
      return true;
    }
    return { path: 'not-found' };
  }

  return true;
});

export default router;
