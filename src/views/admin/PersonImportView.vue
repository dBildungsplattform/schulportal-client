<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useRouter, type Router } from 'vue-router';
  
  const router: Router = useRouter();

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="true"
      data-testid="person-import-card"
      :header="$t('admin.person.import')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      
    </LayoutCard>
  </div>
</template>