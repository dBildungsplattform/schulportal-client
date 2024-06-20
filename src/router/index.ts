import { createRouter, createWebHistory, type RouteLocationNormalized, type Router } from 'vue-router';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import routes from './routes';

const router: Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  const authStore: AuthStore = useAuthStore();

  await authStore.initializeAuthStatus();

  // Redirect authenticated users trying to access the login page to the start page
  if (to.path === '/' && authStore.isAuthed) {
    return { path: '/start' };
  }

  if (to.meta['requiresAuth'] && !authStore.isAuthed) {
    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}`;
    return false;
  }

  if (to.meta['requiresPermission']) {
    /* check if the user has person management permissions */
    switch (to.meta['requiresPermission']) {
      case 'personenverwaltung':
        if (authStore.hasPersonenverwaltungPermission) {
          return true;
        }
        return false;
      case 'klassenverwaltung':
        if (authStore.hasKlassenverwaltungPermission) {
          return true;
        }
        return false;
      case 'rollenverwaltung':
        if (authStore.hasRollenverwaltungPermission) {
          return true;
        }
        return false;
      case 'schulverwaltung':
        if (authStore.hasSchulverwaltungPermission) {
          return true;
        }
        return false;
      default:
        return false;
    }
  }

  return true;
});

export default router;
