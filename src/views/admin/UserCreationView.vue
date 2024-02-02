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
    <v-form @submit.prevent>
      <v-container class="px-16">
        <v-row class="py-6 align-center">
          <v-icon class="mr-2" icon="mdi-information-outline" size="small"></v-icon>
          <label class="subtitle-2">{{ $t('mandatoryFields') }}</label>
        </v-row>
        <v-container class="px-16">
          <v-row>
            <h3 class="headline-3">1. {{ $t('admin.role.selectRole') }}</h3>
          </v-row>
          <v-row class="align-center">
            <v-col class="pb-8 text-right">
              <label>{{ $t('admin.role.selectRole') }}</label>
            </v-col>
            <v-col>
              <v-select
                :label="$t('admin.role.selectRole')"
                :no-data-text="$t('admin.role.noRolesFound')"
                variant="outlined"
              ></v-select>
            </v-col>
            <v-col>
              
            </v-col>
          </v-row>
        </v-container>
      </v-container>
      <v-divider
        class="border-opacity-100 rounded"
        color="#E5EAEF"
        thickness="5px"
      ></v-divider>
      <v-row class="py-3 pr-5">
        <v-col cols="3"></v-col>
        <v-col cols="3"></v-col>
        <v-col cols="3">
          <v-btn class="secondary" @click.stop="navigateToUserTable">Cancel</v-btn>
        </v-col>
        <v-col cols="3">
          <v-btn class="primary" type="submit">Submit</v-btn>
        </v-col>
      </v-row>
    </v-form>
  </LayoutCard>
</template>

<style>

</style>