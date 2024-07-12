<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import SoftwareTokenWorkflow from './SoftwareTokenWorkflow.vue';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const selectedOption: Ref<'software' | 'hardware'> = ref('software');

  const proceeded: Ref<boolean> = ref(false);

  const dialogHeader = ref('default');

  type Props = {
    errorCode: string;
    disabled: boolean;
    person: Personendatensatz;
  };

  defineProps<Props>();

  async function close2FADialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
    proceeded.value = false;
    selectedOption.value = 'software';
    dialogHeader.value = 'default';
  }

  async function incWorkflow(): Promise<void> {
    proceeded.value = true;
  }

  async function handleHeaderUpdate(header: string): Promise<void> {
    dialogHeader.value = header;
  }
</script>

<template>
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <v-col
        cols="12"
        sm="6"
        md="auto"
      >
        <SpshTooltip
          :enabledCondition="!disabled"
          :disabledText="$t('person.finishEditFirst')"
          :enabledText="$t('admin.person.twoFactorAuthentication.setUpShort')"
          position="start"
        >
          <v-btn
            class="primary"
            data-testid="open-2FA-dialog-icon"
            :block="mdAndDown"
            :disabled="disabled"
            v-bind="props"
          >
            {{ $t('admin.person.twoFactorAuthentication.setUpShort') }}
          </v-btn>
        </SpshTooltip>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="dialogHeader"
        @onCloseClicked="close2FADialog(isActive)"
      >
        <v-card-text v-if="!proceeded">
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col>
                <v-radio-group v-model="selectedOption">
                  <v-radio
                    :label="$t('admin.person.twoFactorAuthentication.softwareTokenOption')"
                    value="software"
                  ></v-radio>
                  <v-radio
                    :label="$t('admin.person.twoFactorAuthentication.hardwareTokenOption')"
                    value="hardware"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <p
                  class="text-body"
                  v-if="selectedOption === 'software'"
                >
                  {{ $t('admin.person.twoFactorAuthentication.softwareTokenText') }}
                </p>
                <p
                  class="text-body"
                  v-if="selectedOption === 'hardware'"
                >
                  {{ $t('admin.person.twoFactorAuthentication.hardwareTokenText') }}
                </p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-container v-if="proceeded">
          <SoftwareTokenWorkflow
            v-if="selectedOption === 'software'"
            @updateHeader="handleHeaderUpdate"
          ></SoftwareTokenWorkflow>
        </v-container>
        <v-card-actions
          class="justify-center"
          v-if="!proceeded"
        >
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary button"
                @click.stop="close2FADialog(isActive)"
                data-testid="close-two-way-authentification-dialog-button"
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
                :block="mdAndDown"
                class="primary button"
                @click.stop="incWorkflow()"
                data-testid="two-way-authentification-set-up-button"
              >
                {{ $t('proceed') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
