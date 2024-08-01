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

  export type SchulDaten = {
    title: string;
    info?: string | null;
    schulAdmins?: string[];
    labelAndValues: LabelValue[];
  };

  let personInfoStore: PersonInfoStore = usePersonInfoStore();
  let personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const personalData: Ref = ref<LabelValue[]>([]);
  const schulDaten: Ref = ref<SchulDaten[]>([]);

  function handleGoToPreviousPage(): void {
    window.history.back();
  }

  const windowOrigin: string = window.location.origin;

  /**
   * Gruppiert eine Liste von Zuordnungen nach dem Wert der Eigenschaft 'sskDstNr'.
   *
   * Diese Funktion nimmt ein Array von Zuordnungen entgegen und organisiert diese
   * in einer Map, wobei der Schlüssel der Wert der Eigenschaft 'sskDstNr' ist
   * und der Wert ein Array von Zuordnungen mit diesem Schlüssel.
   *
   * @param zuordnungen - Ein Array von Zuordnungen, die gruppiert werden sollen.
   * @returns Eine Map, in der jeder Schlüssel ein Wert von 'sskDstNr' ist und
   *          jeder Wert ein Array von Zuordnungen mit diesem Schlüssel.
   */
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

  /**
   * Erstellt eine Liste von zusammengesetzten Zuordnungen aus einer gruppierten Map von Zuordnungen.
   *
   * Diese Funktion nimmt eine Map von gruppierten Zuordnungen entgegen und erstellt eine neue Liste von
   * Zuordnungen. Wenn es mehrere Zuordnungen in einer Gruppe gibt, werden die Rollen aggregiert und
   * zusammengeführt. Für Zuordnungen des Typs "Klasse" oder "Schule" wird der Name der Klasse oder
   * der Schule entsprechend gesetzt. Einzelne Zuordnungen ohne Gruppierung werden direkt übernommen.
   *
   * @param groupedZuordnungen - Eine Map, in der jeder Schlüssel ein Wert von 'sskDstNr' ist und
   *                             jeder Wert ein Array von Zuordnungen mit diesem Schlüssel.
   * @returns Ein Array von zusammengesetzten Zuordnungen.
   */
  function createComposedZuordnungen(groupedZuordnungen: Map<string, Zuordnung[]>): Zuordnung[] {
    const composedZuordnungen: Zuordnung[] = [];
    for (const [, zuordnungen] of groupedZuordnungen) {
      if (zuordnungen.length === 0 || zuordnungen[0] === undefined) continue;
      if (zuordnungen.length > 1) {
        const aggregatedRoles: string[] = zuordnungen.map((z: Zuordnung) => z.rolle);
        const uniqueRoles: string[] = [...new Set(aggregatedRoles)];
        const composedRoles: string = uniqueRoles.join(', ');
        const klasse: string | null =
          zuordnungen
            .filter((z: Zuordnung) => z.typ === OrganisationsTyp.Klasse)
            .map((z: Zuordnung) => z.sskName)
            .join(', ') || null;
        const schule: string | null =
          zuordnungen.find((z: Zuordnung) => z.typ === OrganisationsTyp.Schule)?.sskName || null;
        const composedZuordnung: Zuordnung = { ...zuordnungen[0], rolle: composedRoles };
        if (schule) composedZuordnung.sskName = schule;
        if (klasse) composedZuordnung.klasse = klasse;
        composedZuordnungen.push(composedZuordnung);
      } else {
        composedZuordnungen.push(zuordnungen[0]);
      }
    }
    return composedZuordnungen;
  }

  function createZuordnungsSchuleDaten(zuordnungen: Zuordnung[]): SchulDaten[] {
    const result: SchulDaten[] = [];
    for (const zuordnung of zuordnungen) {
      const tempSchulDaten: SchulDaten = {
        title: zuordnung.sskName,
        info: t('profile.yourSchuleAdminsAre'),
        schulAdmins: [], // Hierfuer muss ein API-Endpunkt implementiert werden
        labelAndValues: [{ label: t('profile.schule'), value: zuordnung.sskName }],
      };

      if (zuordnung.klasse) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.klasse'),
          value: zuordnung.klasse,
        });
      }

      tempSchulDaten.labelAndValues.push({ label: t('admin.rolle.rolle'), value: zuordnung.rolle });

      if (zuordnung.sskDstNr) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.dienstStellenNummer'),
          labelAbbr: t('profile.dienstStellenNummerAbbr'),
          value: zuordnung.sskDstNr,
        });
      }

      result.push(tempSchulDaten);
    }

    return result;
  }

  async function initializeStores(): Promise<void> {
    personInfoStore = usePersonInfoStore();
    personenkontextStore = usePersonenkontextStore();
    await personInfoStore.initPersonInfo();
    await personenkontextStore.getPersonenuebersichtById(personInfoStore.personInfo?.person.id ?? '');
  }

  function setupPersonalData(): void {
    if (!personInfoStore.personInfo) return;
    const personInfo: PersonInfoResponse = personInfoStore.personInfo;
    personalData.value = [
      {
        label: t('profile.fullName'),
        value: personInfo.person.name.vorname + ' ' + personInfo.person.name.familiennamen,
      },
      { label: t('person.userName'), value: personInfo.person.referrer },
    ];

    if (personInfo.person.personalnummer) {
      personalData.value.push({
        label: t('profile.koPersNummer'),
        labelAbbr: t('profile.koPersNummerAbbr'),
        value: personInfo.person.personalnummer,
      });
    }
  }

  function setupSchuleData(): void {
    if (!personenkontextStore.personenuebersicht) return;
    const personenZuordnungen: Zuordnung[] = personenkontextStore.personenuebersicht.zuordnungen;
    const groupedZuordnungen: Map<string, Zuordnung[]> = groupZuordnungen(
      personenZuordnungen.map(
        (z: Zuordnung) =>
          ({
            ...z,
            sskDstNr: z.sskDstNr.split('-')[0], // die Klasse wird durch einen Bindestrich an die Schulnummer angehangen. Um nach der Schule zu gruppieren, wird nur die Schulnummer verwendet.
          }) as Zuordnung,
      ),
    );

    const composedZuordnungen: Zuordnung[] = createComposedZuordnungen(groupedZuordnungen);
    schulDaten.value = createZuordnungsSchuleDaten(composedZuordnungen);
  }

  onBeforeMount(async () => {
    await initializeStores();
    setupPersonalData();
    setupSchuleData();
  });
