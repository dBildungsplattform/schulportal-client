<script setup lang="ts">
  import TheFooter from '@/components/footer/TheFooter.vue'
  import LoginCard from '@/components/cards/LoginCard.vue'
</script>

<template>
  <v-container
    fill-height
    fluid
  >
    <v-row justify="center">
      <v-col
        cols="12"
        sm="8"
        md="6"
      >
        <LoginCard />
      </v-col>
    </v-row>
  </v-container>

  <TheFooter />
</template>

<style></style>
