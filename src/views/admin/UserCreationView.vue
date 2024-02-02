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
    :header="$t('admin.user.addNew')"
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
          <!-- Rollenzuordnung -->
          <v-row>
            <h3 class="headline-3">1. {{ $t('admin.role.selectRole') }}</h3>
          </v-row>
          <v-row class="align-center">
            <v-col class="pb-5 text-right" cols="4">
              <label>{{ $t('admin.role.selectRole') }}</label>
            </v-col>
            <v-col class="pb-0" cols="8">
              <v-select
                :no-data-text="$t('admin.role.noRolesFound')"
                variant="outlined"
              ></v-select>
            </v-col>
          </v-row>

          <!-- KoPers-Nr -->
          <v-row class="align-center">
            <v-col cols="4"></v-col>
            <v-col class="pa-0" cols="8">
              <v-checkbox hide-details :label="$t('admin.koPers.noKoPersNumber')"></v-checkbox>
            </v-col>
            <v-col class="pt-0 pb-8 text-right" cols="4">
              <label>{{ $t('admin.koPers.koPersNumber') }}</label>
            </v-col>
            <v-col class="pt-0" cols="8">
              <v-text-field variant="outlined"></v-text-field>
            </v-col>
          </v-row>

          <!-- Persönliche Informationen -->
          <v-row>
            <h3 class="headline-3">2. {{ $t('admin.user.personalInfo') }}</h3>
          </v-row>
          <v-row class="align-center">
            <v-col class="pb-5 text-right" cols="4">
              <label>{{ $t('user.firstName') }}</label>
            </v-col>
            <v-col class="pb-0" cols="8">
              <v-text-field
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row class="align-center">
            <v-col class="pb-8 pt-0 text-right" cols="4">
              <label>{{ $t('user.lastName') }}</label>
            </v-col>
            <v-col class="pt-0" cols="8">
              <v-text-field
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Schulzuordnung -->
          <v-row>
            <h3 class="headline-3">3. {{ $t('admin.school.assign') }}</h3>
          </v-row>
          <v-row class="align-center">
            <v-col cols="4" class="pb-8 text-right">
              <label>{{ $t('admin.school.assign') }}</label>
            </v-col>
            <v-col cols="8">
              <v-select
                :no-data-text="$t('admin.school.noSchoolsFound')"
                variant="outlined"
              ></v-select>
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
        <v-spacer></v-spacer>
        <v-col cols="4">
          <v-btn class="secondary" @click.stop="navigateToUserTable">{{ $t('admin.user.discard') }}</v-btn>
        </v-col>
        <v-col cols="4">
          <v-btn class="primary" type="submit">{{ $t('admin.user.create') }}</v-btn>
        </v-col>
      </v-row>
    </v-form>
  </LayoutCard>
</template>

<style>

</style>