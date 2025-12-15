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

    <v-container fluid>
      <v-row justify="end" align="center">
        <v-col cols="auto" class="d-flex align-center ga-2">
          <FontAwesomeIcon :icon="faSun" style="color: #ffffff;" />
          <v-switch
            v-model="isDarkMode"
            hide-details
            inset
            @change="toggleTheme"
          ></v-switch>
          <FontAwesomeIcon :icon="faMoon" style="color: #ffffff;" />
        </v-col>
      </v-row>
    </v-container>

  </v-app-bar>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import {useTheme} from "vuetify/framework";
  import {faTrashCan, faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

  const theme = useTheme()
  const isDarkMode = ref(theme.global.current.value.dark)

  const toggleTheme = () => {
    theme.toggle()
  }

  defineEmits<{
    navigate: [page: string]
  }>()
</script>

<style scoped>
.v-app-bar {
  color: white !important;
}

</style>
