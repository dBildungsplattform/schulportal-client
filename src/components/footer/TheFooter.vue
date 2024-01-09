<script setup lang="ts">
  import { ref } from 'vue'
  import SH_LOGO from '@/assets/logos/landesdachmarke_01_KORR.svg'

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
    { src: 'path-to-sponsor-logo2.png', alt: 'DigitalPakt Schule' },
    { src: SH_LOGO, alt: 'Schleswig-Holstein' }
  ])
</script>

<template>
  <v-footer
    class="footer"
    padless
    height="10"
  >
    <v-container >
      <v-row justify="space-between">
        <!-- Footer Links -->
        <v-col
          cols="12"
          md="6"
          sx="4"
          class="d-flex align-end"
        >
          <v-btn
            v-for="link in footerLinks"
            :key="link.text"
            small
            variant="text"
            color="#001E49"
          >
            {{ link.text }}
          </v-btn>
        </v-col>

        <!-- Sponsor Logos -->
        <v-col
          cols="12"
          md="6"
          class="sponsors d-flex justify-end hidden-sm-and-down"
        >
          <div class="sponsor-logos">
            <v-img
              v-for="sponsor in sponsors"
              :key="sponsor.alt"
              :src="sponsor.src"
              :alt="sponsor.alt"
              width="250"
              contain
              class="sponsor-logo"
            />
          </div>
        </v-col>
      </v-row>
    </v-container>
    <v-bottom-navigation
      class="bottom-navigation"
      :elevation="1"
      height="30"
    >
    </v-bottom-navigation>
  </v-footer>
</template>

<style scoped>
  .footer {
    background-image: linear-gradient(to bottom right, #ffffff 25%, transparent 25%),
      linear-gradient(180deg, rgba(229, 234, 239, 1) 100%, transparent 100%);

    background-repeat: no-repeat, no-repeat;

    background-size:
      200% 100%,
      100% 100%;
  }

  .bottom-navigation {
    background-color: #001e49;
  }
  .v-btn {
    text-transform: none;
  }
  .v-btn:hover {
    text-decoration: underline;
  }

  .sponsor-logos {
    display: flex;
    justify-content: flex-end; /* Aligns the logos to the right */
  }

  .sponsor-logo {
    
    max-width: 100%; /* Ensure logos are responsive and fit within their container */
    height: auto; /* Maintain aspect ratio */
  }
</style>
