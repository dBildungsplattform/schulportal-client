<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { type Router, useRouter } from 'vue-router'

  const router: Router = useRouter()

  function navigateToUserTable(): void {
    router.push({ name: 'user-management' })
  }

</script>

<template>
  <LayoutCard
      :closable="true"
      :header="$t('admin.user.create')"
      @onCloseClicked="navigateToUserTable"
      :padded="true"
      :showCloseText="true"
  >
  </LayoutCard>
</template>

<style>

</style>