<script setup lang="ts">
  import { onMounted, type Ref, ref } from 'vue'
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
  import { usePersonStore, type Personendatensatz, type PersonStore } from '@/stores/PersonStore'
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const router: Router = useRouter()
  const currentPersonId: string = route.params['id'] as string
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
    <h1 class="text-center headline-1">{{ $t('admin.headline') }}</h1>
    <LayoutCard
      :closable="true"
      :header="$t('admin.user.edit')"
      @onCloseClicked="navigateToUserTable"
      :padded="true"
      :showCloseText="true"
    >
      <v-container class="personal-info">
        <v-row class="ml-md-16">
          <v-col>
            <h3 class="subtitle-1">{{ $t('admin.user.personalInfo') }}</h3></v-col
          >
        </v-row>
        <div v-if="currentPerson?.person">
          <v-row>
            <!-- Spacer column -->
            <v-col cols="2"></v-col>
            <v-col
              class="text-right"
              cols="auto"
            >
              <span class="subtitle-2"> {{ $t('user.firstName') }}: </span>
            </v-col>
            <v-col cols="auto">
              {{ currentPerson.person.name.vorname }}
            </v-col>
          </v-row>
          <v-row>
            <!-- Spacer column -->
            <v-col cols="2"></v-col>
            <v-col
              class="text-right"
              cols="auto"
            >
              <span class="subtitle-2"> {{ $t('user.lastName') }}: </span>
            </v-col>
            <v-col cols="auto">
              {{ currentPerson.person.name.familienname }}
            </v-col>
          </v-row>
        </div>
        <div v-else>
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
            <h3 class="subtitle-1">{{ $t('user.password') }}</h3>
          </v-col></v-row
        >
        <v-row
          justify="end"
          class="mr-lg-10"
        >
          <v-col
            v-col
            cols="12"
            md="auto"
            v-if="currentPerson"
          >
            <div>
              <PasswordReset
                :errorCode="errorCode"
                :person="currentPerson"
                @onClearPassword="password = ''"
                @onResetPassword="resetPassword(currentPersonId)"
                :password="password"
              >
              </PasswordReset>
            </div>
          </v-col>
          <v-col v-else> <v-progress-circular indeterminate></v-progress-circular></v-col>
        </v-row>
      </v-container>
    </LayoutCard>
  </div>
</template>

<style></style>
