<template>
  <v-app>
    <Navbar />
    <v-main>
      <router-view />
    </v-main>
    <Footbar />
  </v-app>
</template>

<script lang="ts" setup>
  import Footbar from '@/components/navigation/Footbar.vue'
  import Navbar from '@/components/navigation/Navbar.vue'
</script>
