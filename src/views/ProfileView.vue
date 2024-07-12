<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { ref, type Ref, onBeforeMount } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: { t: Function } = useI18n();
  type LabelValue = {
    label: string;
    labelAbbr?: string;
    value: string;
  };

  import { usePersonStore, type Person, type PersonStore } from '@/stores/PersonStore';
  import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from '@/stores/PersonenkontextStore';
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
    const redirectUri: string = `${window.location.origin}${route.fullPath}`;
    const responseType: string = 'code';
    const scope: string = 'openid';
    const kcAction: string = 'UPDATE_PASSWORD';
    const url: string = `${keycloakUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&kc_action=${kcAction}`;
    window.location.href = url;
  };

  function handleGoToPreviousPage(): void {
    window.history.back();
  }

  function groupZuordnungenBySskId(zuordnungen: Zuordnung[]): Map<string, Zuordnung[]> {
    const groupedZuordnungen: Map<string, Zuordnung[]> = new Map();
    for (const zuordnung of zuordnungen) {
      if (groupedZuordnungen.has(zuordnung.sskId)) {
        groupedZuordnungen.get(zuordnung.sskId)?.push(zuordnung);
      } else {
        groupedZuordnungen.set(zuordnung.sskId, [zuordnung]);
      }
    }
    return groupedZuordnungen;
  }

  function createComposedZuordnungen(groupedZuordnungen: Map<string, Zuordnung[]>): Zuordnung[] {
    const composedZuordnungen: Zuordnung[] = [];
    for (const [, zuordnungen] of groupedZuordnungen) {
      if (zuordnungen.length > 1) {
        const aggregatedRoles: string[] = zuordnungen.map((z: Zuordnung) => z.rolle);
        const composedRolles: string = aggregatedRoles.join(', ');
        if (!zuordnungen[0]) continue;
        const composedZuordnung: Zuordnung = { ...zuordnungen[0], rolle: composedRolles };
        composedZuordnungen.push(composedZuordnung);
      } else {
        if (zuordnungen.length === 1) composedZuordnungen.push(zuordnungen[0]!);
      }
    }

    return composedZuordnungen;
  }

  function createZuordnungsSchoolData(zuordnungen: Zuordnung[]): SchoolData[] {
    const result: SchoolData[] = [];
    for (const zuordnung of zuordnungen) {
      const tempSchoolData: SchoolData = {
        title: zuordnung.sskName,
        info: t('profile.yourSchoolAdminsAre'),
        schoolAdmins: ['[todo]'],
        labelAndValues: [
          { label: t('profile.school'), value: zuordnung.sskName },
          { label: t('admin.rolle.rolle'), value: zuordnung.rolle },
        ],
      };

      if (zuordnung.sskDstNr) {
        tempSchoolData.labelAndValues.push({
          label: t('profile.schoolNumber'),
          labelAbbr: t('profile.schoolNumberAbbr'),
          value: zuordnung.sskDstNr,
        });
      }
      result.push(tempSchoolData);
    }

    return result;
  }

  onBeforeMount(async () => {
    await authStore.initializeAuthStatus();
    const userId: string | null | undefined = authStore.currentUser?.personId;

    if (!userId) {
      return;
    }

    await Promise.all([personStore.getPersonById(userId), personenKontextStore.getPersonenuebersichtById(userId)]);
    const currentPerson: Person | null | undefined = personStore.currentPerson?.person as Person | undefined;
    const zuordnungen: Zuordnung[] | undefined = personenKontextStore.personenuebersicht?.zuordnungen;

    if (!currentPerson) return;

    personalData.value = [
      {
        label: 'Vor- und Nachname',
        value: currentPerson.name.vorname + ' ' + currentPerson.name.familienname,
      },
      { label: 'Benutzername', value: currentPerson.referrer ?? '' },
    ];

    if (currentPerson.email) {
      personalData.value.push({ label: 'E-Mail-Adresse', value: currentPerson.email });
    }

    if (currentPerson.personalnummer) {
      personalData.value.push({
        label: t('profile.personalNummer'),
        labelAbbr: t('profile.personalNummerAbbr'),
        value: currentPerson.personalnummer,
      });
    }

    const groupedZuordnungen: Map<string, Zuordnung[]> = groupZuordnungenBySskId(zuordnungen ?? []);
    const composedZuordnungen: Zuordnung[] = createComposedZuordnungen(groupedZuordnungen);
    schoolDatas.value = createZuordnungsSchoolData(composedZuordnungen);
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
              <v-simple-table>
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in personalData"
                      :key="item.label"
                    >
                      <td class="padding">
                        <span v-if="item.labelAbbr"
                          ><abbr :title="item.label"
                            ><strong>{{ item.labelAbbr }}</strong></abbr
                          >:</span
                        >
                        <strong v-else>{{ item.label }}:</strong>
                      </td>
                      <td>{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <p class="info">
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                ></v-icon>
                {{ $t('profile.infoAboutChangeabilityFromPersonalData') }}
              </p>
            </v-col>
          </v-row>
        </LayoutCard>
      </v-col>
      <v-col
        v-for="(schoolData, index) in schoolDatas"
        :key="schoolData.title"
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="$t('person.zuordnung') + ' ' + (schoolDatas.length > 1 ? (index + 1).toString() : '')">
          <v-row class="ma-3 padding">
            <v-col cols="12">
              <v-simple-table>
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in schoolData.labelAndValues"
                      :key="item.label"
                    >
                      <td class="padding">
                        <span v-if="item.labelAbbr"
                          ><abbr :title="item.label"
                            ><strong>{{ item.labelAbbr }}</strong></abbr
                          >:</span
                        >
                        <strong v-else>{{ item.label }}:</strong>
                      </td>
                      <td>{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
              <p class="info">
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                ></v-icon>
                {{ schoolData.info + ' ' + schoolData.schoolAdmins?.join(', ') }}
              </p>
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
            <p>Ihr Passwort wurde zuletzt am 10.03.2024 geändert.</p>
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
            <p>Es wurde noch kein zweiter Faktor für Sie eingerichtet.</p>
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

  .info {
    padding-top: 20px;
    text-align: center;
    color: grey;
  }
</style>
