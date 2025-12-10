<template>
  <v-app-bar color="#00c853" prominent>

    <v-container fluid>
      <v-row>
        <v-col class="app-bar-title" cols="12" offset="3" sm="6">
          <v-app-bar-title class="text-h5 font-weight-bold">
            <FontAwesomeIcon :icon="faTrashCan" style="color: #fbfbfb;" />
            TrashScan
          </v-app-bar-title>
        </v-col>
      </v-row>
    </v-container>

  </v-app-bar>
</template>

<script setup lang="ts">
  import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

  defineEmits<{
    navigate: [page: string]
  }>()
</script>

<style scoped>
.v-app-bar {
  color: white !important;
}

</style>
