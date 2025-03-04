<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { MeldungStatus, useMeldungStore, type Meldung, type MeldungStore } from '@/stores/MeldungStore';
  import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import FormWrapper from '@/components/form/FormWrapper.vue';

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay();
  const meldungStore: MeldungStore = useMeldungStore();
  const newsboxMeldung: ComputedRef<Meldung> = computed(
    () => meldungStore.meldungen[0] ?? { text: '', status: MeldungStatus.NICHT_VEROEFFENTLICHT },
  );

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      meldungText: string().max(2000, t('admin.hinweise.validation.max')),
    }),
  );

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type NewsboxForm = {
    meldungText: string;
  };

  const { defineField, handleSubmit, resetForm }: FormContext = useForm<NewsboxForm>({
    validationSchema,
  });

  const [meldungText, meldungTextProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('meldungText', vuetifyConfig);

  const btnText: ComputedRef<string> = computed(() => {
    return newsboxMeldung.value.status == MeldungStatus.NICHT_VEROEFFENTLICHT
      ? t('admin.hinweise.publish')
      : t('admin.hinweise.publishEnd');
  });

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    meldungStore.createOrUpdateMeldung({
      ...newsboxMeldung.value,
      text: meldungText.value,
      status:
        newsboxMeldung.value.status == MeldungStatus.NICHT_VEROEFFENTLICHT
          ? MeldungStatus.VEROEFFENTLICHT
          : MeldungStatus.NICHT_VEROEFFENTLICHT,
    });
  });

  const onCloseDialog = (): void => {
    window.history.back();
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    meldungStore.errorCode = '';
  }

  const refreshPage = (): void => {
    router.go(0);
  };

  const formWasChanged = (): boolean => {
    return meldungText.value !== newsboxMeldung.value.text;
  };

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (formWasChanged()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onMounted(async () => {
    await meldungStore.getAllMeldungen();
    meldungText.value = newsboxMeldung.value.text;
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (formWasChanged()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :header="$t('admin.hinweise.hinweiseTexte')"
      :closable="true"
      :padded="true"
      :showCloseText="true"
      @onCloseClicked="onCloseDialog"
    >
      <FormWrapper
        v-if="!meldungStore.errorCode"
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.schultraeger.create')"
        :discardButtonLabel="$t('admin.schultraeger.discard')"
        :hideActions="true"
        id="newsbox-form"
        :onSubmit="onSubmit"
        :onDiscard="resetForm"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
        @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
      >
        <SpshAlert
          :model-value="!!meldungStore.errorCode"
          :title="$t(`admin.hinweise.title.${meldungStore.errorCode}`)"
          :type="'error'"
          :closable="false"
          :text="$t(`admin.hinweise.errors.${meldungStore.errorCode}`)"
          :showButton="true"
          :buttonText="t('refreshData')"
          :buttonAction="refreshPage"
        />
        <v-row>
          <v-col :cols="$vuetify.display.smAndDown ? 12 : 3">
            <h3 class="headline-3">{{ $t('admin.hinweise.newsbox') }}</h3>
          </v-col>
          <v-col :cols="$vuetify.display.smAndDown ? 12 : 9">
            <v-textarea
              v-bind="meldungTextProps"
              v-model="meldungText"
              variant="outlined"
              rows="5"
              placeholder="Newsbox"
              auto-grow
              counter
              maxlength="2000"
            ></v-textarea>
          </v-col>
        </v-row>

        <v-row justify="end">
          <v-col
            cols="12"
            sm="12"
            md="auto"
          >
            <v-btn
              :block="smAndDown"
              :disabled="meldungStore.loading"
              color="primary"
              type="submit"
              @click="onSubmit"
              >{{ btnText }}</v-btn
            >
          </v-col>
        </v-row>
      </FormWrapper>
    </LayoutCard>
  </div>
</template>

<style></style>
