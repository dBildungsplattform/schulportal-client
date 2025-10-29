<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { print } from '@/utils/print';

  import SpshTooltip from '@/components/admin/SpshTooltip.vue';

  type Props = {
    password: string;
    showPrintIcon?: boolean;
  };

  const props: Props = defineProps<Props>();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const copyToClipboardError: Ref<string> = ref('');
  const passwordCopied: Ref<boolean> = ref(false);
  const showPassword: Ref<boolean> = ref(false);

  function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        passwordCopied.value = true;
        copyToClipboardError.value = '';
      },
      (error: unknown) => {
        // eslint-disable-next-line no-console
        console.log(error);
        copyToClipboardError.value = t('admin.person.copyPasswordError');
      },
    );
  }
  function printPassword(): void {
    print(t('admin.person.password'), props.password);
  }
</script>

<template>
  <v-text-field
    v-if="password"
    :aria-label="$t('admin.person.generatedPassword')"
    data-testid="password-output-field"
    :error-messages="copyToClipboardError"
    :hint="passwordCopied ? $t('admin.person.copyPasswordSuccess') : ''"
    :persistent-hint="passwordCopied"
    readonly
    :type="showPassword ? 'text' : 'password'"
    :value="password"
    variant="outlined"
  >
    <template #append-inner>
      <SpshTooltip
        :enabled-condition="showPassword"
        :disabled-text="$t('showPassword')"
        :enabled-text="$t('hidePassword')"
        position="start"
      >
        <v-icon
          data-testid="show-password-icon"
          :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          tabindex="0"
          @click.stop="showPassword = !showPassword"
          @keyup.enter="showPassword = !showPassword"
          @keyup.space="showPassword = !showPassword"
        />
      </SpshTooltip>
    </template>
    <template #append>
      <SpshTooltip
        :enabled-condition="true"
        :disabled-text="$t('copyPassword')"
        :enabled-text="$t('copyPassword')"
        position="start"
      >
        <v-icon
          data-testid="copy-password-icon"
          icon="mdi-content-copy"
          tabindex="0"
          @click.stop="copyToClipboard(password)"
          @keyup.enter="copyToClipboard(password)"
          @keyup.space="copyToClipboard(password)"
        />
      </SpshTooltip>
      <SpshTooltip
        v-if="props.showPrintIcon"
        :enabled-condition="true"
        :disabled-text="$t('admin.person.printPassword')"
        :enabled-text="$t('admin.person.printPassword')"
        position="start"
      >
        <v-icon
          data-testid="print-password-icon"
          icon="mdi-printer-outline"
          tabindex="0"
          class="ml-1"
          @click.stop="printPassword()"
          @keyup.enter="printPassword()"
          @keyup.space="printPassword()"
        />
      </SpshTooltip>
    </template>
  </v-text-field>
</template>

<style></style>
