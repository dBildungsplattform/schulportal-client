<script setup lang="ts">
  import { provide, shallowRef, type ShallowRef } from 'vue'
  import { RouterView, type RouteLocationNormalized } from 'vue-router'
  import router from './router'
  import layouts from './layouts'
  import TheHeader from '@/components/layout/TheHeader.vue'
  import TheFooter from '@/components/layout/TheFooter.vue'
  // import AdminMenuBar from '@/components/layout/AdminMenuBar.vue'

  const currentLayout: ShallowRef = shallowRef('div')

  router.afterEach((to: RouteLocationNormalized) => {
    const layoutIndex: string = to.meta['layout'] as string
    if (layouts.hasOwnProperty(layoutIndex)) {
      currentLayout.value = layouts[layoutIndex] || 'div'
    }
  })

  provide('app:layout', currentLayout)
</script>

<template>
  <v-app>
    <TheHeader></TheHeader>
    <!-- <AdminMenuBar></AdminMenuBar> -->
    <v-main>
      <component :is="currentLayout || 'div'">
        <router-view />
      </component>
      {{ currentLayout }}
    </v-main>
    <TheFooter></TheFooter>
  </v-app>
</template>

<style scoped>
  header {
    line-height: 1.5;
    max-height: 100vh;
  }

  nav {
    width: 100%;
    font-size: 12px;
    text-align: center;
    margin-top: 2rem;
  }

  nav a.router-link-exact-active {
    color: var(--color-text);
  }

  nav a.router-link-exact-active:hover {
    background-color: transparent;
  }

  nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
  }

  nav a:first-of-type {
    border: 0;
  }

  @media (min-width: 1024px) {
    header {
      display: flex;
      place-items: center;
      padding-right: calc(var(--section-gap) / 2);
    }

    .logo {
      margin: 0 2rem 0 0;
    }

    header .wrapper {
      display: flex;
      place-items: flex-start;
      flex-wrap: wrap;
    }

    nav {
      text-align: left;
      margin-left: -1rem;
      font-size: 1rem;

      padding: 1rem 0;
      margin-top: 1rem;
    }
  }
</style>
