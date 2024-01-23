<script setup lang="ts">
  const props = defineProps<{
    showAlert: boolean
    title: string
    text: string
    showButton: boolean
    buttonText: string
    buttonClass: string
    buttonAction: Function
    type: 'error' | 'success' | 'warning' | 'info' | undefined
    closable?: boolean
  }>()
</script>

<template>
  <v-container
    v-if="props.showAlert"
    class="personal-info"
  >
    <v-slide-y-transition>
      <v-alert
        :type="props.type"
        variant="outlined"
        :closable="props.closable"
      >
        <v-row>
          <v-col
            cols="auto"
            style="color: #001e49"
          >
            <strong>{{ props.title }}</strong>
          </v-col>
        </v-row>
        <v-row>
          <v-col
            cols="auto"
            style="color: #001e49"
          >
            {{ props.text }}
          </v-col>
        </v-row>
        <v-row
          v-if="props.showButton"
          justify="center"
        >
          <v-col cols="auto">
            <v-btn
              :class="props.buttonClass"
              @click="props.buttonAction"
            >
              {{ props.buttonText }}
            </v-btn>
          </v-col>
        </v-row>
      </v-alert>
    </v-slide-y-transition>
  </v-container>
</template>

<style scoped>
  .v-alert {
    border-width: 3px;
  }
</style>
