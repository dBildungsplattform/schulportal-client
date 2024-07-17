<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { usePersonStore, type Personendatensatz, type PersonStore } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import { useI18n, type Composer } from 'vue-i18n';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const proceeded : Ref<boolean> = ref(false);
  const isTokenResetSuccessful  : Ref<boolean> = ref(false);
  const isTokenLost : Ref<boolean> = ref(false);
  const personStore: PersonStore = usePersonStore();


  type Props = {
    errorCode: string;
    disabled: boolean;
    person: Personendatensatz;
    tokenType: string; 
  };

  const props = defineProps<Props>();
    async function closeTokenResetDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
    isTokenLost.value = false;
    isTokenResetSuccessful.value = false;
    proceeded.value = false;
  }

  async function tokenReset() {
    try {
      const referrer = props.person.person.referrer;
      if(!referrer) return ; // TBD
      await personStore.resetToken(referrer);
      isTokenResetSuccessful.value = true;
    } catch (error) {
      console.error('An error occurred during token reset:', error);
    } finally {
      proceeded.value = true;
    }
  }

  type DialogContent = {
    header: string, 
    text: string
  }

  const defaultContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentification.tokenResetHeader'),
    text: ""
  }
  const errorHardwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentification.tokenResetHardwareErrorHeader'),
    text: t('admin.person.twoFactorAuthentification.tokenResetError')
  }
  
  const errorSoftwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentification.tokenResetSoftwareErrorHeader'),
    text: t('admin.person.twoFactorAuthentification.tokenResetError')
  }

  const tokenLostContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentification.tokenResetHeader'),
    text: t('admin.person.twoFactorAuthentification.tokenResetSuccessTokenLost')
  }
  const tokenResetSoftwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentification.tokenResetHeader'),
    text: t('admin.person.twoFactorAuthentification.tokenResetSuccessSoftware')
  }

  const tokenResetHardwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentification.tokenResetHeader'),
    text: t('admin.person.twoFactorAuthentification.tokenResetSuccessHardware')
  }

  const createDialogueText:() => DialogContent = () => {
    if(proceeded.value){
      if(!isTokenResetSuccessful.value && props.tokenType === "hardware"){
        return errorHardwareContent;
      }else if(!isTokenResetSuccessful.value && props.tokenType === "software"){
        return errorSoftwareContent;
      }else if(isTokenLost.value){
        return tokenLostContent;
      } else if(props.tokenType === "software"){
        return tokenResetSoftwareContent
      } else if(props.tokenType === "hardware"){
        return tokenResetHardwareContent
      }
    }
    return defaultContent;
  };

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
          :enabledText="$t('admin.person.twoFactorAuthentification.tokenResetHeader')"
          position="start"
        >
          <v-btn
            class="primary"
            data-testid="open-2FA-dialog-icon"
            :block="mdAndDown"
            :disabled="disabled"
            v-bind="props"
          >
            Token Reset Test
          </v-btn>
        </SpshTooltip>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="createDialogueText().header"
        @onCloseClicked="closeTokenResetDialog(isActive)"
      >
        <v-card-text>
          <v-container v-if="!proceeded">
            <v-row class="text-body px-md-16">
                <v-col class="whiteSpace">
                    {{$t('admin.person.twoFactorAuthentification.tokenResetDescription')}}
                </v-col>
            </v-row>
            <v-row class="text-body px-md-16"> 
                <v-col>
                    <v-checkbox
                      v-model="isTokenLost"
                      value="false"
                    >
                        <template v-slot:label>
                            <span id="checkboxLabel">{{$t('admin.person.twoFactorAuthentification.tokenResetTokenLost')}}</span>
                        </template>
                    </v-checkbox>
                </v-col>
            </v-row>
          </v-container>
          <v-container v-if="proceeded">
            <v-row class="text-body px-md-16">
                <v-col class="whiteSpace">
                  {{ createDialogueText().text }}
                </v-col>
            </v-row>
          </v-container>

        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col v-if="!proceeded"
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary button"
                @click.stop="closeTokenResetDialog(isActive)"
                data-testid="close-two-way-authentification-dialog-button"
              >
                {{ $t('cancel')}}
              </v-btn>
            </v-col>
            <v-col v-if="!proceeded"
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                @click="tokenReset()"
                :block="mdAndDown"
                class="primary button"
                data-testid="two-way-authentification-set-up-button"              >
                {{ $t('admin.person.twoFactorAuthentification.tokenResetButton') }}
              </v-btn>
            </v-col>
            <v-col v-if="proceeded"
              cols="12"
              sm="6"
              md="4"
            >
            <v-btn
                @click.stop="closeTokenResetDialog(isActive)"
                :block="mdAndDown"
                class="primary button"
                data-testid="two-way-authentification-set-up-button"              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style>
.whiteSpace{
   white-space: pre-line
}
</style>
