<script setup lang="ts">

</script>

<template>
  <v-navigation-drawer
    class="hidden-md-and-down menu-bar"
    floating
    order="1"
  >
    <v-list-item 
      class="menu-bar-title"
      :title="$t('nav.navigation')"
    ></v-list-item>
    <v-divider></v-divider>
    <v-list-item
      class="menu-bar-back"
      link
      prepend-icon="mdi-home"
      :title="$t('nav.backToStart')">
    </v-list-item>
    <v-divider></v-divider>
    <v-list-item link title="List Item 2"></v-list-item>
    <v-list-item link title="List Item 3"></v-list-item>
  </v-navigation-drawer>
</template>

<style>

</style>