<template>
  <v-container>
    <v-row justify="center">
      <v-col class="text-center" cols="12">
        <h1 class="text-h4 mb-8">
          TrashScan
        </h1>
      </v-col>
    </v-row>

    <CameraView />
  </v-container>
</template>

<script setup lang="ts">
  import CameraView from '../components/CameraView.vue'
</script>
