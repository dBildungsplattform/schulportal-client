<script setup lang="ts">
  import { useI18n, type Composer } from 'vue-i18n';
  const { t }: Composer = useI18n({ useScope: 'global' });
</script>

<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
      >
        <div>
          <h1>{{ t('help.faq.title') }}</h1>
          <p>{{ t('help.faq.description') }}</p>
        </div>

        <div>
          <h1>{{ t('help.faq.accountTitle') }}</h1>
          <p>{{ t('help.faq.accountDescription') }}</p>
        </div>

        <div>
          <h1>{{ t('help.faq.passwordTitle') }}</h1>
          <p>{{ t('help.faq.passwordDescription') }}</p>
        </div>
      </v-col>
    </v-row>
    <v-divider class="my-8"></v-divider>
    <v-row justify="center">
      <v-btn
        class="primary"
        data-testid="back-button"
        :href="'/hilfe'"
      >
        {{ $t('nav.backToHelp') }}
      </v-btn>
    </v-row>
  </v-container>
</template>
