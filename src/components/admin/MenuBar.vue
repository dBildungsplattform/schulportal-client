<script setup lang="ts">
  import { type Ref, ref, type ComputedRef } from 'vue'
  import { onMounted } from 'vue'
  import { useDisplay } from 'vuetify'

  const menuDrawer: Ref<boolean> = ref(true)
  const { mobile }: { mobile: ComputedRef<boolean> } = useDisplay()

  onMounted(() => {
    menuDrawer.value = !mobile.value
  })
</script>

<template>
  <v-btn
    class="hidden-lg-and-up"
    data-testid="open-mobile-menu-button"
    density="compact"
    icon
    variant="text"
  >
    <v-icon
      @click.stop="menuDrawer = !menuDrawer"
      icon="mdi-menu"
      size="x-large"
    ></v-icon>
  </v-btn>
  <v-btn
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
      class="hidden-lg-and-up primary menu-bar-close-button"
      data-testid="close-mobile-menu-button"
      density="compact"
      icon
      position="absolute"
      rounded="sm e-lg"
      variant="text"
    >
      <v-icon
        @click.stop="menuDrawer = !menuDrawer"
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

    <!-- User menu -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      :title="$t('admin.user.management')"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      data-testid="user-management-menu-item"
      prepend-icon="mdi-format-list-bulleted"
      :title="$t('admin.user.showAll')"
      to="/admin/users"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      data-testid="user-creation-menu-item"
      prepend-icon="mdi-plus-circle-outline"
      :title="$t('admin.user.addNew')"
    ></v-list-item>

    <!-- Klassenverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      :title="$t('admin.class.management')"
    ></v-list-item>

    <!-- Rollenverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      :title="$t('admin.rolle.management')"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      data-testid="rolle-management-menu-item"
      prepend-icon="mdi-format-list-bulleted"
      :title="$t('admin.rolle.showAll')"
    ></v-list-item>
    <v-list-item
      class="menu-bar-sub-item caption"
      data-testid="rolle-creation-menu-item"
      prepend-icon="mdi-plus-circle-outline"
      :title="$t('admin.rolle.createNew')"
      to="/admin/rolle/new"
    ></v-list-item>
    <!-- Schulverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      :title="$t('admin.school.management')"
    ></v-list-item>

    <!-- Schulträgerverwaltung -->
    <v-list-item
      class="menu-bar-main-item headline-2"
      :title="$t('admin.schoolBoard.management')"
    ></v-list-item>
  </v-navigation-drawer>
</template>

<style></style>
