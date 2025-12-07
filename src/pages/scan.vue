<template>
  <v-container>
    <v-row justify="center">
      <v-col class="text-center" cols="12">
        <h1 class="text-h4 mb-5 mt-4" style="color: #387301">
          <strong>TrashScan - Müll erkennen & richtig entsorgen</strong>
        </h1>
      </v-col>
    </v-row>

    <CameraView />
  </v-container>
</template>

<script setup lang="ts">
  import CameraView from '../components/CameraView.vue'
</script>
