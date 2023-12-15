<script setup lang="ts">
  import { onMounted, type Ref, ref } from 'vue'
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
  import { usePersonStore, type Personendatensatz, type PersonStore } from '@/stores/PersonStore'
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const router: Router = useRouter()
  const currentPersonId: string = route.params['id']
  const personStore: PersonStore = usePersonStore()
  const currentPerson: Ref<Personendatensatz | null> = ref(null)

  const password: Ref<string> = ref('')
  const errorCode: Ref<string> = ref('')

  function navigateToUserTable(): void {
    router.push({ name: 'user-management' })
  }

  function resetPassword(personId: string): void {
    personStore
      .resetPassword(personId)
      .then((newPassword?: string) => {
        password.value = newPassword || ''
      })
      .catch((error: string) => {
        errorCode.value = error
      })
  }

  onMounted(async () => {
    currentPerson.value = await personStore.getPersonById(currentPersonId)
  })
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <LayoutCard
      :closable="true"
      :header="$t('admin.user.edit')"
      @onCloseClicked="navigateToUserTable"
      :padded="true"
      :showCloseText="true"
    >
      <v-container class="personal-info">
        <h3 class="medium-headline">{{ $t('admin.user.personalInfo') }}</h3>
        <div v-if="currentPerson?.person">
          <v-row>
            <v-col
              class="text-right"
              cols="3"
            >
              <span class="small-headline"> {{ $t('user.firstName') }}: </span>
            </v-col>
            <v-col cols="9">
              {{ currentPerson.person.name.vorname }}
            </v-col>
          </v-row>
          <v-row>
            <v-col
              class="text-right"
              cols="3"
            >
              <span class="small-headline"> {{ $t('user.lastName') }}: </span>
            </v-col>
            <v-col cols="9">
              {{ currentPerson.person.name.familienname }}
            </v-col>
          </v-row>
        </div>
        <div v-else>
          <v-progress-circular indeterminate></v-progress-circular>
        </div>
      </v-container>
      <v-divider
        class="border-opacity-100 rounded my-6"
        color="#E5EAEF"
        thickness="6"
      ></v-divider>
      <v-container class="password-reset">
        <h3 class="medium-headline">{{ $t('user.password') }}</h3>
        <v-row justify="end">
          <div v-if="currentPerson">
            <PasswordReset
              :errorCode="errorCode"
              :person="currentPerson"
              @onClearPassword="password = ''"
              @onResetPassword="resetPassword(currentPersonId)"
              :password="password"
            >
            </PasswordReset>
          </div>
          <div v-else>
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-row>
      </v-container>
    </LayoutCard>
  </div>
</template>

<style></style>
