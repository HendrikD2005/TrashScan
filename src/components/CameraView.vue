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

    <!-- Hidden Canvas for Processing -->
    <canvas ref="canvasElement" style="display: none;" />

    <!-- Scan Button -->
    <SimpleButton
      :text="isScanning ? 'Analysiere...' : 'Müll scannen'"
      variant="primary"
      :disabled="!modelReady || isScanning"
      @click="scanTrash"
    />

    <!-- Results Section -->
    <v-card
      v-if="bestPrediction"
      class="mt-6"
      max-width="600"
      width="100%"
    >
      <v-card-title class="text-h5">
        Erkennungsergebnis
      </v-card-title>

      <v-card-text>
        <!-- Best Prediction -->
        <div class="d-flex align-center mb-4">
          <span class="text-h2 mr-4">{{ getTrashIcon(bestPrediction.className) }}</span>
          <div>
            <div class="text-h6">{{ bestPrediction.className }}</div>
            <v-chip
              :color="getConfidenceColor(bestPrediction.confidence)"
              size="small"
              class="mt-1"
            >
              {{ bestPrediction.confidence }}% {{ getConfidenceLevel(bestPrediction.confidence) }}
            </v-chip>
          </div>
        </div>

        <!-- Recycling Tip -->
        <v-alert
          v-if="recyclingTip"
          color="#e8f5e9"
          class="mb-4"
          variant="tonal"
        >
          <template #prepend>
            <span class="text-h6">💡</span>
          </template>
          <div class="text-subtitle-2 font-weight-bold mb-1">Entsorgungstipp:</div>
          <div>{{ recyclingTip }}</div>
        </v-alert>

        <!-- Other Predictions -->
        <div v-if="predictions.length > 1">
          <div class="text-subtitle-2 font-weight-bold mb-2">Weitere mögliche Erkennungen:</div>
          <v-list density="compact">
            <v-list-item
              v-for="(prediction, index) in predictions.slice(1)"
              :key="index"
              class="px-0"
            >
              <template #prepend>
                <span class="text-h6 mr-2">{{ getTrashIcon(prediction.className) }}</span>
              </template>
              <v-list-item-title>{{ prediction.className }}</v-list-item-title>
              <template #append>
                <v-chip size="x-small">{{ prediction.confidence }}%</v-chip>
              </template>
              <v-progress-linear
                :model-value="prediction.confidence"
                :color="getConfidenceColor(prediction.confidence)"
                height="4"
                class="mt-1"
              />
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>

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
import {AIDetectionService, type PredictionResult} from '../services/AIDetectionService'

const aiService = new AIDetectionService()

const modelReady = ref(false)
const isLoadingModel = ref(false)
const modelError = ref<string | null>(null)
const isScanning = ref(false)
const showPermissionDialog = ref(false)
const cameraGranted = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
const predictions = ref<PredictionResult[]>([])
const bestPrediction = ref<any>(null)
const recyclingTip = ref('')
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

async function scanTrash () {
  if (!cameraGranted.value) {
    showPermissionDialog.value = true
    return
  }

  if (!modelReady.value) {
    alert('Das KI-Modell ist noch nicht bereit')
    return
  }

  isScanning.value = true
  predictions.value = []
  bestPrediction.value = null
  recyclingTip.value = ''

  try {
    const video = videoElement.value
    const canvas = canvasElement.value

    if (!video || !canvas) {
      throw new Error('Video oder Canvas nicht verfügbar')
    }

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas-Context nicht verfügbar')
    }

    // Video auf Canvas zeichnen
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Prediction durchführen
    const results = await aiService.predictImage(canvas) as PredictionResult[]
    predictions.value = results

    if (results.length > 0) {
      bestPrediction.value = results[0]
      recyclingTip.value = getRecyclingTip(results[0]!.className)
    }

    // Canvas leeren
    context.clearRect(0, 0, canvas.width, canvas.height)
  } catch (error) {
    console.error('Prediction error:', error)
    alert('Fehler bei der Vorhersage')
  } finally {
    isScanning.value = false
  }
}

