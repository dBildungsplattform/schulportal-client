<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { ref, type Ref } from 'vue'
  import { useRoleStore, type RoleStore } from '@/stores/RoleStore'
  import type { CreateRolleBodyParamsRollenartEnum } from '@/api-client/generated'
  import { useI18n, type Composer } from 'vue-i18n'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import { type Router, useRouter } from 'vue-router'

  const { t }: Composer = useI18n({ useScope: 'global' })
  const router: Router = useRouter()

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
    }
  }

  const handleCreateAnotherRole = (): void => {
    roleStore.createdRole = null
    router.push({ name: 'create-role' })
  }
  // Rule for validating the role name. Maybe enhance a validation framework like VeeValidate instead?
  const roleNameRules: Array<(v: string) => boolean | string> = [
    (v: string): boolean | string => v.length <= 200 || t('admin.role.rule.roleNameLength'),
    (v: string): boolean | string => !!v.length || t('admin.role.rule.roleNameRequired')
  ]
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
      <!-- Result template on success after submit (Present value in createdRole and no errorCode)  -->
      <template v-if="roleStore.createdRole && !roleStore.errorCode">
        <v-container class="new-role-success">
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              {{ $t('admin.role.roleAddedSuccessfully') }}
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
              {{ $t('admin.role.followingRoleCreated') }}
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right">
              {{ $t('admin.role.schoolStructureNode') }}:
            </v-col>
            <v-col class="text-body">
              {{ roleStore.createdRole.administeredBySchulstrukturknoten }}</v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.role.roleType') }}: </v-col>
            <v-col class="text-body"> {{ roleStore.createdRole.rollenart }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.role.roleName') }}:</v-col>
            <v-col class="text-body"> {{ roleStore.createdRole.name }} </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right">
              {{ $t('admin.role.characteristics') }}:</v-col
            >
            <v-col class="text-body"> {{ roleStore.createdRole.merkmale }}</v-col></v-row
          >
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
              <v-btn
                class="secondary"
                data-testid="back-to-list-button"
                >{{ $t('admin.role.backToList') }}</v-btn
              >
            </v-col>
            <v-col
              cols="12"
              md="auto"
            >
              <v-btn
                class="primary button"
                data-testid="create-another-role-button"
                @click="handleCreateAnotherRole"
              >
                {{ $t('admin.role.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
      <!-- The form to create a new role (No created role yet and no errorCode) -->
      <template v-if="!roleStore.createdRole && !roleStore.errorCode">
        <v-container class="new-role">
          <v-form @submit.prevent="submitForm">
            <v-row>
              <v-col
                class="d-none d-md-flex"
                cols="1"
              ></v-col>
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
              <!-- This column will be hidden on xs screens and visible on sm and larger screens -->
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">1. {{ $t('admin.role.chooseSchoolStructureNode') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col
                cols="3"
                class="d-none d-md-flex"
              ></v-col>
              <v-col
                cols="12"
                md="3"
                class="md-text-right"
              >
                <label class="text-body">
                  {{ $t('admin.role.chooseSchoolStructureNode') + '*' }}
                </label></v-col
              >
              <v-col cols="auto">
                <v-select
                  :items="structureNodes"
                  v-model="selectedStructureNode"
                  variant="outlined"
                  density="compact"
                  single-line
                  :placeholder="$t('admin.role.chooseSchoolStructureNode')"
                  :bg-color="selectedStructureNode ? '#4dc7bc' : ''"
                  clearable
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.title"
                      style="color: #001e49"
                    ></v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            <!-- Choose Role type -->
            <v-row>
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">2. {{ $t('admin.role.chooseRoleType') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col
                cols="3"
                class="d-none d-md-flex"
              ></v-col>
              <v-col
                cols="12"
                md="3"
                class="md-text-right"
              >
                <label class="text-body">
                  {{ $t('admin.role.chooseRoleType') + '*' }}
                </label></v-col
              >
              <v-col cols="auto">
                <v-select
                  :items="roleTypes"
                  v-model="selectedRoleType"
                  :placeholder="$t('admin.role.chooseRoleType')"
                  variant="outlined"
                  density="compact"
                  :bg-color="selectedRoleType ? '#4dc7bc' : ''"
                  clearable
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.title"
                      style="color: #001e49"
                    ></v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Enter Role name -->
            <template v-if="selectedRoleType">
              <v-row>
                <v-col
                  cols="2"
                  class="d-none d-md-flex"
                ></v-col>
                <v-col>
                  <label class="subtitle-2">3. {{ $t('admin.role.enterRoleName') }}</label>
                </v-col>
              </v-row>
              <v-row>
                <!-- Spacer column -->
                <v-col
                  cols="3"
                  class="d-none d-md-flex"
                ></v-col>
                <v-col
                  cols="12"
                  md="3"
                  class="md-text-right"
                >
                  <label class="text-body">
                    {{ $t('admin.role.enterRoleName') + '*' }}
                  </label></v-col
                >
                <v-col cols="auto">
                  <v-text-field
                    v-model="selectedRoleName"
                    :placeholder="$t('admin.role.enterRoleName')"
                    variant="outlined"
                    density="compact"
                    :rules="roleNameRules"
                    required
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
                <v-col
                  cols="3"
                  class="d-none d-md-flex"
                ></v-col>
                <v-col
                  cols="12"
                  md="3"
                  class="md-text-right"
                >
                  <h3 class="text-body">
                    {{ $t('admin.role.chooseCharacteristics') + '*' }}
                  </h3></v-col
                >
                <v-col cols="auto">
                  <v-select
                    :items="characteristics"
                    v-model="selectedCharacteristics"
                    :placeholder="$t('admin.role.chooseCharacteristics')"
                    variant="outlined"
                    density="compact"
                    multiple
                    :bg-color="selectedCharacteristics ? '#4dc7bc' : ''"
                    clearable
                    required
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.title"
                        style="color: #001e49"
                      ></v-list-item> </template
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
                  <v-btn
                    class="secondary"
                    data-testid="discard-role-button"
                    >{{ $t('admin.role.discard') }}</v-btn
                  >
                </v-col>
                <v-col
                  cols="12"
                  md="auto"
                >
                  <v-btn
                    type="submit"
                    class="primary button"
                    data-testid="create-role-button"
                  >
                    {{ $t('admin.role.create') }}
                  </v-btn>
                </v-col>
              </v-row>
            </template>
          </v-form>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style>
  .v-select {
    width: 310px;  
  }

  .v-text-field {
    width: 310px;
  }

  @media (min-width: 960px) {
    .md-text-right {
      text-align: right;
    }
  }
</style>
