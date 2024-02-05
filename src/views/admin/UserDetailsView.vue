<script setup lang="ts">
  import { onMounted, type Ref, ref } from 'vue'
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore'
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import { type Composer, useI18n } from 'vue-i18n'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const router: Router = useRouter()
  const currentPersonId: string = route.params['id'] as string
  const personStore: PersonStore = usePersonStore()
  const { t }: Composer = useI18n({ useScope: 'global' })

  const password: Ref<string> = ref('')

  function navigateToUserTable(): void {
    router.push({ name: 'user-management' })
  }

  function resetPassword(personId: string): void {
    personStore.resetPassword(personId).then((newPassword?: string) => {
      password.value = newPassword || ''
    })
  }

  const handleAlertClose = (): void => {
    personStore.errorCode = ''
  }

  onMounted(async () => {
    await personStore.getPersonById(currentPersonId)
  })
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center headline-1">{{ $t('admin.headline') }}</h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
      :header="$t('admin.user.edit')"
      @onCloseClicked="navigateToUserTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!personStore.errorCode"
        :title="t('admin.user.userDataLoadingErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.user.userDataLoadingErrorText')"
        :showButton="true"
        :buttonText="$t('admin.user.backToList')"
        buttonClass="primary"
        :buttonAction="navigateToUserTable"
        @update:modelValue="handleAlertClose"
      />

      <template v-if="!personStore.errorCode">
        <v-container class="personal-info">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">
                {{ $t('admin.user.personalInfo') }}
              </h3></v-col
            >
          </v-row>
          <div v-if="personStore.currentPerson?.person">
            <v-row>
              <!-- Spacer column -->
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.firstName') }}: </span>
              </v-col>
              <v-col cols="auto">
                {{ personStore.currentPerson.person.name.vorname }}
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.lastName') }}: </span>
              </v-col>
              <v-col cols="auto">
                {{ personStore.currentPerson.person.name.familienname }}
              </v-col>
            </v-row>
          </div>
          <div v-else-if="personStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <v-container class="password-reset">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('person.password') }}</h3>
            </v-col></v-row
          >
          <v-row
            justify="end"
            class="mr-lg-10"
          >
            <v-col
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div>
                <PasswordReset
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  @onClearPassword="password = ''"
                  @onResetPassword="resetPassword(currentPersonId)"
                  :password="password"
                >
                </PasswordReset>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading">
              <v-progress-circular indeterminate></v-progress-circular
            ></v-col>
          </v-row>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
