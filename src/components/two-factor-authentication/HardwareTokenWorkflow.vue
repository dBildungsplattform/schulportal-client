<script setup lang="ts">
  import { useDisplay } from 'vuetify';
  import FormRow from '@/components/form/FormRow.vue';
  import { ref, type Ref } from 'vue';
  import { usePersonStore, type Personendatensatz, type PersonStore } from '@/stores/PersonStore';
  import axios from 'axios';
  import { useI18n, type Composer } from 'vue-i18n';
  import type { AssignHardwareTokenBodyParams } from '@/api-client/generated';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const dialogText: Ref<string> = ref('');
  const hardwareTokenIsAssigned: Ref<boolean> = ref(false);
  const errorThrown: Ref<boolean> = ref(false);
  const personStore: PersonStore = usePersonStore();

  type Emits = {
    (event: 'updateHeader', header: string): void;
    (event: 'onCloseClicked'): void;
  };

  const emits: Emits = defineEmits<{
    (event: 'updateHeader', header: string): void;
    (event: 'onCloseClicked'): void;
  }>();
  emits('updateHeader', 'Hardware-Token zuordnen');

  const serial: Ref<string> = ref('');
  const otp: Ref<string> = ref('');

  type Props = {
    errorCode: string;
    person: Personendatensatz;
  };
  const props: Props = defineProps<Props>();

  function handleApiError(error: unknown): void {
    errorThrown.value = true;
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.data) {
        const message: string = error.response.data.message || 'An unexpected error occurred.';
        dialogText.value = message;
      } else {
        dialogText.value = 'An unexpected error occurred.';
      }
    }
  }

  function cancelCheck(): void {
    if (errorThrown.value) {
      serial.value = '';
      otp.value = '';
      dialogText.value = '';
      hardwareTokenIsAssigned.value = false;
      errorThrown.value = false;
      emits('updateHeader', 'Hardware-Token zuordnen');
    } else {
      emits('onCloseClicked');
    }
  }

  async function assignHardwareToken(): Promise<void> {
    if (!props.person.person.referrer) return;
    try {
      const assignHardwareTokenBodyParams: AssignHardwareTokenBodyParams = {
        serial: serial.value,
        otp: otp.value,
        referrer: props.person.person.referrer,
        userId: props.person.person.id,
      };
      await personStore.assignHardwareToken(assignHardwareTokenBodyParams);
      dialogText.value = t('admin.person.twoFactorAuthentication.hardwareTokenSetUpSuccess');
    } catch (error) {
      emits('updateHeader', t('admin.person.twoFactorAuthentication.hardwareTokenSetUpFailure'));
      handleApiError(error);
    } finally {
      hardwareTokenIsAssigned.value = true;
    }
  }
</script>

<template v-slot:activator="{ props }">
  <v-container v-if="!hardwareTokenIsAssigned">
    <v-col md="10">
      <FormRow
        :errorLabel="''"
        labelForId="serial-input"
        :isRequired="true"
        :label="'Seriennummer'"
      >
        <v-text-field
          clearable
          data-testid="hardwareToken-input"
          density="compact"
          :disabled="false"
          id="hardwareToken-input"
          :placeholder="'Seriennummer'"
          ref="hardwareToken-input"
          required="true"
          variant="outlined"
          v-model="serial"
        ></v-text-field>
      </FormRow>
      <FormRow
        :errorLabel="''"
        labelForId="otp-input"
        :isRequired="true"
        :label="'Aktuell angezeigter Code'"
      >
        <v-text-field
          clearable
          data-testid="hardwareToken-input"
          density="compact"
          :disabled="false"
          id="hardwareToken-input"
          :placeholder="'Code'"
          ref="hardwareToken-input"
          required="true"
          variant="outlined"
          v-model="otp"
        ></v-text-field>
      </FormRow>
    </v-col>
  </v-container>
  <v-container v-if="hardwareTokenIsAssigned">
    <v-row class="justify-center">{{ dialogText }}</v-row>
  </v-container>
  <v-card-actions class="justify-center">
    <v-row class="justify-center">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          :block="mdAndDown"
          :class="hardwareTokenIsAssigned ? 'primary button' : 'secondary button'"
          @click="cancelCheck()"
          data-testid="close-two-way-authentification-dialog-button"
        >
          {{ hardwareTokenIsAssigned ? $t('close') : $t('cancel') }}
        </v-btn>
      </v-col>
      <v-col
        v-if="!hardwareTokenIsAssigned"
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          class="primary button"
          :block="mdAndDown"
          data-testid="two-way-authentification-set-up-button"
          @click="assignHardwareToken()"
          :disabled="!serial || !otp"
        >
          {{ $t('admin.person.twoFactorAuthentication.setUp') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card-actions>
</template>
<style></style>
