<template>
  <v-app-bar color="#00c853" prominent>

    <v-app-bar-title class="text-h5 font-weight-bold">
      TrashScan
    </v-app-bar-title>

    <template v-slot:append>
      <SimpleButton text="Scan" @click="$emit('navigate', 'scan')" />
      <SimpleButton text="Map" @click="$emit('navigate', 'map')" />
      <SimpleButton text="Quiz" @click="$emit('navigate', 'quiz')" />
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
