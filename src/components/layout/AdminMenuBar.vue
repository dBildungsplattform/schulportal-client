<script setup lang="ts"></script>

<template>
  <v-navigation-drawer
    class="hidden-md-and-down menu-bar"
    floating
    order="1"
  >
    <!-- Title -->
    <v-list-item
      class="menu-bar-title"
      :title="$t('nav.navigation')"
    ></v-list-item>
    <v-divider></v-divider>

    <!-- Back to start page -->
    <v-list-item
      class="menu-bar-back caption"
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
      prepend-icon="mdi-format-list-bulleted"
      :title="$t('admin.user.showAll')"
      to="/admin/users"
    ></v-list-item>
  </v-navigation-drawer>
</template>

<style></style>
