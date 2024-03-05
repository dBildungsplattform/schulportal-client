<script setup lang="ts">
  function goBack(): void {
    window.history.back();
  }
</script>

<template>
  <div class="not-found-container">
    <h1>404 Nicht gefunden</h1>
    <p>Die aufgerufene Seite wurde nicht gefunden</p>
    <button @click="goBack">Zurück</button>
  </div>
</template>

<style scoped>
  .not-found-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }

  h1 {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 2rem;
  }
</style>
