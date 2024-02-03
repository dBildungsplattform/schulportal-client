<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { ref, type Ref } from 'vue'
  import { useRoleStore, type RoleStore } from '@/stores/RoleStore'
  import type { CreateRolleBodyParamsRollenartEnum, RolleResponse } from '@/api-client/generated'
  import { useI18n, type Composer } from 'vue-i18n'
  import SpshAlert from '@/components/alert/SpshAlert.vue'

  const { t }: Composer = useI18n({ useScope: 'global' })

  const isRoleCreated: Ref<boolean> = ref(false)

  type Selection = string | null
  type SelectionArray = string[] | null

  const selectedStructureNode: Ref<Selection> = ref(null)
  const selectedRoleType: Ref<Selection> = ref(null)
  const selectedRoleName: Ref<Selection> = ref(null)
  const selectedCharacteristics: Ref<SelectionArray> = ref(null)

  const structureNodes: string[] = ['d3aa88e2-c754-41e0-8ba6-4198a34aa0a2']
  const roleTypes: string[] = ['Lern', 'Lehr', 'Extern', 'Orgadmin', 'Leit', 'Sysadmin']
  const characteristics: string[] = ['BEFRISTUNG_PFLICHT', 'KOPERS_PFLICHT']

  const roleStore: RoleStore = useRoleStore()

  const submitForm = async (): Promise<void> => {
    if (
      selectedRoleName.value &&
      selectedStructureNode.value &&
      selectedRoleType.value &&
      selectedCharacteristics.value
    ) {
      await roleStore.createRole(
        selectedRoleName.value,
        selectedStructureNode.value,
        selectedRoleType.value as keyof typeof CreateRolleBodyParamsRollenartEnum,
        selectedCharacteristics.value
      )
      isRoleCreated.value = true
    }
  }
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center headline-1">{{ $t('admin.headline') }}</h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
      :header="$t('admin.role.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if error on submit -->
      <SpshAlert
        :model-value="!!roleStore.errorCode"
        :title="t('admin.role.roleCreateErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.role.roleCreateErrorText')"
        :showButton="true"
        :buttonText="$t('admin.user.backToList')"
        buttonClass="primary"
      />
      <!-- Result template on success after submit  -->
      <template v-if="isRoleCreated">
        <v-row justify="center">
          <v-col
            class="subtitle-1"
            cols="auto"
          >
            Die Rolle wurde erfolgreich hinzugefügt.
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <v-icon
              small
              color="#1EAE9C"
            >
              mdi-check-circle
            </v-icon>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col
            class="subtitle-2"
            cols="auto"
          >
            Folgende Daten wurden gespeichert:
          </v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> Rollenname:</v-col>
          <v-col class="text-body">eeee </v-col>
        </v-row>
        <v-row>
          ><v-col class="text-body bold text-right"> Schulstrukturknoten: </v-col>
          <v-col class="text-body">ddddddddddddddddddd</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> Rollenart: </v-col>
          <v-col class="text-body">zzz</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> Merkmale:</v-col>
          <v-col class="text-body">hamid</v-col></v-row
        >
      </template>
      <template v-if="!roleStore.errorCode">
        <v-form @submit.prevent="submitForm">
          <v-container class="new-role">
            <v-row>
              <v-col cols="1"></v-col>
              <v-col cols="auto">
                <v-icon
                  small
                  class="mr-2"
                >
                  mdi-alert-circle-outline
                </v-icon>
                <span class="subtitle-2">{{ $t('admin.mandatoryFieldsNotice') }}</span>
              </v-col>
            </v-row>
            <!-- Choose school structure node -->
            <v-row>
              <v-col cols="2"></v-col>
              <v-col>
                <h3 class="subtitle-2">1. {{ $t('admin.role.chooseSchoolStructureNode') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col cols="3"></v-col>
              <v-col
                cols="3"
                class="text-right"
              >
                <label class="text-body">
                  {{ $t('admin.role.chooseSchoolStructureNode') + '*' }}
                </label></v-col
              >
              <v-col cols="auto">
                <v-select
                  :items="structureNodes"
                  v-model="selectedStructureNode"
                  :label="$t('admin.role.chooseSchoolStructureNode')"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
            <!-- Choose Role type -->
            <v-row>
              <v-col cols="2"></v-col>
              <v-col>
                <h3 class="subtitle-2">2. {{ $t('admin.role.chooseRoleType') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col cols="3"></v-col>
              <v-col
                cols="3"
                class="text-right"
              >
                <label class="text-body">
                  {{ $t('admin.role.chooseRoleType') + '*' }}
                </label></v-col
              >
              <v-col cols="auto">
                <v-select
                  :items="roleTypes"
                  v-model="selectedRoleType"
                  :label="$t('admin.role.chooseRoleType')"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
            <!-- Enter Role name -->
            <template v-if="selectedRoleType">
              <v-row>
                <v-col cols="2"></v-col>
                <v-col>
                  <label class="subtitle-2">3. {{ $t('admin.role.enterRoleName') }}</label>
                </v-col>
              </v-row>
              <v-row>
                <!-- Spacer column -->
                <v-col cols="3"></v-col>
                <v-col
                  cols="3"
                  class="text-right"
                >
                  <label class="text-body">
                    {{ $t('admin.role.enterRoleName') + '*' }}
                  </label></v-col
                >
                <v-col cols="auto">
                  <v-text-field
                    v-model="selectedRoleName"
                    :label="$t('admin.role.enterRoleName')"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
              <!-- Choose characteristics -->
              <v-row>
                <v-col cols="2"></v-col>
                <v-col>
                  <label class="subtitle-2">4. {{ $t('admin.role.chooseCharacteristics') }}</label>
                </v-col>
              </v-row>
              <v-row>
                <!-- Spacer column -->
                <v-col cols="3"></v-col>
                <v-col
                  cols="3"
                  class="text-right"
                >
                  <h3 class="text-body">
                    {{ $t('admin.role.chooseCharacteristics') + '*' }}
                  </h3></v-col
                >
                <v-col cols="auto">
                  <v-select
                    required
                    :items="characteristics"
                    v-model="selectedCharacteristics"
                    :label="$t('admin.role.chooseCharacteristics')"
                    variant="outlined"
                    density="compact"
                    multiple
                  ></v-select>
                </v-col>
              </v-row>
              <v-divider
                class="border-opacity-100 rounded my-6"
                color="#E5EAEF"
                thickness="6"
              ></v-divider>
              <v-row justify="end">
                <v-col
                  cols="12"
                  md="auto"
                >
                  <v-btn class="secondary">{{ $t('admin.role.discard') }}</v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="auto"
                >
                  <v-btn
                    type="submit"
                    class="primary button"
                    data-testid="open-password-reset-dialog-icon"
                  >
                    {{ $t('admin.role.create') }}
                  </v-btn>
                </v-col>
              </v-row>
            </template>
          </v-container>
        </v-form>
      </template>
    </LayoutCard>
  </div>
</template>

<style>
  .v-select {
    width: 300px;
  }

  .v-text-field {
    width: 300px;
  }
</style>
