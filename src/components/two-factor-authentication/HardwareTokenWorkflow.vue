<script setup lang="ts">
  import FormRow from '@/components/form/FormRow.vue';
  import { onMounted, onUnmounted, ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import type { AssignHardwareTokenBodyParams } from '@/api-client/generated';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { onBeforeRouteLeave, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import { useDisplay } from 'vuetify';
  import type { Personendatensatz } from '@/stores/PersonStore';
  import { watch } from 'vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const dialogText: Ref<string> = ref('');
  const hardwareTokenIsAssigned: Ref<boolean> = ref(false);
  const twoFactoreAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Emits = {
    (event: 'updateHeader', header: string): void;
    (event: 'onCloseClicked'): void;
  };

  const emits: Emits = defineEmits<{
    (event: 'updateHeader', header: string): void;
    (event: 'onCloseClicked'): void;
  }>();
  emits('updateHeader', t('admin.person.twoFactorAuthentication.hardwareTokenOption'));

  type Props = {
    errorCode: string;
    person: Personendatensatz;
  };

  type HardwareTokenFormType = {
    selectedSeriennummer: string;
    selectedOtp: string;
  };

  const props: Props = defineProps<Props>();

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSeriennummer: string().required(t('admin.person.twoFactorAuthentication.serialNotSelected')),
      selectedOtp: string()
        .required(t('admin.person.twoFactorAuthentication.otpNotSelected'))
        .max(6, t('admin.person.twoFactorAuthentication.otpLengthInvalid')),
    }),
  );

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<HardwareTokenFormType>({
    validationSchema,
  });

  const getVuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);

  const [selectedSeriennummer, selectedSeriennummerProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSeriennummer', vuetifyConfig);

  const [selectedOtp, selectedOtpProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedOtp', vuetifyConfig);

  function cancelCheck(): void {
    if (twoFactoreAuthentificationStore.errorCode) {
      twoFactoreAuthentificationStore.errorCode = '';
      dialogText.value = '';
      hardwareTokenIsAssigned.value = false;
      selectedOtp.value = '';
      selectedOtpProps.value.error = false;
      selectedOtpProps.value['error-messages'] = [];
      emits('updateHeader', t('admin.person.twoFactorAuthentication.hardwareTokenOption'));
    } else {
      emits('onCloseClicked');
    }
  }

  function isFormDirty(): boolean {
    return isFieldDirty('selectedSeriennummer') || isFieldDirty('selectedOtp');
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  onMounted(async () => {
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });

  watch(
    () => twoFactoreAuthentificationStore.errorCode,
    (newValue: string) => {
      if (newValue) {
        emits('updateHeader', t('admin.person.twoFactorAuthentication.hardwareTokenSetUpFailure'));
      }
    },
  );

  async function assignHardwareToken(): Promise<void> {
    if (!props.person.person.referrer) return;
    const assignHardwareTokenBodyParams: AssignHardwareTokenBodyParams = {
      serial: selectedSeriennummer.value,
      otp: selectedOtp.value,
      referrer: props.person.person.referrer,
      userId: props.person.person.id,
    };
    await twoFactoreAuthentificationStore.assignHardwareToken(assignHardwareTokenBodyParams);
    dialogText.value = t('admin.person.twoFactorAuthentication.hardwareTokenSetUpSuccess');
    resetForm();

    hardwareTokenIsAssigned.value = true;
  }
  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    assignHardwareToken();
  });
</script>

<template v-slot:activator="{ props }">
  <v-container v-if="!hardwareTokenIsAssigned">
    <FormWrapper
      :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
      :createButtonLabel="$t('admin.person.twoFactorAuthentication.setUp')"
      :discardButtonLabel="$t('cancel')"
      id="hardware-token-input"
      :onDiscard="cancelCheck"
      @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value ?? false)"
      :centerButtons="true"
      :onSubmit="onSubmit"
      :showUnsavedChangesDialog="showUnsavedChangesDialog"
    >
      <FormRow
        :errorLabel="''"
        labelForId="serial-input"
        :isRequired="true"
        :label="t('admin.person.twoFactorAuthentication.serial')"
      >
        <v-text-field
          clearable
          data-testid="hardware-token-input-serial"
          density="compact"
          :disabled="false"
          id="hardware-token-input"
          :placeholder="t('admin.person.twoFactorAuthentication.serial')"
          ref="hardware-token-input"
          required="true"
          variant="outlined"
          v-model="selectedSeriennummer"
          v-bind="selectedSeriennummerProps"
        ></v-text-field>
      </FormRow>
      <FormRow
        :errorLabel="''"
        labelForId="otp-input"
        :isRequired="true"
        :label="t('admin.person.twoFactorAuthentication.currentOtp')"
      >
        <v-text-field
          clearable
          data-testid="hardware-token-input-otp"
          density="compact"
          :disabled="false"
          id="hardware-token-input"
          :placeholder="t('admin.person.twoFactorAuthentication.otpPlaceholder')"
          ref="hardware-token-input"
          required="true"
          variant="outlined"
          v-model="selectedOtp"
          v-bind="selectedOtpProps"
        ></v-text-field>
      </FormRow>
    </FormWrapper>
  </v-container>
  <v-container v-if="hardwareTokenIsAssigned">
    <v-row v-if="twoFactoreAuthentificationStore.errorCode === 'HARDWARE_TOKEN_SERVICE_FEHLER'">
      <p
        class="text-body bold"
        data-testid="hardware-token-dialog-error-text"
      >
        <i18n-t
          keypath="admin.person.twoFactorAuthentication.errors.HARDWARE_TOKEN_SERVICE_FEHLER"
          for="admin.person.twoFactorAuthentication.errors.iqshHelpdesk"
          tag="label"
        >
          <a
            :href="$t('admin.person.twoFactorAuthentication.errors.iqshHelpdeskLink')"
            rel="noopener noreferrer"
            target="_blank"
            >{{ $t('admin.person.twoFactorAuthentication.errors.iqshHelpdesk') }}</a
          >
        </i18n-t>
      </p>
    </v-row>
    <v-row v-else-if="twoFactoreAuthentificationStore.errorCode">
      <p
        class="text-body bold"
        data-testid="hardware-token-dialog-error-text"
      >
        {{ $t('admin.person.twoFactorAuthentication.errors.' + twoFactoreAuthentificationStore.errorCode) }}
      </p></v-row
    >
    <v-row
      v-else
      class="justify-center text-body bold"
      >{{ dialogText }}</v-row
    >
  </v-container>
  <v-card-actions
    class="justify-center"
    v-if="twoFactoreAuthentificationStore.errorCode || hardwareTokenIsAssigned"
  >
    <v-row class="justify-center">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          :block="mdAndDown"
          class="primary button"
          @click="cancelCheck()"
          data-testid="close-two-way-authentification-dialog-button"
        >
          {{ hardwareTokenIsAssigned ? $t('close') : $t('cancel') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card-actions>
</template>
<style></style>
