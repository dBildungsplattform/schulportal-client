<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { ref, type Ref } from 'vue'

  type Selection = string | null
  type SelectionArray = string[]

  const selectedStructureNode: Ref<Selection> = ref(null)
  const selectedRoleType: Ref<Selection> = ref(null)
  const selectedRoleName: Ref<Selection> = ref(null)
  const selectedCharacteristics: Ref<Selection> = ref(null)

  const structureNodes: SelectionArray = [
    'Primary Education',
    'Secondary Education',
    'Higher Education'
  ]
  const roleTypes: SelectionArray = ['LERN', 'LEHR', 'EXTERN', 'ORGADMIN', 'LEIT', 'SYSADMIN']
  const characteristics: SelectionArray = ['BEFRISTUNG_PFLICHT', 'KOPERS_PFLICHT']
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
      :header="$t('admin.role.addNewRole')"
      :padded="true"
      :showCloseText="true"
    >
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
            <h3 class="text-body">
              {{ $t('admin.role.chooseSchoolStructureNode') + '*' }}
            </h3></v-col
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
            <h3 class="text-body">
              {{ $t('admin.role.chooseRoleType') + '*' }}
            </h3></v-col
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
              <h3 class="subtitle-2">3. {{ $t('admin.role.enterRoleName') }}</h3>
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
                {{ $t('admin.role.enterRoleName') + '*' }}
              </h3></v-col
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
              <h3 class="subtitle-2">4. {{ $t('admin.role.chooseCharacteristics') }}</h3>
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
                class="primary button"
                data-testid="open-password-reset-dialog-icon"
              >
                {{ $t('admin.role.addNewRoleButton') }}
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </v-container>
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
