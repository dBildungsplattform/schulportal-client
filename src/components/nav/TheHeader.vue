<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>

<template>
  <v-app-bar :elevation="2">
    <v-spacer></v-spacer>
    <RouterLink to="/">{{ $t("nav.home") }}</RouterLink>
    <v-spacer></v-spacer>
    <RouterLink to="/about">{{ $t("nav.dashboard") }}</RouterLink>
    <v-spacer></v-spacer>
    <RouterLink to="/login">{{ $t("nav.login") }}</RouterLink>
    <v-spacer></v-spacer>
  </v-app-bar>
</template>