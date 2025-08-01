<script setup lang="ts">
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';
  import { useDisplay } from 'vuetify';

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const authStore: AuthStore = useAuthStore();

  const menuDrawer: Ref<boolean> = ref(true);
  const { mobile }: { mobile: ComputedRef<boolean> } = useDisplay();

  function closeMenuOnMobile(): void {
    if (mobile.value) {
      menuDrawer.value = false;
    }
  }

  function handleMenuItemClick(nextRoute: string): void {
    if (route.path === nextRoute) {
      // If current route is the same as the route we're navigating to,
      // force a refresh by pushing the same route again
      router.push(nextRoute).then(() => {
        router.go(0);
      });
    } else {
      router.push(nextRoute);
    }
    closeMenuOnMobile();
  }

  onMounted(async () => {
    menuDrawer.value = !mobile.value;
  });
</script>

<template>
  <v-btn
    :aria-label="$t('nav.openMobileMenu')"
    class="hidden-lg-and-up"
    @click.stop="menuDrawer = !menuDrawer"
    data-testid="open-mobile-menu-button"
    density="compact"
    icon
    variant="text"
  >
    <v-icon
      icon="mdi-menu"
      size="x-large"
    ></v-icon>
  </v-btn>
  <v-btn
    :aria-label="$t('nav.backToStart')"
    class="hidden-lg-and-up"
    data-testid="mobile-back-to-start-link"
    density="compact"
    icon
    to="/start"
    variant="text"
  >
    <v-icon
      class="hidden lg-and-up"
      icon="mdi-home"
      size="x-large"
    ></v-icon>
  </v-btn>

  <v-navigation-drawer
    class="menu-bar"
    floating
    order="1"
    v-model="menuDrawer"
    width="320"
  >
    <v-btn
      v-if="menuDrawer"
      :aria-label="$t('nav.closeMobileMenu')"
      class="hidden-lg-and-up primary menu-bar-close-button"
      @click.stop="menuDrawer = !menuDrawer"
      data-testid="close-mobile-menu-button"
      density="compact"
      icon
      position="absolute"
      rounded="sm e-lg"
      variant="text"
    >
      <v-icon
        icon="mdi-menu-open"
        size="x-large"
      ></v-icon>
    </v-btn>

    <!-- Title -->
    <v-list-item
      class="menu-bar-title"
      data-testid="menu-bar-title"
      :title="$t('nav.navigation')"
    ></v-list-item>
    <v-divider></v-divider>

    <!-- Back to start page -->
    <v-list-item
      class="menu-bar-back caption"
      data-testid="back-to-start-link"
      :title="$t('nav.backToStart')"
      to="/start"
    >
      <template #prepend>
        <v-icon
          icon="mdi-home"
          size="x-large"
        ></v-icon>
      </template>
    </v-list-item>
    <v-divider></v-divider>

    <!-- Benutzerverwaltung -->
    <div v-if="authStore.hasPersonenverwaltungPermission">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="person-management-title"
        :title="$t('admin.person.management')"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="handleMenuItemClick('/admin/personen')"
        data-testid="person-management-menu-item"
        prepend-icon="mdi-format-list-bulleted"
        :title="$t('admin.person.showAll')"
        to="/admin/personen"
      ></v-list-item>
      <v-list-item
        v-if="authStore.hasPersonenAnlegenPermission"
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="person-creation-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.person.createNew')"
        to="/admin/personen/new"
      ></v-list-item>
      <v-list-item
        v-if="authStore.hasImportPermission"
        class="menu-bar-sub-item caption"
        @click="handleMenuItemClick('/admin/personen/import')"
        data-testid="person-import-menu-item"
        prepend-icon="mdi-file-upload-outline"
        :title="$t('admin.person.import')"
        to="/admin/personen/import"
      ></v-list-item>
    </div>

    <!-- Person Hinzufügen -->
    <div
      v-if="
        authStore.hasLandesbediensteteSuchenUndHinzufügenPermission ||
        authStore.hasEingeschränktNeueBenutzerErstellenPermission
      "
    >
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="add-person-title"
        :title="$t('admin.person.stateEmployeeSearch.addPerson')"
      ></v-list-item>
      <v-list-item
        v-if="authStore.hasLandesbediensteteSuchenUndHinzufügenPermission"
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="search-person-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.person.stateEmployeeSearch.searchAndAdd')"
        to="/admin/limited/personen/search"
      ></v-list-item>
      <v-list-item
        v-if="authStore.hasEingeschränktNeueBenutzerErstellenPermission"
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="add-person-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.person.stateEmployeeSearch.anotherPerson')"
        to="/admin/limited/personen/new"
      ></v-list-item>
    </div>

    <!-- Klassenverwaltung -->
    <div v-if="authStore.hasKlassenverwaltungPermission">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="klasse-management-title"
        :title="$t('admin.klasse.management')"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="handleMenuItemClick('/admin/klassen')"
        data-testid="klassen-management-menu-item"
        prepend-icon="mdi-format-list-bulleted"
        :title="$t('admin.klasse.showAll')"
        to="/admin/klassen"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="klasse-creation-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.klasse.createNew')"
        to="/admin/klassen/new"
      ></v-list-item>
    </div>

    <!-- Rollenverwaltung -->
    <div v-if="authStore.hasRollenverwaltungPermission">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="rolle-management-title"
        :title="$t('admin.rolle.management')"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="handleMenuItemClick('/admin/rollen')"
        data-testid="rolle-management-menu-item"
        prepend-icon="mdi-format-list-bulleted"
        :title="$t('admin.rolle.showAll')"
        to="/admin/rollen"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="rolle-creation-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.rolle.createNew')"
        to="/admin/rollen/new"
      ></v-list-item>
    </div>

    <!-- Schulverwaltung -->
    <div v-if="authStore.hasSchulverwaltungPermission">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="schule-management-title"
        :title="$t('admin.schule.management')"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="handleMenuItemClick('/admin/schulen')"
        data-testid="schule-management-menu-item"
        prepend-icon="mdi-format-list-bulleted"
        :title="$t('admin.schule.showAll')"
        to="/admin/schulen"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="schule-creation-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.schule.createNew')"
        to="/admin/schulen/new"
      ></v-list-item>
    </div>
    <!-- Schulträgerverwaltung -->
    <div v-if="authStore.hasSchultraegerverwaltungPermission">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="schultraeger-management-title"
        :title="$t('admin.schultraeger.management')"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="handleMenuItemClick('/admin/schultraeger')"
        data-testid="schultraeger-management-menu-item"
        prepend-icon="mdi-format-list-bulleted"
        :title="$t('admin.schultraeger.showAll')"
        to="/admin/schultraeger"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="schultraeger-creation-menu-item"
        prepend-icon="mdi-plus-circle-outline"
        :title="$t('admin.schultraeger.createNew')"
        to="/admin/schultraeger/new"
      ></v-list-item>
    </div>
    <!-- Portalverwaltung -->
    <div v-if="authStore.hasPortalVerwaltungPermission && authStore.hasHinweiseBearbeitenPermission">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="portal-management-title"
        :title="$t('admin.portal.management')"
      ></v-list-item>
      <v-list-item
        v-if="authStore.hasHinweiseBearbeitenPermission"
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
        data-testid="hinweise-edit-menu-item"
        prepend-icon="mdi-pencil"
        :title="$t('admin.portal.editHinweise')"
        to="/admin/hinweise/new"
      ></v-list-item>
    </div>
  </v-navigation-drawer>
</template>

<style></style>
