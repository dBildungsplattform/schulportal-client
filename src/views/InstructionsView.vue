<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n({ useScope: 'global' });
  const activeTab = ref('users');

  const scrollToSection = (id: string): void => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  };

  const breadcrumbItems = computed(() => [
    { title: t('nav.portalName'), to: '/' },
    { title: t('help.title'), disabled: true },
  ]);
</script>

<template>
  <v-container class="py-8 max-width-container">
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

        <h1 class="text-h4 mb-2 font-weight-bold">{{ t('help.title') }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">
          {{ t('help.subtitle') }}
        </p>

        <!-- Navigation Tabs (Always side-by-side, equal width) -->
        <v-tabs
          v-model="activeTab"
          color="primary"
          grow
          class="mb-8 rounded-lg"
          height="54"
        >
          <v-tab
            value="users"
            class="text-none text-body-2 font-weight-bold"
          >
            <v-icon
              start
              class="mr-2"
              >mdi-account-group-outline</v-icon
            >
            {{ t('help.tabs.users') }}
          </v-tab>
          <v-tab
            value="admins"
            class="text-none text-body-2 font-weight-bold"
          >
            <v-icon
              start
              class="mr-2"
              >mdi-shield-account-outline</v-icon
            >
            {{ t('help.tabs.admins') }}
          </v-tab>
        </v-tabs>

        <!-- Content Area -->
        <v-window
          v-model="activeTab"
          class="bg-transparent"
        >
          <!-- Tab 1: Users -->
          <v-window-item value="users">
            <!-- Tab Introduction & Roles callout -->
            <div class="mb-6">
              <p class="text-body-1 text-slate-800 mb-4 leading-relaxed">
                {{ t('help.users.intro') }}
              </p>
              <v-alert
                type="info"
                variant="tonal"
                icon="mdi-information-outline"
                class="rounded-xl pa-4"
              >
                <div class="font-weight-bold text-body-2 mb-1">{{ t('help.roles.title') }}</div>
                <div class="text-caption leading-relaxed">{{ t('help.roles.text') }}</div>
              </v-alert>
            </div>

            <!-- Table of Contents / Bullet-point Anchor links -->
            <nav
              class="mb-8 pa-4 bg-grey-lighten-5 border rounded-xl"
              aria-label="Inhaltsverzeichnis"
            >
              <h3 class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">
                {{ t('help.tocTitle') }}
              </h3>
              <ul class="toc-list pl-5">
                <li class="mb-2">
                  <a
                    href="#login-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('login-section')"
                  >
                    {{ t('help.users.loginTitle') }}
                  </a>
                </li>
                <li class="mb-2">
                  <a
                    href="#profile-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('profile-section')"
                  >
                    {{ t('help.users.profileTitle') }}
                  </a>
                </li>
                <li class="mb-2">
                  <a
                    href="#services-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('services-section')"
                  >
                    {{ t('help.users.navigationTitle') }}
                  </a>
                </li>
                <li class="mb-2">
                  <a
                    href="#reset-password-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('reset-password-section')"
                  >
                    {{ t('help.users.resetPasswordTitle') }}
                  </a>
                </li>
                <li class="mb-2">
                  <a
                    href="#troubleshooting-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('troubleshooting-section')"
                  >
                    {{ t('help.troubleshooting.title') }}
                  </a>
                </li>
              </ul>
            </nav>

            <!-- Detailed Sections -->
            <div class="sections-wrapper">
              <!-- Section 1: Login -->
              <section
                id="login-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-login</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.users.loginTitle') }}</h3>
                </div>
                <!-- First login steps -->
                <v-card
                  class="border-light rounded-xl pa-5"
                  variant="flat"
                >
                  <v-timeline
                    density="compact"
                    align="start"
                    truncate-line="both"
                  >
                    <v-timeline-item
                      dot-color="primary"
                      size="small"
                      icon="mdi-card-account-details-outline"
                    >
                      <div class="mb-1 font-weight-bold text-body-2">{{ t('help.gettingStarted.step1Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.gettingStarted.step1Text') }}
                      </div>
                    </v-timeline-item>

                    <v-timeline-item
                      dot-color="primary"
                      size="small"
                      icon="mdi-login"
                    >
                      <div class="mb-1 font-weight-bold text-body-2">{{ t('help.gettingStarted.step2Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.gettingStarted.step2Text') }}
                      </div>
                    </v-timeline-item>

                    <v-timeline-item
                      dot-color="warning"
                      size="small"
                      icon="mdi-lock-reset"
                    >
                      <div class="mb-1 font-weight-bold text-body-2">{{ t('help.gettingStarted.step3Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.gettingStarted.step3Text') }}
                      </div>
                    </v-timeline-item>

                    <v-timeline-item
                      dot-color="success"
                      size="small"
                      icon="mdi-view-dashboard-outline"
                    >
                      <div class="mb-1 font-weight-bold text-body-2">{{ t('help.gettingStarted.step4Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.gettingStarted.step4Text') }}
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 2: Profile -->
              <section
                id="profile-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-account-outline</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.users.profileTitle') }}</h3>
                </div>

                <v-card
                  class="border rounded-xl pa-5"
                  variant="flat"
                >
                  <p class="text-body-2 text-medium-emphasis mb-4 leading-relaxed">
                    {{ t('help.users.profileIntro') }}
                  </p>

                  <v-card
                    border
                    variant="outlined"
                    class="rounded-lg overflow-hidden"
                  >
                    <v-table>
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="font-weight-bold text-caption">{{ t('help.users.table.action') }}</th>
                          <th
                            class="text-center font-weight-bold text-caption"
                            style="width: 100px"
                          >
                            {{ t('help.users.table.allowed') }}
                          </th>
                          <th class="font-weight-bold text-caption">{{ t('help.users.table.details') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="font-weight-bold text-caption">{{ t('help.users.table.changePassword') }}</td>
                          <td class="text-center">
                            <v-icon
                              color="success"
                              size="18"
                              :aria-label="t('yes')"
                              role="img"
                              >mdi-check-circle</v-icon
                            >
                          </td>
                          <td class="text-caption text-medium-emphasis leading-relaxed">
                            {{ t('help.users.table.changePasswordDetails') }}
                          </td>
                        </tr>
                        <tr>
                          <td class="font-weight-bold text-caption">{{ t('help.users.table.changeName') }}</td>
                          <td class="text-center">
                            <v-icon
                              color="error"
                              size="18"
                              :aria-label="t('no')"
                              role="img"
                              >mdi-close-circle</v-icon
                            >
                          </td>
                          <td class="text-caption text-medium-emphasis leading-relaxed">
                            {{ t('help.users.table.changeNameDetails') }}
                          </td>
                        </tr>
                        <tr>
                          <td class="font-weight-bold text-caption">{{ t('help.users.table.changeEmail') }}</td>
                          <td class="text-center">
                            <v-icon
                              color="error"
                              size="18"
                              :aria-label="t('no')"
                              role="img"
                              >mdi-close-circle</v-icon
                            >
                          </td>
                          <td class="text-caption text-medium-emphasis leading-relaxed">
                            {{ t('help.users.table.changeEmailDetails') }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card>
                </v-card>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 3: Services -->
              <section
                id="services-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-open-in-new</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.users.navigationTitle') }}</h3>
                </div>

                <v-card
                  class="border-light rounded-xl pa-5 mb-6"
                  variant="flat"
                >
                  <v-timeline
                    density="compact"
                    align="start"
                    class="mb-4"
                  >
                    <v-timeline-item
                      dot-color="primary"
                      size="small"
                      icon="mdi-gesture-tap"
                    >
                      <div class="text-body-2 text-medium-emphasis leading-relaxed">
                        {{ t('help.users.navigationText1') }}
                      </div>
                    </v-timeline-item>
                    <v-timeline-item
                      dot-color="success"
                      size="small"
                      icon="mdi-door-open"
                    >
                      <div class="text-body-2 text-medium-emphasis leading-relaxed">
                        {{ t('help.users.navigationText2') }}
                      </div>
                    </v-timeline-item>
                  </v-timeline>

                  <v-divider class="my-4"></v-divider>

                  <div class="d-flex align-center ga-3 px-2 py-1">
                    <v-avatar
                      color="indigo-lighten-5"
                      rounded="lg"
                      size="32"
                    >
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-help-circle-outline</v-icon
                      >
                    </v-avatar>
                    <div class="text-body-2 text-medium-emphasis leading-relaxed">
                      {{ t('help.users.navigationText3') }}
                    </div>
                  </div>
                </v-card>

                <!-- Re-login warning -->
                <v-alert
                  type="warning"
                  variant="tonal"
                  icon="mdi-information-outline"
                  class="rounded-xl pa-4"
                >
                  <div class="font-weight-bold text-body-2 mb-1">{{ t('help.users.logoutWarningTitle') }}</div>
                  <div class="text-caption leading-relaxed">{{ t('help.users.logoutWarningText') }}</div>
                </v-alert>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 4: Reset Password -->
              <section
                id="reset-password-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-lock-open-outline</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.users.resetPasswordTitle') }}</h3>
                </div>

                <v-card
                  class="border-light rounded-xl pa-5"
                  variant="flat"
                >
                  <p class="text-body-2 text-medium-emphasis mb-0 leading-relaxed">
                    {{ t('help.users.resetPasswordText') }}
                  </p>
                </v-card>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 5: Troubleshooting (Problems Solving) -->
              <section
                id="troubleshooting-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-alert-circle-outline</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.troubleshooting.title') }}</h3>
                </div>

                <v-expansion-panels
                  variant="accordion"
                  class="border-light rounded-xl overflow-hidden elevation-0"
                >
                  <v-expansion-panel
                    v-for="n in 4"
                    :key="n"
                  >
                    <v-expansion-panel-title class="font-weight-bold text-body-2 py-3">
                      {{ t(`help.troubleshooting.q${n}`) }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text class="text-body-2 text-medium-emphasis pt-2 pb-2 leading-relaxed">
                      {{ t(`help.troubleshooting.a${n}`) }}
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </section>
            </div>
          </v-window-item>

          <!-- Tab 2: Admins -->
          <v-window-item value="admins">
            <!-- Tab Introduction & Roles callout -->
            <div class="mb-6">
              <p class="text-body-1 text-slate-800 mb-4 leading-relaxed">
                {{ t('help.admins.intro') }}
              </p>
              <v-alert
                type="info"
                variant="tonal"
                icon="mdi-information-outline"
                class="rounded-xl pa-4"
              >
                <div class="font-weight-bold text-body-2 mb-1">{{ t('help.roles.title') }}</div>
                <div class="text-caption leading-relaxed">{{ t('help.roles.adminText') }}</div>
              </v-alert>
            </div>

            <!-- Table of Contents / Bullet-point Anchor links -->
            <nav
              class="mb-8 pa-4 bg-grey-lighten-5 border rounded-xl"
              aria-label="Inhaltsverzeichnis"
            >
              <h3 class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis">
                {{ t('help.tocTitle') }}
              </h3>
              <ul class="toc-list pl-5">
                <li class="mb-2">
                  <a
                    href="#create-users-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('create-users-section')"
                  >
                    {{ t('help.admins.createUserTitle') }}
                  </a>
                </li>
                <li class="mb-2">
                  <a
                    href="#edit-users-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('edit-users-section')"
                  >
                    {{ t('help.admins.editUserTitle') }}
                  </a>
                </li>
                <li class="mb-2">
                  <a
                    href="#classes-section"
                    class="toc-link text-primary text-decoration-none font-weight-bold text-body-2"
                    @click.prevent="scrollToSection('classes-section')"
                  >
                    {{ t('help.admins.classesTitle') }}
                  </a>
                </li>
              </ul>
            </nav>

            <!-- Detailed Sections -->
            <div class="sections-wrapper">
              <!-- Section 1: Create Users -->
              <section
                id="create-users-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-account-plus-outline</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.admins.createUserTitle') }}</h3>
                </div>

                <v-card
                  class="border-light rounded-xl pa-5"
                  variant="flat"
                >
                  <div class="mb-4">
                    <div class="font-weight-bold text-body-2 mb-2">
                      {{ t('help.admins.createUserChecklist') }}
                    </div>
                    <div class="d-flex flex-column ga-2 pl-2 mb-4">
                      <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                        <v-icon
                          color="primary"
                          size="18"
                          >mdi-checkbox-marked-circle-outline</v-icon
                        >
                        {{ t('help.admins.checkName') }}
                      </div>
                      <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                        <v-icon
                          color="primary"
                          size="18"
                          >mdi-checkbox-marked-circle-outline</v-icon
                        >
                        {{ t('help.admins.checkRole') }}
                      </div>
                      <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                        <v-icon
                          color="primary"
                          size="18"
                          >mdi-checkbox-marked-circle-outline</v-icon
                        >
                        {{ t('help.admins.checkSchool') }}
                      </div>
                    </div>
                  </div>

                  <v-timeline
                    density="compact"
                    align="start"
                    truncate-line="both"
                  >
                    <v-timeline-item
                      dot-color="grey-darken-1"
                      size="small"
                      icon="mdi-numeric-1"
                    >
                      <div class="font-weight-bold text-body-2">{{ t('help.admins.createStep1Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.admins.createStep1Text') }}
                      </div>
                    </v-timeline-item>
                    <v-timeline-item
                      dot-color="grey-darken-1"
                      size="small"
                      icon="mdi-numeric-2"
                    >
                      <div class="font-weight-bold text-body-2">{{ t('help.admins.createStep2Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.admins.createStep2Text') }}
                      </div>
                    </v-timeline-item>
                    <v-timeline-item
                      dot-color="grey-darken-1"
                      size="small"
                      icon="mdi-numeric-3"
                    >
                      <div class="font-weight-bold text-body-2">{{ t('help.admins.createStep3Title') }}</div>
                      <div class="text-caption text-medium-emphasis leading-relaxed">
                        {{ t('help.admins.createStep3Text') }}
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 2: Edit Users -->
              <section
                id="edit-users-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-account-edit-outline</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.admins.editUserTitle') }}</h3>
                </div>

                <v-card
                  class="border-light rounded-xl pa-5"
                  variant="flat"
                >
                  <p class="text-body-2 text-medium-emphasis mb-4 leading-relaxed">
                    {{ t('help.admins.editUserText') }}
                  </p>
                  <div class="d-flex flex-column ga-2 pl-2">
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-checkbox-marked-circle-outline</v-icon
                      >
                      {{ t('help.admins.editUserFields.firstName') }}
                    </div>
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-checkbox-marked-circle-outline</v-icon
                      >
                      {{ t('help.admins.editUserFields.lastName') }}
                    </div>
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-checkbox-marked-circle-outline</v-icon
                      >
                      {{ t('help.admins.editUserFields.username') }}
                    </div>
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-checkbox-marked-circle-outline</v-icon
                      >
                      {{ t('help.admins.editUserFields.password') }}
                    </div>
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-checkbox-marked-circle-outline</v-icon
                      >
                      {{ t('help.admins.editUserFields.school') }}
                    </div>
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                      <v-icon
                        color="primary"
                        size="18"
                        >mdi-checkbox-marked-circle-outline</v-icon
                      >
                      {{ t('help.admins.editUserFields.status') }}
                    </div>
                  </div>
                </v-card>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 3: Classes & Klassenzuordnungen -->
              <section
                id="classes-section"
                class="scroll-target py-4 mb-8"
              >
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-google-classroom</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.admins.classesTitle') }}</h3>
                </div>

                <v-card
                  class="border-light rounded-xl pa-5"
                  variant="flat"
                >
                  <p class="text-body-2 text-medium-emphasis mb-0 leading-relaxed">
                    {{ t('help.admins.classesText') }}
                  </p>

                  <div class="d-flex align-start ga-3 bg-indigo-lighten-5 pa-4 rounded-xl mt-4">
                    <v-icon
                      color="primary"
                      class="mt-0.5"
                      >mdi-information-outline</v-icon
                    >
                    <div>
                      <div class="text-caption text-medium-emphasis leading-relaxed font-weight-medium">
                        {{ t('help.admins.classesNoteText') }}
                      </div>
                      <div class="d-flex align-center flex-wrap ga-1 mt-2 text-caption font-weight-bold text-primary">
                        <span>{{ t('help.admins.classesPath.userManagement') }}</span>
                        <v-icon
                          size="14"
                          class="mx-0.5"
                          >mdi-chevron-right</v-icon
                        >
                        <span>{{ t('help.admins.classesPath.schoolAssignment') }}</span>
                        <v-icon
                          size="14"
                          class="mx-0.5"
                          >mdi-chevron-right</v-icon
                        >
                        <span>{{ t('help.admins.classesPath.selectSchool') }}</span>
                        <v-icon
                          size="14"
                          class="mx-0.5"
                          >mdi-chevron-right</v-icon
                        >
                        <span>{{ t('help.admins.classesPath.role') }}</span>
                        <v-icon
                          size="14"
                          class="mx-0.5"
                          >mdi-chevron-right</v-icon
                        >
                        <span>{{ t('help.admins.classesPath.class') }}</span>
                      </div>
                    </div>
                  </div>
                </v-card>
              </section>

              <v-divider class="mb-8 border-dashed"></v-divider>

              <!-- Section 4: LDAP Import (Info, no anchor link) -->
              <section class="py-4 mb-8">
                <div class="d-flex align-center mb-4 ga-3">
                  <v-avatar
                    color="indigo-lighten-5"
                    rounded="lg"
                    size="40"
                  >
                    <v-icon
                      color="primary"
                      size="22"
                      >mdi-database-import-outline</v-icon
                    >
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold text-slate-800">{{ t('help.admins.ldapTitle') }}</h3>
                </div>

                <v-card
                  class="border-light rounded-xl pa-5"
                  variant="flat"
                >
                  <p class="text-body-2 text-medium-emphasis mb-0 leading-relaxed">
                    {{ t('help.admins.ldapText') }}
                  </p>
                </v-card>
              </section>
            </div>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .max-width-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .border-light {
    border: 1px solid #e2e8f0 !important;
  }
  .border-dashed {
    border-style: dashed !important;
    border-color: #cbd5e1 !important;
  }
  .scroll-target {
    scroll-margin-top: 120px;
    outline: none;
  }
  .scroll-target:focus-visible {
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.4);
    border-radius: 12px;
  }
  .toc-list {
    list-style-type: square;
  }
  .toc-list li::marker {
    color: #1976d2;
  }
  .toc-link:hover {
    text-decoration: underline !important;
  }
  .leading-relaxed {
    line-height: 1.625;
  }
  .v-expansion-panel:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
  }
</style>
