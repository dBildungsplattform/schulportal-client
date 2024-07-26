<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { ref, type Ref, onBeforeMount } from 'vue';
  import { useI18n } from 'vue-i18n';
  const { t }: { t: Function } = useI18n();
  type LabelValue = {
    label: string;
    labelAbbr?: string;
    value: string;
  };

  import { usePersonInfoStore, type PersonInfoStore, type PersonInfoResponse } from '@/stores/PersonInfoStore';
  import { usePersonenkontextStore, type Zuordnung, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';

  const route: RouteLocationNormalizedLoaded = useRoute();

  export type SchoolData = {
    title: string;
    info?: string | null;
    schoolAdmins?: string[];
    labelAndValues: LabelValue[];
  };

  const personInfoStore: PersonInfoStore = usePersonInfoStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const personalData: Ref = ref<LabelValue[]>([]);
  const schoolDatas: Ref = ref<SchoolData[]>([]);

  function handleGoToPreviousPage(): void {
    window.history.back();
  }

  const windowOrigin: string = window.location.origin;

  function groupZuordnungen(zuordnungen: Zuordnung[]): Map<string, Zuordnung[]> {
    const groupedZuordnungen: Map<string, Zuordnung[]> = new Map();
    for (const zuordnung of zuordnungen) {
      if (groupedZuordnungen.has(zuordnung.sskDstNr)) {
        groupedZuordnungen.get(zuordnung.sskDstNr)?.push(zuordnung);
      } else {
        groupedZuordnungen.set(zuordnung.sskDstNr, [zuordnung]);
      }
    }
    return groupedZuordnungen;
  }

  function createComposedZuordnungen(groupedZuordnungen: Map<string, Zuordnung[]>): Zuordnung[] {
    const composedZuordnungen: Zuordnung[] = [];
    for (const [, zuordnungen] of groupedZuordnungen) {
      if (zuordnungen.length > 1) {
        const aggregatedRoles: string[] = zuordnungen.map((z: Zuordnung) => z.rolle);
        const klasse: string | null =
          zuordnungen.filter((z: Zuordnung) => z.typ === OrganisationsTyp.Klasse).at(0)?.sskName ?? null;
        const schule: string | null =
          zuordnungen.filter((z: Zuordnung) => z.typ === OrganisationsTyp.Schule).at(0)?.sskName ?? null;
        const uniqueRoles: string[] = [...new Set(aggregatedRoles)];
        const composedRoles: string = uniqueRoles.join(', ');
        if (!zuordnungen[0]) continue;
        const composedZuordnung: Zuordnung = { ...zuordnungen[0], rolle: composedRoles };
        if (schule) composedZuordnung.sskName = schule;
        if (klasse) composedZuordnung.klasse = klasse;
        composedZuordnungen.push(composedZuordnung);
      } else {
        if (zuordnungen.length === 1 && zuordnungen[0]) composedZuordnungen.push(zuordnungen[0]);
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
        schoolAdmins: [], // Hierfuer muss ein API-Endpunkt implementiert werden
        labelAndValues: [{ label: t('profile.school'), value: zuordnung.sskName }],
      };

      if (zuordnung.klasse) {
        tempSchoolData.labelAndValues.push({
          label: t('profile.class'),
          value: zuordnung.klasse,
        });
      }

      tempSchoolData.labelAndValues.push({ label: t('admin.rolle.rolle'), value: zuordnung.rolle });

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
    await personInfoStore.initPersonInfo();
    await personenkontextStore.getPersonenuebersichtById(personInfoStore.personInfo?.person.id ?? '');
    const personInfo: PersonInfoResponse = personInfoStore.personInfo as PersonInfoResponse;
    const personenZuordnungen: Zuordnung[] = personenkontextStore.personenuebersicht?.zuordnungen ?? [];

    personalData.value = [
      {
        label: 'Vor- und Nachname',
        value: personInfo.person.name.vorname + ' ' + personInfo.person.name.familiennamen,
      },
      { label: 'Benutzername', value: personInfo.person.referrer },
    ];

    if (personInfo.person.personalnummer) {
      personalData.value.push({
        label: t('profile.personalNummer'),
        labelAbbr: t('profile.personalNummerAbbr'),
        value: personInfo.person.personalnummer,
      });
    }
    const groupedZuordnungen: Map<string, Zuordnung[]> = groupZuordnungen(
      personenZuordnungen.map(
        (z: Zuordnung) =>
          ({
            ...z,
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            sskDstNr: z.sskDstNr?.split('-')[0], // die Klasse wird durch einen Bindestrich an die Schulnummer angehangen. Um nach der Schule zu gruppieren, wird nur die Schulnummer verwendet.
          }) as Zuordnung,
      ),
    );

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
              <p
                v-if="schoolData.schoolAdmins.length > 0"
                class="info"
              >
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
            <div>
              <v-btn
                data-testid="set-new-password-button"
                class="primary"
                :href="`/api/auth/set-new-password?redirectUrl=${windowOrigin}${route.fullPath}`"
              >
                {{ $t('profile.setNewPassword') }}
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