function getRecyclingTip (className: string): string {
  const tips: Record<string, string> = {
    batterie: '🔋 Sondermüll! Zu Sammelstellen oder Elektronikgeschäften bringen. Niemals in den Hausmüll!',
    battery: '🔋 Sondermüll! Zu Sammelstellen oder Elektronikgeschäften bringen. Niemals in den Hausmüll!',
    bio: '🍂 In die Biotonne oder auf den Kompost. Keine Plastiktüten verwenden!',
    biomüll: '🍂 In die Biotonne oder auf den Kompost. Keine Plastiktüten verwenden!',
    organic: '🍂 In die Biotonne oder auf den Kompost. Keine Plastiktüten verwenden!',
    'braunes glas': '🍾 In den Glascontainer für Braunglas. Deckel entfernen!',
    'brown glass': '🍾 In den Glascontainer für Braunglas. Deckel entfernen!',
    'grünes glas': '🍾 In den Glascontainer für Grünglas. Deckel entfernen!',
    'green glass': '🍾 In den Glascontainer für Grünglas. Deckel entfernen!',
    'weißes glas': '🍾 In den Glascontainer für Weißglas. Deckel entfernen!',
    'white glass': '🍾 In den Glascontainer für Weißglas. Deckel entfernen!',
    glas: '🍾 Nach Farben getrennt in Glascontainer. Deckel entfernen!',
    glass: '🍾 Nach Farben getrennt in Glascontainer. Deckel entfernen!',
    karton: '📦 Zusammenfalten und ins Altpapier. Beschichteten Karton (z.B. Getränkekartons) in den gelben Sack.',
    cardboard: '📦 Zusammenfalten und ins Altpapier. Beschichteten Karton (z.B. Getränkekartons) in den gelben Sack.',
    papier: '📄 Ins Altpapier. Stark verschmutztes Papier in den Restmüll.',
    paper: '📄 Ins Altpapier. Stark verschmutztes Papier in den Restmüll.',
    kleidung: '👕 Zu Altkleidercontainern oder sozialen Einrichtungen bringen. Nur saubere und tragbare Kleidung!',
    clothing: '👕 Zu Altkleidercontainern oder sozialen Einrichtungen bringen. Nur saubere und tragbare Kleidung!',
    schuhe: '👟 Paarweise zusammengebunden zu Altkleidercontainern. Kaputte Schuhe in den Restmüll.',
    shoes: '👟 Paarweise zusammengebunden zu Altkleidercontainern. Kaputte Schuhe in den Restmüll.',
    metall: '🔩 In den gelben Sack/Wertstofftonne oder Metallcontainer. Großteile zum Wertstoffhof.',
    metal: '🔩 In den gelben Sack/Wertstofftonne oder Metallcontainer. Großteile zum Wertstoffhof.',
    dose: '🥫 Ausspülen, zusammenpressen und in den gelben Sack.',
    can: '🥫 Ausspülen, zusammenpressen und in den gelben Sack.',
    plastik: '🧴 In den gelben Sack/Wertstofftonne. Verpackungen leer machen, aber nicht ausspülen!',
    plastic: '🧴 In den gelben Sack/Wertstofftonne. Verpackungen leer machen, aber nicht ausspülen!',
    plastikflasche: '🧴 In den gelben Sack. Deckel extra entsorgen. Pfandflaschen zurückgeben!',
    'plastic bottle': '🧴 In den gelben Sack. Deckel extra entsorgen. Pfandflaschen zurückgeben!',
    'anderer müll': '🗑️ In den Restmüll. Bitte prüfen Sie, ob Teile recycelbar sind!',
    'other trash': '🗑️ In den Restmüll. Bitte prüfen Sie, ob Teile recycelbar sind!',
    elektronik: '💻 Sondermüll! Zu Wertstoffhöfen oder Elektronikgeschäften bringen.',
    electronics: '💻 Sondermüll! Zu Wertstoffhöfen oder Elektronikgeschäften bringen!',
  }

  const lowerClassName = className.toLowerCase()
  for (const [key, tip] of Object.entries(tips)) {
    if (lowerClassName.includes(key)) {
      return tip
    }
  }

  return '♻️ Bitte informieren Sie sich über die richtige Entsorgung in Ihrer Gemeinde.'
}

function getTrashIcon (className: string): string {
  const icons: Record<string, string> = {
    batterien: '🔋',
    battery: '🔋',
    bio: '🍂',
    organic: '🍂',
    'braunes glas': '🍾',
    'brown glass': '🍾',
    'grünes glas': '🍾',
    'green glass': '🍾',
    'weißes glas': '🍾',
    'white glass': '🍾',
    glas: '🍾',
    glass: '🍾',
    karton: '📦',
    cardboard: '📦',
    papier: '📄',
    paper: '📄',
    metall: '🔩',
    metal: '🔩',
    plastik: '🧴',
    plastic: '🧴',
    kleidung: '👕',
    clothing: '👕',
    schuhe: '👟',
    shoes: '👟',
    'anderer müll': '🗑️',
    'other trash': '🗑️',
  }

  const lowerClassName = className.toLowerCase()
  for (const [key, icon] of Object.entries(icons)) {
    if (lowerClassName.includes(key)) {
      return icon
    }
  }

  return '♻️'
}

function getConfidenceLevel (confidence: number): string {
  if (confidence >= 80) return 'Sehr sicher'
  if (confidence >= 60) return 'Sicher'
  if (confidence >= 40) return 'Wahrscheinlich'
  return 'Unsicher'
}

function getConfidenceColor (confidence: number): string {
  if (confidence >= 70) return 'success'
  if (confidence >= 40) return 'warning'
  return 'error'
}
</script>

<style scoped>
.hover-white:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
