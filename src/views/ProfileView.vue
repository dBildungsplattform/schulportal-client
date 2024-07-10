<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { ref, type Ref, onBeforeMount } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: { t: Function } = useI18n();
  type LabelValue = {
    label: string;
    value: string;
  };

  import { usePersonStore, type Person, type PersonStore } from '@/stores/PersonStore';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';

  type SchoolData = {
    title: string;
    info?: string | null;
    schoolAdmins?: string[];
    labelAndValues: LabelValue[];
  };

  const personStore: PersonStore = usePersonStore();
  const authStore: AuthStore = useAuthStore();
  const personalData: Ref = ref<LabelValue[]>([]);
  const schoolDatas: Ref = ref<SchoolData[]>([]);
  const personenKontextStore: PersonenkontextStore = usePersonenkontextStore();
  const redirectToUpdatePassword = (): void => {
    const keycloakUrl: string = 'http://localhost:8080/realms/SPSH/protocol/openid-connect/auth'; // Todo: Replace with dynamic url value
    const clientId: string = 'spsh';
    const redirectUri = `${window.location.origin}${route.fullPath}`;
    const responseType = 'code';
    const scope = 'openid';
    const kcAction = 'UPDATE_PASSWORD';
    const url = `${keycloakUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&kc_action=${kcAction}`;
    window.location.href = url;
  };

  function handleGoToPreviousPage(): void {
    window.history.back();
  }

  onBeforeMount(async () => {
    await authStore.initializeAuthStatus();
    const userId: string | null | undefined = authStore.currentUser?.personId;

    if (!userId) {
      return;
    }

    await Promise.all([personStore.getPersonById(userId), personenKontextStore.getPersonenuebersichtById(userId)]);
    const currentPerson: Person | null | undefined = personStore.currentPerson?.person as Person | undefined;
    const uebersicht = personenKontextStore.personenuebersicht;

    if (!currentPerson) return;
    personalData.value = [
      {
        label: 'Vor- und Nachname',
        value: currentPerson.name.vorname + ' ' + currentPerson.name.familienname,
      },
      { label: 'Benutzername', value: currentPerson.referrer ?? '' },
      { label: 'Benutzerkennung', value: '[todo]' },
    ];

    if (currentPerson.email) {
      personalData.value.push({ label: 'E-Mail-Adresse', value: currentPerson.email });
    }

    if (currentPerson.personalnummer) {
      personalData.value.push({ label: 'Personalnummer', value: currentPerson.personalnummer });
    }

    for (const zuordnung of uebersicht?.zuordnungen ?? []) {
      const tempSchoolData: SchoolData = {
        title: t('profile.school'),
        info: t('profile.yourSchoolAdminsAre'),
        schoolAdmins: ['[todo]'],
        labelAndValues: [
          { label: t('profile.school'), value: zuordnung.sskName },
          { label: t('profile.schoolNumber'), value: zuordnung.sskDstNr },
          { label: t('admin.rolle.rolle'), value: zuordnung.rolle },
        ],
      };
      console.log('tempSchoolData', tempSchoolData);
      schoolDatas.value.push(tempSchoolData);
    }
  });
</script>

<template>
  <div class="profile">
    <a @click="handleGoToPreviousPage()"
      ><v-icon
        class="mr-2"
        icon="mdi-arrow-left-thin"
      />
      {{ $t('nav.backToPreviousPage') }}</a
    >
    <h1
      class="text-center headline"
      data-testid="profile-headline"
    >
      {{ $t('nav.profile') }}
    </h1>
    <v-row>
      <v-col
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="$t('profile.personalData')">
          <v-row class="ma-3 padding">
            <v-col cols="12">
              <p>
                <v-icon
                  class="mr-2"
                  icon="mdi-alert-circle-outline"
                ></v-icon>
                {{ $t('profile.infoAboutChangeabilityFromPersonalData') }}
              </p>
              <v-simple-table>
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in personalData"
                      :key="item.label"
                    >
                      <td class="right padding">
                        <strong>{{ item.label }}:</strong>
                      </td>
                      <td>{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col>
          </v-row>
        </LayoutCard>
      </v-col>
      <v-col
        v-for="schoolData in schoolDatas"
        :key="schoolData.title"
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="schoolData.title">
          <v-row class="ma-3 padding">
            <v-col cols="12">
              <p>
                <v-icon
                  class="mr-2"
                  icon="mdi-alert-circle-outline"
                ></v-icon>
                {{ schoolData.info + ' ' + schoolData.schoolAdmins?.join(', ') }}
              </p>
              <v-simple-table>
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in schoolData.labelAndValues"
                      :key="item.label"
                    >
                      <td class="right padding">
                        <strong>{{ item.label }}:</strong>
                      </td>
                      <td>{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col>
          </v-row>
        </LayoutCard>
      </v-col>
      <v-col
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="$t('login.password')">
          <v-row class="ma-3 d-flex align-content-center justify-center ga-4">
            <v-icon
              size="x-large"
              class="full-width"
              icon="mdi-key-alert-outline"
            ></v-icon>
            <p>Ihr Passwort wurde zuletzt am [todo] geändert.</p>
            <div>
              <v-btn
                color="primary"
                @click="redirectToUpdatePassword"
              >
                Passwort ändern
              </v-btn>
            </div>
          </v-row>
        </LayoutCard>
      </v-col>

      <v-col
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="$t('profile.twoFactorAuth')">
          <v-row class="ma-3 d-flex align-content-center justify-center ga-4">
            <v-icon
              size="x-large"
              class="full-width"
              icon="mdi-shield-account-outline"
            ></v-icon>
            <p>Es wurde noch kein zweiter Faktor fuer Sie eingerichtet.</p>
            <div>
              <v-btn
                color="primary"
                disabled
              >
                2-FA einrichten
              </v-btn>
            </div>
          </v-row>
        </LayoutCard>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
  .profile {
    margin: 20px;
  }

  .headline {
    margin-bottom: 20px;
  }

  .right {
    text-align: right;
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 5px;
  }

  .padding {
    padding: 8px;
  }

  .full-width {
    width: 100%;
  }

  .gap-5 {
  }
</style>
