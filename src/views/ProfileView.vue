<script setup lang="ts">
  import type { DBiamPersonenzuordnungResponse } from '@/api-client/generated/api';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { usePersonInfoStore, type PersonInfoResponse, type PersonInfoStore } from '@/stores/PersonInfoStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { type Zuordnung } from '@/stores/PersonenkontextStore';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import { computed, onBeforeMount, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';

  const { t }: { t: Function } = useI18n();

  enum ItemType {
    KO_PERS = 'KO_PERS',
  }
  type LabelValue = {
    label: string;
    labelAbbr?: string;
    value: string;
    type?: ItemType;
    testIdLabel: string;
    testIdValue: string;
  };

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
  let personStore: PersonStore = usePersonStore();
  let authStore: AuthStore = useAuthStore();
  let twoFactorAuthenticationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
  const personalData: Ref = ref<LabelValue[]>([]);
  const schulDaten: Ref = ref<SchulDaten[]>([]);
  const hasKoPersMerkmal: Ref = ref<boolean>(false);
  const lastPasswordChangeDate: ComputedRef<string> = computed(() => {
    const passwordUpdatedAt: string | null | undefined = authStore.currentUser?.password_updated_at;
    if (!passwordUpdatedAt) return '';
    const date: Date = new Date(passwordUpdatedAt);
    if (isNaN(date.valueOf())) return '';
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  });

  const twoFactorAuthError: ComputedRef<string> = computed(() => {
    if (twoFactorAuthenticationStore.loading) return '';
    if (twoFactorAuthenticationStore.errorCode) return t('profile.twoFactorAuthenticationConnectionError');
    return '';
  });

  function handleGoToPreviousPage(): void {
    const previousUrl: string | null = sessionStorage.getItem('previousUrl');
    router.push(previousUrl ?? '/start');
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
      const key: string = zuordnung.sskDstNr ?? zuordnung.sskId;
      if (groupedZuordnungen.has(key)) {
        groupedZuordnungen.get(key)?.push(zuordnung);
      } else {
        groupedZuordnungen.set(key, [zuordnung]);
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
            testIdLabel: 'schule-label-' + (index + 1),
            testIdValue: 'schule-value-' + (index + 1),
          },
        ],
      };

      if (zuordnung.klasse) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.klasse'),
          value: zuordnung.klasse,
          testIdLabel: 'klasse-label-' + (index + 1),
          testIdValue: 'klasse-value-' + (index + 1),
        });
      }

      tempSchulDaten.labelAndValues.push({
        label: t('admin.rolle.rolle'),
        value: zuordnung.rolle,
        testIdLabel: 'rolle-label-' + (index + 1),
        testIdValue: 'rolle-value-' + (index + 1),
      });

      if (zuordnung.sskDstNr) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.dienstStellenNummer'),
          labelAbbr: t('profile.dienstStellenNummerAbbr'),
          value: zuordnung.sskDstNr,
          testIdLabel: 'dienststellennummer-label-' + (index + 1),
          testIdValue: 'dienststellennummer-value-' + (index + 1),
        });
      }

      result.push(tempSchulDaten);
    }

    return result;
  }

  async function initializeStores(): Promise<void> {
    personInfoStore = usePersonInfoStore();
    personStore = usePersonStore();
    authStore = useAuthStore();
    await personInfoStore.initPersonInfo();
    await personStore.getPersonenuebersichtById(personInfoStore.personInfo?.person.id ?? '');
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

    if (personInfo.person.personalnummer || hasKoPersMerkmal.value) {
      personalData.value.push({
        label: t('profile.koPersNummer'),
        labelAbbr: t('profile.koPersNummerAbbr'),
        value: personInfo.person.personalnummer,
        type: ItemType.KO_PERS,
        testIdLabel: 'kopersnummer-label',
        testIdValue: 'kopersnummer-value',
      });
    }
  }

  function setupSchuleData(): void {
    if (!personStore.personenuebersicht) return;
    const personenZuordnungen: Zuordnung[] = personStore.personenuebersicht.zuordnungen;
    const groupedZuordnungen: Map<string, Zuordnung[]> = groupZuordnungen(
      personenZuordnungen.map(
        (z: Zuordnung) =>
          ({
            ...z,
            sskDstNr: z.sskDstNr?.split('-')[0], // die Klasse wird durch einen Bindestrich an die Schulnummer angehangen. Um nach der Schule zu gruppieren, wird nur die Schulnummer verwendet.
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

  function hasKoPersMerkmalCheck(): void {
    let zuordnungen: Array<DBiamPersonenzuordnungResponse> | undefined = personStore.personenuebersicht?.zuordnungen;
    if (zuordnungen !== undefined) {
      let result: boolean = !!zuordnungen.find((zuordnung: DBiamPersonenzuordnungResponse) => {
        return zuordnung.merkmale.includes('KOPERS_PFLICHT');
      });
      hasKoPersMerkmal.value = result;
    }
  }
  onBeforeMount(async () => {
    await initializeStores();
    hasKoPersMerkmalCheck();
    setupPersonalData();
    setupSchuleData();
  });
</script>

<template>
  <v-btn
    class="mt-8"
    @click="handleGoToPreviousPage()"
    data-testid="back-to-previous-page-button"
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
                      <td v-if="item.type === ItemType.KO_PERS && item.value === null">
                        <SpshTooltip
                          :disabledText="t('profile.koPersNummerMissing')"
                          :enabledText="t('profile.koPersNummerMissing')"
                          position="top"
                        >
                          <span
                            v-if="item.labelAbbr"
                            class="text-red"
                          >
                            <strong>{{ item.labelAbbr }}</strong> :</span
                          >
                          <strong v-else>{{ item.label }}:</strong>
                        </SpshTooltip>
                      </td>
                      <td v-else>
                        <span v-if="item.labelAbbr"
                          ><abbr :title="item.label"
                            ><strong :data-testid="item.testIdLabel">{{ item.labelAbbr }}:</strong></abbr
                          ></span
                        >
                        <strong
                          :data-testid="item.testIdLabel"
                          v-else
                          >{{ item.label }}:</strong
                        >
                      </td>
                      <td
                        :data-testid="item.testIdValue"
                        v-if="item.type === ItemType.KO_PERS && item.value === null"
                        class="text-red"
                      >
                        {{ t('missing') }}
                      </td>
                      <td
                        :data-testid="item.testIdValue"
                        v-else
                      >
                        {{ item.value }}
                      </td>
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
                <span data-testid="info-text">
                  {{ $t('profile.infoAboutChangeabilityFromPersonalData') }}
                </span>
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
          :headline-test-id="'zuordung-card-' + (index + 1)"
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
                          ></span
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
                v-if="schuleData.schoolAdmins?.length > 0"
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
        data-testid="password-card"
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
            <p
              class="w-100 text-center text-body"
              v-if="lastPasswordChangeDate"
            >
              {{ t('profile.lastPasswordChange', { date: lastPasswordChangeDate }) }}
            </p>
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
            <v-col>
              <p
                v-if="twoFactorAuthError"
                class="pt-4 text-center text-body-1 text-medium-emphasis"
              >
                <v-icon
                  color="warning"
                  icon="mdi-alert-outline"
                ></v-icon>
                {{ twoFactorAuthError }}
              </p>
              <v-btn
                v-else
                color="primary"
                disabled
                data-testid="setup-two-factor-button"
              >
                {{ $t('profile.setupTwoFactorAuth') }}
              </v-btn>
            </v-col>
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
