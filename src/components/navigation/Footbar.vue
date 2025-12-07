<template>
  <v-footer app color="#00c853">
    <v-row align="center" justify="center">
      <v-col cols="auto">
        <v-btn
          color="white"
          variant="text"
          @click="router.push('/scan')"
        >
          <v-icon>mdi-camera</v-icon>
          <span class="ml-1">Scan</span>
        </v-btn>
      </v-col>

      <v-col cols="auto">
        <v-btn
          color="white"
          variant="text"
          @click="router.push('/map')"
        >
          <v-icon>mdi-map</v-icon>
          <span class="ml-1">Map</span>
        </v-btn>
      </v-col>

      <v-col cols="auto">
        <v-btn
          color="white"
          variant="text"
          @click="router.push('/quiz')"
        >
          <v-icon>mdi-head-question</v-icon>
          <span class="ml-1">Quiz</span>
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()
</script>
