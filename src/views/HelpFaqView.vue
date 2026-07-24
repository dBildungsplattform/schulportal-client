<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n({ useScope: 'global' });

  const breadcrumbItems = computed(() => [
    { title: t('nav.portalName'), to: '/' },
    { title: t('help.title'), to: '/hilfe' },
    { title: t('help.faq.title'), disabled: true },
  ]);
</script>

<template>
  <v-container
    class="py-8"
    fluid
  >
    <v-row justify="center">
      <v-col
        cols="12"
        md="10"
        lg="8"
      >
        <!-- Breadcrumbs -->
        <div class="mb-4">
          <v-breadcrumbs
            :items="breadcrumbItems"
            class="px-0 py-0 text-medium-emphasis text-caption text-sm-body-2"
          ></v-breadcrumbs>
        </div>

        <h1 class="text-h4 mb-2 font-weight-bold">{{ t('help.faq.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">
          {{ t('help.faq.subtitle') }}
        </p>

        <!-- FAQs Expansion Panels -->
        <v-expansion-panels
          variant="accordion"
          class="mb-8"
        >
          <v-expansion-panel
            v-for="n in 6"
            :key="n"
          >
            <v-expansion-panel-title class="font-weight-bold text-body-2 py-3">
              {{ t(`help.faq.q${n}`) }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="text-body-2 text-medium-emphasis pt-2 pb-2">
              {{ t(`help.faq.a${n}`) }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Back Button -->
        <v-row justify="center">
          <v-btn
            color="primary"
            variant="outlined"
            class="text-none px-6 font-weight-bold rounded-lg"
            data-testid="back-button"
            to="/"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            {{ t('nav.backToStart') }}
          </v-btn>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
