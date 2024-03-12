<script setup lang="ts">
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import {
    HatSystemrechtBodyParamsSystemRechtEnum,
    usePersonenkontextStore,
    type PersonenkontextStore,
  } from '@/stores/PersonenKontextStore';
  import { type Ref, ref, type ComputedRef } from 'vue';
  import { onMounted } from 'vue';
  import { useDisplay } from 'vuetify';

  const menuDrawer: Ref<boolean> = ref(true);
  const { mobile }: { mobile: ComputedRef<boolean> } = useDisplay();

  const auth: AuthStore = useAuthStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const hasRollenverwaltungRecht: Ref<boolean> = ref(false);

  function closeMenuOnMobile(): void {
    if (mobile.value) {
      menuDrawer.value = false;
    }
  }

  // Retrieves logged in user info on mounted and check using the user's sub if he has the right "ROLLEN_VERWALTEN". If not (error from the endpoint) then
  // hide the menu from the menubar.
  onMounted(async () => {
    await auth.getLoggedInUserInfo();
    try {
      if (auth.currentUser) {
        await personenkontextStore.hasSystemrecht(
          auth.currentUser.sub,
          HatSystemrechtBodyParamsSystemRechtEnum.RollenVerwalten,
        );
        hasRollenverwaltungRecht.value = true;
      }
    } catch (error: unknown) {
      hasRollenverwaltungRecht.value = false;
    } finally {
      menuDrawer.value = !mobile.value;
    }
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

    <!-- Person menu -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      data-testid="person-management-title"
      :title="$t('admin.person.management')"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      @click="closeMenuOnMobile"
      data-testid="person-management-menu-item"
      prepend-icon="mdi-format-list-bulleted"
      :title="$t('admin.person.showAll')"
      to="/admin/personen"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      data-testid="person-creation-menu-item"
      prepend-icon="mdi-plus-circle-outline"
      :title="$t('admin.person.createNew')"
      to="/admin/personen/new"
    ></v-list-item>

    <!-- Klassenverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      data-testid="klasse-management-title"
      :title="$t('admin.class.management')"
    ></v-list-item>

    <!-- Rollenverwaltung -->
    <div v-if="hasRollenverwaltungRecht">
      <v-list-item
        class="menu-bar-main-item headline-2"
        data-testid="rolle-management-title"
        :title="$t('admin.rolle.management')"
      ></v-list-item>
      <v-list-item
        class="menu-bar-sub-item caption"
        @click="closeMenuOnMobile"
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
        to="/admin/rolle/new"
      ></v-list-item>
    </div>
    <!-- Schulverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      data-testid="schule-management-title"
      :title="$t('admin.schule.management')"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      @click="closeMenuOnMobile"
      data-testid="schule-management-menu-item"
      prepend-icon="mdi-format-list-bulleted"
      :title="$t('admin.schule.showAll')"
      to="/admin/schulen"
    ></v-list-item>

    <!-- Schulträgerverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      data-testid="schultraeger-management-title"
      :title="$t('admin.schultraeger.management')"
    ></v-list-item>
  </v-navigation-drawer>
</template>

<style></style>
