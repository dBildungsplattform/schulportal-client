<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { ref, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';

  const { t }: { t: Function } = useI18n();
  type LabelValue = {
    label: string;
    value: string;
  };

import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useAuthStore } from '@/stores/AuthStore';

  const personStore: PersonStore = usePersonStore();
  const authStore = useAuthStore();
  const personalData = ref<LabelValue[]>([]);
const schoolData = ref<LabelValue[]>([]);
  const personenKontextStore: PersonenkontextStore = usePersonenkontextStore();

  onMounted(async () => {
    await authStore.initializeAuthStatus();
    const userId: string | null | undefined = authStore.currentUser?.personId;

    if (!userId) {
      return;
    }

    await personStore.getPersonById(userId);
    await personenKontextStore.getPersonenuebersichtById(userId);
    console.log(personenKontextStore.personenuebersicht);
    if (!personStore.currentPerson) return;
    personalData.value = [
      {
        label: 'Vor- und Nachname',
        value: personStore.currentPerson.person.name.vorname + ' ' + personStore.currentPerson.person.name.familienname,
      },
      { label: 'Benutzername', value: 'username dummy' },
      { label: 'Benutzerkennung', value: 'kennung dummy' },
      { label: 'E-Mail-Adresse', value: 'email@dummy.okay' },
      { label: 'KoPers-Nr.', value: personStore.currentPerson.person.personalnummer ?? '' },
    ];
    schoolData.value = [
      { label: t('profile.school'), value: 'Humbold Realschule' },
      { label: t('profile.schoolNumber'), value: '746787565' },
      { label: t('admin.rolle.rolle'), value: 'Lehrkraft' },
    ];
  });
</script>

<template>
  <div class="profile">
    <h1
      class="text-center headline"
      data-testid="profile-headline"
    >
      {{ $t('nav.profile') }}
    </h1>
    <div class="padding">
      <v-row>
        <v-col
          cols="12"
          sm="12"
          md="6"
        >
          <div class="padding">
            <LayoutCard :header="$t('profile.personalData')">
              <v-row
                align="center"
                class="ma-3"
              >
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
          </div>
        </v-col>
        <v-col
          cols="12"
          sm="12"
          md="6"
        >
          <div class="padding">
            <LayoutCard :header="$t('profile.school')">
              <v-row
                align="center"
                class="ma-3"
              >
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
                          v-for="item in schoolData"
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
          </div>
        </v-col>
      </v-row>
    </div>
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

  .padding {
    padding: 8px;
  }
</style>
