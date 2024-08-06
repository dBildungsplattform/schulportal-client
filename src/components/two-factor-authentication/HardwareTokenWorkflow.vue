<script setup lang="ts">
  import { useDisplay } from 'vuetify';
  import FormRow from '@/components/form/FormRow.vue';
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { usePersonStore, type Personendatensatz, type PersonStore } from '@/stores/PersonStore';
  import axios from 'axios';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const dialogText: Ref<string> = ref('');
  const proceeded: Ref<boolean> = ref(false);
  const errorThrown: Ref<boolean> = ref(false);
  const personStore: PersonStore = usePersonStore();
  // eslint-disable-next-line @typescript-eslint/typedef
  const emits = defineEmits(['updateHeader', 'onCloseClicked']);
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
      proceeded.value = false;
      errorThrown.value = false;
    } else {
      emits('onCloseClicked');
    }
  }

  async function assignHardwareToken(): Promise<void> {
    const referrer: string | null = props.person.person.referrer;
    if (!referrer) return; // TBD
    try {
      await personStore.assignHardwareToken(referrer, serial.value, otp.value);
      dialogText.value = 'Token wurde erfolgreich zugeordnet.';
    } catch (error) {
      emits('updateHeader', 'Fehler bei Zuordnung des Hardware-Tokens');
      handleApiError(error);
    } finally {
      proceeded.value = true;
    }
  }
</script>

<template v-slot:activator="{ props }">
  <v-container v-if="!proceeded">
    <v-col md="10">
      <FormRow
        :errorLabel="''"
        labelForId="serial-input"
        :isRequired="true"
        :label="'Seriennummer'"
      >
        <v-text-field
          clearable
          data-testid="rollenname-input"
          density="compact"
          :disabled="false"
          id="rollenname-input"
          :placeholder="'Seriennummer'"
          ref="rollenname-input"
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
          data-testid="rollenname-input"
          density="compact"
          :disabled="false"
          id="rollenname-input"
          :placeholder="'Code'"
          ref="rollenname-input"
          required="true"
          variant="outlined"
          v-model="otp"
        ></v-text-field>
      </FormRow>
    </v-col>
  </v-container>
  <v-container v-if="proceeded">
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
          :class="proceeded ? 'primary button' : 'secondary button'"
          @click="cancelCheck()"
          data-testid="close-two-way-authentification-dialog-button"
        >
          {{ proceeded ? 'Schließen' : $t('cancel') }}
        </v-btn>
      </v-col>
      <v-col
        v-if="!proceeded"
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
          Einrichten
        </v-btn>
      </v-col>
    </v-row>
  </v-card-actions>
</template>
<style></style>
