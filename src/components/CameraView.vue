<template>
  <!-- Camera Permission Dialog -->
  <v-dialog v-model="showPermissionDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h6">
        <FontAwesomeIcon :icon="faCircleInfo" style="color: #0482ff;" />
        Kamerazugriff erforderlich
      </v-card-title>
      <v-card-text>
        TrashScan benötigt Zugriff auf Ihre Kamera, um Müll zu erkennen.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="#fc1703"
          text
          variant="flat"
          @click="denyCamera"
          @mouseenter="($event.target as HTMLElement).style.backgroundColor = 'rgb(255,0,0)'"
          @mouseleave="($event.target as HTMLElement).style.backgroundColor = '#e41801'"
        >
          Abbrechen
        </v-btn>
        <v-btn
          color="#00c853"
          text
          variant="flat"
          @click="requestCamera"
        >
          Erlauben
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-container class="d-flex flex-column align-center py-8">
    <!-- Model Loading Banner -->
    <v-alert
      v-if="isLoadingModel"
      class="mb-6"
      color="#ffa726"
      max-width="400"
      rounded
      type="info"
      variant="elevated"
      width="100%"
    >
      <template #prepend>
        <v-progress-circular indeterminate size="20" />
      </template>
      <span style="color: #e65100">Lade KI-Modell...</span>
    </v-alert>

    <!-- Model Error Banner -->
    <v-alert
      v-if="modelError"
      class="mb-6"
      color="#ef5350"
      max-width="400"
      rounded
      type="error"
      variant="elevated"
      width="100%"
    >
      <template #prepend>
        <v-icon color="error">mdi-alert-circle</v-icon>
      </template>
      <span style="color: #b71c1c">{{ modelError }}</span>
    </v-alert>

    <!-- Model Ready Banner -->
    <v-alert
      v-if="modelReady"
      class="mb-6"
      color="#63ff7d"
      max-width="400"
      rounded
      type="info"
      variant="elevated"
      width="100%"
    >
      <template #prepend>
        <v-icon color="success">mdi-check-circle</v-icon>
      </template>
      <span style="color: #387301">Müllerkennungsmodell bereit</span>
    </v-alert>

    <!-- Camera View -->
    <v-card
      class="d-flex align-center justify-center mb-6"
      color="black"
      height="300"
      width="400"
    >
      <video
        v-if="cameraGranted"
        ref="videoElement"
        autoplay
        playsinline
        style="width: 100%; height: 100%; object-fit: cover;"
      />
      <v-icon
        v-else
        color="grey-darken-1"
        size="64"
      >
        mdi-camera
      </v-icon>
    </v-card>

    <!-- Scan Button -->
    <SimpleButton
      text="Müll scannen"
      variant="primary"
      :disabled="!modelReady"
      @click="toggleScanning"
    />

    <!-- Tips Accordion -->
    <v-container class="d-flex align-center justify-center">
      <v-col cols="7">
        <v-expansion-panels class="mt-6" max-width="400" width="100%">
          <v-expansion-panel>
            <v-expansion-panel-title>
              Tipps für bessere Erkennung
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <ul>
                <li>Sorgen Sie für gute Beleuchtung</li>
                <li>Halten Sie das Objekt mittig ins Bild</li>
                <li>Fokussieren Sie auf das Objekt</li>
                <li>Halten Sie das Gerät und das Objekt ruhig</li>
                <li>Achten Sie auf einen sauberen Hintergrund</li>
              </ul>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import SimpleButton from './shared/SimpleButton.vue'
import { AIDetection } from '../services/AIDetectionService'

const aiService = new AIDetection()

const modelReady = ref(false)
const isLoadingModel = ref(false)
const modelError = ref<string | null>(null)
const isScanning = ref(false)
const showPermissionDialog = ref(false)
const cameraGranted = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
let currentStream: MediaStream | null = null

onMounted(async () => {
  showPermissionDialog.value = true
  await loadModel()
})

onUnmounted(() => {
  stopCamera()
})

async function loadModel () {
  isLoadingModel.value = true
  modelError.value = null
  try {
    await aiService.initializeModel()
    modelReady.value = aiService.isReady()
  } catch (error) {
    modelError.value = error instanceof Error ? error.message : 'Unbekannter Fehler'
    console.error('Model initialization failed:', error)
  } finally {
    isLoadingModel.value = false
  }
}

async function requestCamera () {
  showPermissionDialog.value = false
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    cameraGranted.value = true

    await nextTick()

    if (videoElement.value) {
      videoElement.value.srcObject = currentStream
    }
  } catch (error: any) {
    console.error('Kamerazugriff-Fehler:', error)
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      alert('Kamerazugriff wurde verweigert')
    } else {
      if (error.message.startsWith('Device in use')) {
        alert('Fehler beim Kamerazugriff: Das Gerät wird gerade von einer anderen Anwendung genutzt.\n'
          + 'Beenden Sie die andere Anwendung und versuchen Sie es erneut.')
      } else {
        alert('Fehler beim Kamerazugriff: ' + error.message)
      }
    }
  }
}

function denyCamera () {
  showPermissionDialog.value = false
  alert('Ohne Kamerazugriff kann TrashScan nicht funktionieren')
}

function stopCamera () {
  if (currentStream) {
    for (const track of currentStream.getTracks()) track.stop()
    currentStream = null
  }
  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
}

async function toggleScanning () {
  if (!cameraGranted.value) {
    showPermissionDialog.value = true
    return
  }

  if (!modelReady.value) {
    alert('Das KI-Modell ist noch nicht bereit')
    return
  }

  isScanning.value = !isScanning.value

  if (isScanning.value && videoElement.value) {
    try {
      const prediction = await aiService.getBestPrediction(videoElement.value)
      console.log('Prediction:', prediction)
    } catch (error) {
      console.error('Prediction error:', error)
      alert('Fehler bei der Vorhersage')
    }
  }
}
</script>
3
<style scoped>
.hover-white:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
