import { createRouter, createWebHistory, type RouteLocationNormalized, type Router } from 'vue-router';
import { StepUpLevel, useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import routes from './routes';
import { useMasterDataStore, type MasterDataStore } from '@/stores/MasterDataStore';
import { useConfigStore, type ConfigStore } from '@/stores/ConfigStore';
import type { FeatureFlagResponse } from '@/api-client/generated/api';

type Permission =
  | 'klassenverwaltung'
  | 'personenanlegen'
  | 'personenimport'
  | 'personenverwaltung'
  | 'rollenverwaltung'
  | 'angebotsverwaltung'
  | 'eingeschränktangebotsverwaltung'
  | 'schulspezifischeangebotsverwaltung'
  | 'schulverwaltung'
  | 'schultraegerverwaltung'
  | 'portalverwaltung'
  | 'hinweisebearbeiten'
  | 'landesbedienstetesuchenundhinzufügen'
  | 'limitedpersonenanlegen';

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
  const masterDataStore: MasterDataStore = useMasterDataStore();
  if (!authStore.isAuthenticated && !masterDataStore.isInitialized()) {
    await Promise.all([authStore.initializeAuthStatus(), masterDataStore.initialise()]);
  }
  if (!masterDataStore.isInitialized()) {
    await masterDataStore.initialise();
  }
  if (!authStore.isAuthenticated) {
    await authStore.initializeAuthStatus();
  }
  if (to.path !== '/profile' && to.path !== '/no-second-factor') {
    sessionStorage.setItem('previousUrl', to.path);
  }

  if (to.path === '/no-second-factor') {
    const personId: string | null | undefined = authStore.currentUser?.personId;
    if (!personId) {
      return false;
    }
    const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
    await twoFactorAuthentificationStore.get2FAState(personId);
    if (twoFactorAuthentificationStore.hasToken) {
      handleGoToPreviousPage();
      return false;
    }
  }

  // Redirect authenticated users trying to access the login page to the start page
  if (to.path === '/' && authStore.isAuthenticated) {
    return { path: '/start' };
  }

  if (to.meta['requiresAuth'] && !authStore.isAuthenticated) {
    window.location.href = `/api/auth/login?redirectUrl=${to.fullPath}`;
    return false;
  }

  // Redirect if orga query is missing on routes that require it
  if (to.meta['requiresOrga'] && (!to.query['orga'] || typeof to.query['orga'] !== 'string')) {
    return to.meta['missingOrgaRedirect'] ?? { name: 'angebot-management-schulspezifisch' };
  }

  if (to.meta['requiredStepUpLevel'] === StepUpLevel.GOLD && authStore.acr !== StepUpLevel.GOLD) {
    const personId: string | null | undefined = authStore.currentUser?.personId;
    if (!personId) {
      return false;
    }
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
      ? (to.meta['requiresPermission'] as Permission[])
      : [to.meta['requiresPermission'] as Permission];

    const checkPermission = (permission: Permission): boolean => {
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
        case 'angebotsverwaltung':
          return authStore.hasAngeboteVerwaltenPermission;
        case 'eingeschränktangebotsverwaltung':
          return authStore.hasEingeschränktAngeboteVerwaltenPermission;
        case 'schulspezifischeangebotsverwaltung':
          return authStore.hasRollenerweiternPermission;
        case 'schulverwaltung':
          return authStore.hasSchulverwaltungPermission;
        case 'schultraegerverwaltung':
          return authStore.hasSchultraegerverwaltungPermission;
        case 'portalverwaltung':
          return authStore.hasPortalVerwaltungPermission;
        case 'hinweisebearbeiten':
          return authStore.hasHinweiseBearbeitenPermission;
        case 'landesbedienstetesuchenundhinzufügen':
          return authStore.hasLandesbediensteteSuchenUndHinzufügenPermission;
        case 'limitedpersonenanlegen':
          return authStore.hasEingeschränktNeueBenutzerErstellenPermission;
        default:
          return false;
      }
    };

    // 'any' = user needs at least one of the permissions (OR). Necessary for the create-angebot route, where admins with either 'angebotsverwaltung' or
    // 'eingeschränktangebotsverwaltung' should have access
    // default = user needs all of the permissions (AND)
    const hasPermission: boolean =
      to.meta['permissionMode'] === 'any'
        ? requiredPermissions.some(checkPermission)
        : requiredPermissions.every(checkPermission);

    if (hasPermission) {
      return true;
    }
    if (to.meta['requiresFeatureFlag']) {
      const configStore: ConfigStore = useConfigStore();
      const flag: keyof FeatureFlagResponse = to.meta['requiresFeatureFlag'] as keyof FeatureFlagResponse;
      if (!configStore.configData?.[flag]) {
        return { path: 'not-found' };
      }
    }
    return { path: 'not-found' };
  }

  return true;
});

export default router;
