<script setup lang="ts">
  import { ref, type Ref } from 'vue'
  import SH_LOGO from '@/assets/logos/landesdachmarke_01_KORR.svg'
  import DIGITAL_PAKT_LOGO from '@/assets/logos/digitalPakt.svg'
  import { type Composer, useI18n } from 'vue-i18n'

  const { t }: Composer = useI18n({ useScope: 'global' })

  type FooterLink = {
    text: string
    href: string
  }

  type Sponsor = {
    src: string
    alt: string
    href: string
  }

  const footerLinks: Ref<FooterLink[]> = ref([
    { text: t('footer.contact'), href: 'https://www.secure-lernnetz.de/helpdesk/' },
    { text: t('footer.help'), href: 'https://medienberatung.iqsh.de/schulportal-sh.html' },
    { text: t('footer.legalNotice'), href: 'impressum_datenschutzerklaerung.html' },
    {
      text: t('footer.privacyPolicy'),
      href: 'impressum_datenschutzerklaerung.html#privacy_policy'
    },
    { text: t('footer.accessibility'), href: 'impressum_datenschutzerklaerung.html#accessibility' }
  ])

  const sponsors: Ref<Sponsor[]> = ref([
    {
      src: DIGITAL_PAKT_LOGO,
      alt: 'Logo DigitalPakt Schule',
      href: 'https://www.digitalpaktschule.de/de/schleswig-holstein-1800.html'
    },
    {
      src: SH_LOGO,
      alt: 'Logo Schleswig-Holstein',
      href: 'https://www.schleswig-holstein.de/DE/landesportal/landesportal_node.html'
    }
  ])
</script>

<template>
  <v-footer
    class="footer"
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
            <template
              v-for="sponsor in sponsors"
              :key="sponsor.alt"
            >
              <!-- Logo with clickable link -->
              <a
                :href="sponsor.href"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-img
                  :src="sponsor.src"
                  :alt="sponsor.alt"
                  width="250"
                  contain
                  class="sponsor-logo"
                />
              </a>
            </template>
          </div>
        </v-col>

        <!-- Footer Links -->
        <v-col
          cols="12"
          md="6"
          order-md="1"
          class="footer-links-col justify-space-between"
        >
          <a
            v-for="link in footerLinks"
            :key="link.text"
            :href="link.href"
            rel="noopener noreferrer"
            target="_blank"
            >{{ link.text }}</a
          >
        </v-col>
      </v-row>
      <v-bottom-navigation
        class="bottom-navigation"
        :elevation="1"
        height="22"
      >
      </v-bottom-navigation>
    </v-container>
  </v-footer>
</template>

<style scoped>
  a {
    color: #001e49;
  }
  .footer {
    align-items: flex-end;
    bottom: 0;
    background-image: linear-gradient(to bottom right, #ffffff 25%, transparent 25%),
      linear-gradient(180deg, rgba(229, 234, 239, 1) 100%, transparent 100%);

    background-repeat: no-repeat, no-repeat;

    background-size:
      200% 100%,
      100% 100%;

    min-height: 200px; /* Avoid footer shrinking vertically on smaller screen sizes*/
    position: absolute;
    width: -webkit-fill-available;
  }

  @media (max-width: 1280px) {
    .footer {
      min-height: 280px;
      background-size:
        200% 100%,
        100% 100%;
    }
  }

  @media (max-width: 960px) {
    .footer {
      min-height: 280px;
      background-size:
        200% 30%,
        100% 100%;
    }
  }

  @media (max-width: 690px) {
    .footer {
      min-height: 340px;
      background-size:
        200% 45%,
        100% 100%;
    }
  }

  @media (max-width: 510px) {
    .footer {
      min-height: 320px;
      background-size:
        200% 40%,
        100% 100%;
    }
  }

  @media (max-width: 416px) {
    .footer {
      min-height: 350px;
      background-size:
        200% 40%,
        100% 100%;
    }
  }

  @media (max-width: 348px) {
    .footer {
      min-height: 380px;
      background-size:
        200% 30%,
        100% 100%;
    }
  }

  .v-container {
    padding-bottom: 40px;
  }

  .v-btn {
    text-transform: none;
  }
  .v-btn:hover {
    text-decoration: underline;
  }

  .footer-links-col {
    display: flex;
    align-items: flex-end; /* Aligns the links to the start of the flex container */
  }

  .sponsor-logos-col {
    display: flex;
    justify-content: flex-end; /* Aligns the logos to the right */
  }

  .sponsor-logos-div {
    display: flex;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* The line between the 2 logos */
  .sponsor-logos-div::before {
    content: '';
    position: absolute;
    left: 50%;
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
    .sponsor-logos-col,
    .footer-links-col {
      flex-wrap: wrap; /* Allow the items to wrap if needed */
      justify-content: center; /* Center the items if they wrap */
    }
  }

  @media (max-width: 600px) {
    .sponsor-logo {
      width: 100%;
      max-width: 160px; /* Set the width to 100px or less */
    }
  }

  @media (max-width: 500px) {
    .sponsor-logo {
      width: 100%;
      max-width: 160px; 
    }
  }
  
  @media (max-width: 380px) {
    .sponsor-logo {
      width: 100%; 
      max-width: 145px;
    }
  }
</style>
