<script setup lang="ts">
  import { ref } from 'vue'
  import SH_LOGO from '@/assets/logos/landesdachmarke_01_KORR.svg'
  import DIGITAL_PAKT from '@/assets/logos/digitalPakt.svg'

  // Define the footer links and their navigation routes
  const footerLinks = ref([
    { text: 'Kontakt', route: '/contact' },
    { text: 'Hilfe', route: '/help' },
    { text: 'Impressum', route: '/legal-notice' },
    { text: 'Datenschutzerklärung', route: '/privacy-policy' },
    { text: 'Barrierefreiheit', route: '/accessibility' }
  ])

  // Define the sponsor logos and their sources
  const sponsors = ref([
    { src: DIGITAL_PAKT, alt: 'DigitalPakt Schule' },
    { src: SH_LOGO, alt: 'Schleswig-Holstein' }
  ])
</script>

<template>
  <v-footer
    class="footer"
    padless
    height="10"
  >
    <v-container>
      <v-row>
        <!-- Sponsor Logos -->
        <v-col
          cols="12"
          md="6"
          order-md="2"
          class="sponsor-logos-col"
        >
          <div class="sponsor-logos-div">
            <v-img
              v-for="sponsor in sponsors"
              :key="sponsor.alt"
              :src="sponsor.src"
              :alt="sponsor.alt"
              width="200"
              contain
              class="sponsor-logo"
            />
          </div>
        </v-col>

        <!-- Footer Links -->
        <v-col
          cols="12"
          md="6"
          order-md="1"
          class="footer-links-col"
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
      </v-row>
    </v-container>
    <v-bottom-navigation
      class="bottom-navigation"
      :elevation="1"
      height="22"
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

  .v-btn {
    text-transform: none;
  }
  .v-btn:hover {
    text-decoration: underline;
  }

  .footer-links-col {
    display: flex;
    align-items: flex-end; /* Aligns the logos to the right */
  }

  .sponsor-logos-col {
    display: flex;
    justify-content: flex-end; /* Aligns the logos to the right */
  }

  .sponsor-logos-div {
    display: flex;
    position: relative;
  }

  .sponsor-logos-div::before {
    content: '';
    position: absolute;
    left: 50%; /* Adjust this value to move the line between the logos */
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #001e49;
    transform: translateX(-50%);
  }
  .sponsor-logo {
    height: auto; /* Maintain aspect ratio */
    margin: 0 10px; /* Adds some space between logos */
  }
  .bottom-navigation {
    background-color: #001e49;
  }

  @media (max-width: 1280px) {
    .sponsor-logo {
      width: 150px; /* Adjust the width of the logos */
    }
    .sponsor-logos-col,
    .footer-links-col {
      flex-wrap: wrap; /* Allow the items to wrap if needed */
      justify-content: center; /* Center the items if they wrap */
    }
  }
</style>
