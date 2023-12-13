<script setup lang="ts">
  import { onMounted, type Ref, ref } from 'vue'
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
  import { usePersonStore, type Personendatensatz, type PersonStore } from '@/stores/PersonStore'
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const currentPersonId: string = route.params['id']
  const personStore: PersonStore = usePersonStore()
  const currentPerson: Ref<Personendatensatz> = ref({})

  const password: Ref<string> = ref('')
  const errorCode: Ref<string> = ref('')

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
      :header="$t('admin.user.edit')"
      padding="22px 100px 22px 50px"
    >
      <div class="personal-info">
        <h3 class="text-h5">{{ $t('admin.user.personalInfo') }}</h3>
        <div v-if="currentPerson.person">
          {{ $t('user.firstName') }}
          {{ currentPerson.person.name.vorname }}
          {{ $t('user.lastName') }}
          {{ currentPerson.person.name.familienname }}
        </div>
        <div v-else>
          <v-progress-circular indeterminate></v-progress-circular>
        </div>
      </div>
      <v-divider
        class="border-opacity-100 rounded my-6"
        color="#E5EAEF"
        thickness="6"
      ></v-divider>
      <div class="password-reset">
        <h3 class="text-h5">{{ $t('user.password') }}</h3>
        <PasswordReset
          :errorCode="errorCode"
          :person="currentPerson"
          @onClearPassword="password = ''"
          @onResetPassword="resetPassword(currentPersonId)"
          :password="password"
        >
        </PasswordReset>
      </div>
    </LayoutCard>
  </div>
</template>

<style></style>
