<script setup lang="ts">
  import { ref } from 'vue'

  // Define your footer links and their navigation routes
  const footerLinks = ref([
    { text: 'Kontakt', route: '/contact' },
    { text: 'Hilfe', route: '/help' },
    { text: 'Impressum', route: '/legal-notice' },
    { text: 'Datenschutzerklärung', route: '/privacy-policy' },
    { text: 'Barrierefreiheit', route: '/accessibility' }
  ])

  // Define the sponsor logos and their sources
  const sponsors = ref([
    { src: 'path-to-sponsor-logo1.png', alt: 'Sponsor 1' },
    { src: 'path-to-sponsor-logo2.png', alt: 'DigitalPakt Schule' },
    { src: 'path-to-sponsor-logo3.png', alt: 'Schleswig-Holstein' }
    // Add more sponsors as needed
  ])
</script>

<template>
  <v-footer
    fixed
    padless
  >
    <v-container fluid>
      <v-row justify="space-between">
        <!-- Footer Links -->
        <v-col
          cols="12"
          md="6"
        >
          <v-btn
            small
            class="footer-link"
            v-for="link in footerLinks"
            :key="link.text"
          >
            {{ link.text }}
          </v-btn>
        </v-col>

        <!-- Sponsor Logos -->
        <v-col
          cols="12"
          md="6"
          class="sponsors"
        >
          <v-img
            v-for="sponsor in sponsors"
            :key="sponsor.alt"
            :src="sponsor.src"
            :alt="sponsor.alt"
            contain
            class="sponsor-logo"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>
