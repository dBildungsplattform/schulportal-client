<script setup lang="ts">
  import { useI18n, type Composer } from 'vue-i18n';
  import type { BaseFieldProps } from 'vee-validate';
  import KopersInput from '@/components/admin/personen/KopersInput.vue';
  import { type Ref, ref } from 'vue';
  import FormRow from '@/components/form/FormRow.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });

  type Props = {
    hasKopersRolle: boolean;
    selectedKopersNrMetadataProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKopersNrMetadata: string | undefined;
    selectedVornameProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedVorname: string | undefined;
    selectedFamiliennameProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedFamilienname: string | undefined;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'update:selectedKopersNrMetadata', value: string | undefined | null): void;
    (event: 'update:selectedVorname', value: string | undefined): void;
    (event: 'update:selectedFamilienname', value: string | undefined): void;
    (event: 'onShowDialogChange', value?: boolean): void;
  };
  const emits: Emits = defineEmits<Emits>();

  const selectedVorname: Ref<string | undefined> = ref(props.selectedVorname);
  const selectedFamilienname: Ref<string | undefined> = ref(props.selectedFamilienname);

  function handleSelectedKopersNrUpdate(value: string | undefined | null): void {
    emits('update:selectedKopersNrMetadata', value);
  }

  function handleSelectedVorname(value: string): void {
    emits('update:selectedVorname', value);
  }

  function handSelectedFamilienname(value: string): void {
    emits('update:selectedFamilienname', value);
  }

  type IQSHLink = {
    text: string;
    href: string;
    external: boolean;
  };

  const link: Ref<IQSHLink> = ref({
    text: t('admin.person.homePageIQSH'),
    href: 'https://medienberatung.iqsh.de/schulportal-sh.html',
    external: true,
  });
</script>

<template>
  <div>
    <v-row>
      <v-col
        md="5"
        xs="12"
        cols="12"
        class="pl-md-14"
      >
        <span class="text-body bold">
          <div>
            <v-icon
              aria-hidden="true"
              class="mr-2"
              icon="mdi-alert-circle-outline"
              size="small"
            />
            <span> {{ $t('admin.person.personalInfoChangeNotice') }} </span>
          </div>
          <div class="mt-4">
            <p>
              {{ $t('admin.person.personalInfoChangeNotice2') }}
              <span>
                <a
                  :href="link.href"
                  :target="link.external ? '_blank' : '_self'"
                >
                  {{ link.text }}</a
                >.
              </span>
            </p>
          </div>
        </span>
      </v-col>
      <v-col
        md="7"
        xs="12"
        cols="12"
        class="pr-md-14"
      >
        <!-- Vorname -->
        <FormRow
          class="mt-n4"
          :error-label="selectedVornameProps['error']"
          label-for-id="vorname-input"
          :is-required="true"
          :label="$t('person.firstName')"
        >
          <v-text-field
            id="vorname-input"
            ref="vorname-input"
            v-bind="selectedVornameProps"
            v-model="selectedVorname"
            clearable
            data-testid="vorname-input"
            density="compact"
            :placeholder="$t('person.enterFirstName')"
            required="true"
            variant="outlined"
            @update:model-value="handleSelectedVorname"
          />
        </FormRow>

        <!-- Nachname -->
        <FormRow
          class="mb-4"
          :error-label="selectedFamiliennameProps['error']"
          label-for-id="familienname-input"
          :is-required="true"
          :label="$t('person.lastName')"
        >
          <v-text-field
            id="familienname-input"
            ref="familienname-input"
            v-bind="selectedFamiliennameProps"
            v-model="selectedFamilienname"
            clearable
            data-testid="familienname-input"
            density="compact"
            :placeholder="$t('person.enterLastName')"
            required="true"
            variant="outlined"
            @update:model-value="handSelectedFamilienname"
          />
        </FormRow>
        <KopersInput
          v-if="hasKopersRolle"
          :hide-checkbox="true"
          :selected-kopers-nr="selectedKopersNrMetadata"
          :selected-kopers-nr-props="selectedKopersNrMetadataProps"
          @update:selected-kopers-nr="handleSelectedKopersNrUpdate"
        />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
  span {
    white-space: normal;
    text-wrap: pretty;
  }
</style>