</script>

<template>
  <v-btn
    class="mt-8"
    @click="handleGoToPreviousPage()"
  >
    <v-icon
      class="mr-2"
      icon="mdi-arrow-left-thin"
    />
    {{ $t('nav.backToPreviousPage') }}</v-btn
  >
  <div class="my-8">
    <v-row class="flex-nowrap mb-1 justify-center">
      <v-col cols="auto">
        <h2
          class="headline-1"
          data-testid="profile-headline"
        >
          {{ $t('nav.profile') }}
        </h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="$t('profile.personalData')">
          <v-row class="ma-4">
            <v-col cols="12">
              <v-table class="text-body-1">
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in personalData"
                      :key="item.label"
                    >
                      <td>
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
              </v-table>
              <p class="pt-4 text-center text-body-1 text-medium-emphasis">
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
        v-for="(schuleData, index) in schulDaten"
        :key="schuleData.title"
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard :header="$t('person.zuordnung') + ' ' + (schulDaten.length > 1 ? (index + 1).toString() : '')">
          <v-row class="ma-3 p-4">
            <v-col cols="12">
              <v-table class="text-body-1">
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in schuleData.labelAndValues"
                      :key="item.label"
                    >
                      <td>
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
              </v-table>
              <p
                class="pt-4 text-center text-body-1"
                v-if="schuleData.schulAdmins.length > 0"
              >
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                ></v-icon>
                {{ schuleData.info + ' ' + schuleData.schulAdmins?.join(', ') }}
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
              class="w-100"
              icon="mdi-key-alert-outline"
            ></v-icon>
            <div>
              <v-btn
                data-testid="reset-password-button"
                class="primary"
                :href="`/api/auth/reset-password?redirectUrl=${windowOrigin}${route.fullPath}`"
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
              class="w-100"
              icon="mdi-shield-account-outline"
            ></v-icon>
            <div>
              <v-btn
                color="primary"
                disabled
              >
                {{ $t('profile.setupTwoFactorAuth') }}
              </v-btn>
            </div>
          </v-row>
        </LayoutCard>
      </v-col>
    </v-row>
  </div>
</template>
