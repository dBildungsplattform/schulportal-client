<script setup lang="ts">
import { usePersonStore } from '@/stores/PersonStore'

const personStore = usePersonStore()
personStore.getAllPersons()
</script>

<template>
  <div class="admin">
    <h2>{{ $t('admin.user.management') }}</h2>
    <div v-for="person in personStore.allPersons" :key="person.person.id">{{ person.person.name }}</div>
  </div>
</template>

<style></style>
