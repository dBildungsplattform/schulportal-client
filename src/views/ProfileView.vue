<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { ref, type Ref, onBeforeMount } from 'vue';
  import { useI18n } from 'vue-i18n';
  const { t }: { t: Function } = useI18n();
  type LabelValue = {
    label: string;
    labelAbbr?: string;
    value: string;
    testIdLabel: string;
    testIdValue: string;
  };

  import { usePersonInfoStore, type PersonInfoStore, type PersonInfoResponse } from '@/stores/PersonInfoStore';
  import { usePersonenkontextStore, type Zuordnung, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { type RouteLocationNormalizedLoaded, type Router, useRoute, useRouter } from 'vue-router';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const kcActionStatus: string | null = route.query['kc_action_status'] as string | null;

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
    for (const [index, zuordnung] of zuordnungen.entries()) {
      const tempSchulDaten: SchulDaten = {
        title: zuordnung.sskName,
        info: t('profile.yourSchuleAdminsAre'),
        schulAdmins: [], // Hierfuer muss ein API-Endpunkt implementiert werden
        labelAndValues: [
          {
            label: t('profile.schule'),
            value: zuordnung.sskName,
            testIdLabel: 'schule-label-' + index,
            testIdValue: 'schule-value-' + index,
          },
        ],
      };

      if (zuordnung.klasse) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.klasse'),
          value: zuordnung.klasse,
          testIdLabel: 'klasse-label-' + index,
          testIdValue: 'klasse-value-' + index,
        });
      }

      tempSchulDaten.labelAndValues.push({
        label: t('admin.rolle.rolle'),
        value: zuordnung.rolle,
        testIdLabel: 'rolle-label-' + index,
        testIdValue: 'rolle-value-' + index,
      });

      if (zuordnung.sskDstNr) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.dienstStellenNummer'),
          labelAbbr: t('profile.dienstStellenNummerAbbr'),
          value: zuordnung.sskDstNr,
          testIdLabel: 'dienstStellenNummer-label-' + index,
          testIdValue: 'dienstStellenNummer-value-' + index,
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
        testIdLabel: 'fullName-label',
        testIdValue: 'fullName-value',
      },
      {
        label: t('person.userName'),
        value: personInfo.person.referrer,
        testIdLabel: 'userName-label',
        testIdValue: 'userName-value',
      },
    ];

    if (personInfo.person.personalnummer) {
      personalData.value.push({
        label: t('profile.koPersNummer'),
        labelAbbr: t('profile.koPersNummerAbbr'),
        value: personInfo.person.personalnummer,
        testIdLabel: 'koPersNummer-label',
        testIdValue: 'koPersNummer-value',
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

  const isPasswordResetDialogActive: Ref<boolean> = ref(false);
  const showChangedPasswordDialog: Ref<boolean> = ref(true);

  function closeChangePasswordDialog(): void {
    isPasswordResetDialogActive.value = false;
  }

  function openChangePasswordDialog(): void {
    isPasswordResetDialogActive.value = true;
  }

  function closePasswordChangedDialogAndClearQuery(): void {
    showChangedPasswordDialog.value = false;
    router.replace({ path: route.fullPath, query: {} });
  }

  function navigateToPasswordChange(): void {
    const url: URL = new URL(window.origin + '/api/auth/reset-password');
    url.searchParams.set('redirectUrl', windowOrigin + route.fullPath);
    url.searchParams.set('login_hint', personInfoStore.personInfo?.person.referrer ?? '');
    window.location.href = url.toString();
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
    data-testid="button_ZurueckVorherigeSeite"
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
        <LayoutCard
          :header="$t('profile.personalData')"
          :headline-test-id="'layout-card-headline-persoenliche-daten'"
        >
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
                            ><strong :data-testid="item.testIdLabel">{{ item.labelAbbr }}:</strong></abbr
                          >:</span
                        >
                        <strong
                          :data-testid="item.testIdLabel"
                          v-else
                          >{{ item.label }}:</strong
                        >
                      </td>
                      <td :data-testid="item.testIdValue">{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-table>
              <p
                class="pt-4 text-center text-body-1 text-medium-emphasis"
                data-testid="info-text-with-icon"
              >
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                  data-testid="info-icon"
                ></v-icon>
                <template data-testid="info-text">
                  {{ $t('profile.infoAboutChangeabilityFromPersonalData') }}
                </template>
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
        <LayoutCard
          :header="$t('person.zuordnung') + ' ' + (schulDaten.length > 1 ? (index + 1).toString() : '')"
          :headline-test-id="'zuordung-card-' + index"
        >
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
                            ><strong :data-testid="item.testIdLabel">{{ item.labelAbbr }}:</strong></abbr
                          >:</span
                        >
                        <strong
                          :data-testid="item.testIdLabel"
                          v-else
                          >{{ item.label }}:</strong
                        >
                      </td>
                      <td :data-testid="item.testIdValue">{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-table>
              <p
                class="pt-4 text-center text-body-1"
                v-if="schuleData.schoolAdmins.length > 0"
                data-testid="school-admins-${index}"
              >
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                  data-testid="school-admins-icon"
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
        <LayoutCard
          :headline-test-id="'new-password-card'"
          :header="$t('login.password')"
        >
          <v-row class="ma-3 d-flex align-content-center justify-center ga-4">
            <v-icon
              size="x-large"
              class="w-100"
              icon="mdi-key-alert-outline"
              data-testid="password-icon"
            ></v-icon>
            <div>
              <v-btn
                class="primary"
                data-testid="open-change-password-dialog"
                @click="openChangePasswordDialog()"
              >
                {{ $t('profile.changePassword') }}
              </v-btn>
              <v-dialog
                v-model="isPasswordResetDialogActive"
                persistent
              >
                <LayoutCard
                  :closable="true"
                  :header="$t('profile.changePassword')"
                  @onCloseClicked="closeChangePasswordDialog()"
                >
                  <v-card-text>
                    <v-container class="d-flex align-center">
                      <v-col
                        cols="auto"
                        class="d-flex justify-center"
                      >
                        <v-icon
                          class="mr-2"
                          size="x-large"
                          icon="mdi-information-slab-circle-outline"
                        ></v-icon>
                      </v-col>
                      <v-col>
                        <p class="text-body bold">
                          {{ $t('profile.changePasswordInfo') }}
                        </p>
                      </v-col>
                    </v-container>
                  </v-card-text>

                  <v-card-actions class="justify-center">
                    <v-row class="justify-center">
                      <v-col
                        cols="12"
                        sm="6"
                        md="4"
                      >
                        <v-btn
                          class="secondary button"
                          @click.stop="closeChangePasswordDialog()"
                          data-testid="close-change-password-dialog-button"
                        >
                          {{ $t('cancel') }}
                        </v-btn>
                      </v-col>
                      <v-col
                        cols="12"
                        sm="6"
                        md="4"
                      >
                        <v-btn
                          @click.stop="navigateToPasswordChange()"
                          class="primary"
                          data-testid="change-password-button"
                        >
                          {{ $t('profile.changePassword') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-actions>
                </LayoutCard>
              </v-dialog>
            </div>
          </v-row>
        </LayoutCard>
      </v-col>

      <v-col
        cols="12"
        sm="12"
        md="6"
      >
        <LayoutCard
          :headline-test-id="'two-factor-card'"
          :header="$t('profile.twoFactorAuth')"
        >
          <v-row class="ma-3 d-flex align-content-center justify-center ga-4">
            <v-icon
              size="x-large"
              class="w-100"
              icon="mdi-shield-account-outline"
              data-testid="two-factor-icon"
            ></v-icon>
            <div>
              <v-btn
                color="primary"
                disabled
                data-testid="setup-two-factor-button"
              >
                {{ $t('profile.setupTwoFactorAuth') }}
              </v-btn>
            </div>
          </v-row>
        </LayoutCard>
      </v-col>
    </v-row>
  </div>

  <template v-if="kcActionStatus && kcActionStatus != 'cancelled'">
    <v-dialog
      v-model="showChangedPasswordDialog"
      persistent
    >
      <LayoutCard
        :closable="true"
        :header="$t('profile.changePassword')"
        @onCloseClicked="closeChangePasswordDialog()"
      >
        <v-card-text>
          <v-container class="d-flex align-center">
            <v-col
              cols="auto"
              class="d-flex justify-center"
            >
              <v-icon
                class="mr-2"
                size="x-large"
                icon="mdi-information-slab-circle-outline"
              ></v-icon>
            </v-col>
            <v-col>
              <p class="text-body bold">
                {{
                  kcActionStatus == 'success'
                    ? $t('profile.successFullPasswordChange')
                    : $t('profile.errorPasswordChange')
                }}
              </p>
            </v-col>
          </v-container>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                class="secondary button"
                @click.stop="closePasswordChangedDialogAndClearQuery()"
                data-testid="close-password-changed-dialog-button"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
  </template>
</template>
