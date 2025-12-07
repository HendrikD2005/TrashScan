<template>
  <v-app-bar color="#00c853" prominent>
    <template v-slot:prepend>
      <v-icon size="32">mdi-delete</v-icon>
    </template>

    <v-app-bar-title class="text-h5 font-weight-bold">
      TrashScan
    </v-app-bar-title>

    <template v-slot:append>
      <SimpleButton icon="mdi-camera" text="Scan" @click="$emit('navigate', 'scan')" />
      <SimpleButton icon="mdi-map-marker" text="Map" @click="$emit('navigate', 'map')" />
      <SimpleButton icon="mdi-head-question" text="Quiz" @click="$emit('navigate', 'quiz')" />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
  import SimpleButton from '../shared/SimpleButton.vue'

  defineEmits<{
    navigate: [page: string]
  }>()
</script>

<style scoped>
.v-app-bar {
  color: white !important;
}
</style>
