import { createRouter, createWebHistory, type RouteLocationNormalized, type Router } from 'vue-router';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import routes, { StepUpLevel } from './routes';
const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const authStore: AuthStore = useAuthStore();
  await authStore.initializeAuthStatus();
  if (to.path != '/profile') sessionStorage.setItem('previousUrl', to.path);

  // Redirect authenticated users trying to access the login page to the start page
  if (to.path === '/' && authStore.isAuthed) {
    return { path: '/start' };
  }

  if (to.meta['requiresAuth'] && !authStore.isAuthed) {
    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}`;
    return false;
  }

  if (to.meta['requiredStepUpLevel'] === StepUpLevel.GOLD) {
    const personId: string | null | undefined = authStore.currentUser?.personId;
    if (!personId) return false;
    const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
    await twoFactorAuthentificationStore.get2FAState(personId);
    if (!twoFactorAuthentificationStore.hasToken) {
      router.push(`/no-second-factor`);
      return false;
    }
  }

  if (to.meta['requiredStepUpLevel'] === StepUpLevel.GOLD && authStore.acr !== StepUpLevel.GOLD) {
    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}&requiredStepUpLevel=${StepUpLevel.GOLD}`;
  }

  if (to.meta['requiresPermission']) {
    /* check if the user has person management permissions */
    switch (to.meta['requiresPermission']) {
      case 'personenverwaltung':
        if (authStore.hasPersonenverwaltungPermission) {
          return true;
        }
        return { path: 'not-found' };
      case 'klassenverwaltung':
        if (authStore.hasKlassenverwaltungPermission) {
          return true;
        }
        return { path: 'not-found' };
      case 'rollenverwaltung':
        if (authStore.hasRollenverwaltungPermission) {
          return true;
        }
        return { path: 'not-found' };
      case 'schulverwaltung':
        if (authStore.hasSchulverwaltungPermission) {
          return true;
        }
        return { path: 'not-found' };
      default:
        return { path: 'not-found' };
    }
  }

  return true;
});

export default router;
