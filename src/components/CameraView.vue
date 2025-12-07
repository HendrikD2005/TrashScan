<template>
  <!-- Camera Permission Dialog -->
  <v-dialog v-model="showPermissionDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h6">
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
        >
          Abbrechen
        </v-btn>
        <v-btn
          color="#00c853"
          variant="flat"
          @click="requestCamera"
        >
          Erlauben
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-container class="d-flex flex-column align-center py-8">
    <!-- Model Status Banner -->
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

    <!-- Camera Placeholder -->
    <v-card
      class="d-flex align-center justify-center mb-6"
      color="black"
      height="300"
      width="400"
    >
      <v-icon
        v-if="!isScanning"
        color="grey-darken-1"
        size="64"
      >
        mdi-camera
      </v-icon>
      <div
        v-else
        class="text-h6"
        style="color: #00c853"
      >
        Scanning...
      </div>
    </v-card>

    <!-- Scan Button -->
    <SimpleButton
      icon="mdi-camera"
      text="Müll scannen"
      variant="primary"
      @click="toggleScanning"
    />

    <!-- Tips Accordion -->
    <v-expansion-panels class="mt-6" max-width="400" width="100%">
      <v-expansion-panel>
        <v-expansion-panel-title>
          Tipps für bessere Erkennung
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ul>
            <li>Gute Beleuchtung verwenden</li>
            <li>Objekt vollständig im Bild</li>
            <li>Kamera ruhig halten</li>
          </ul>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import SimpleButton from './shared/SimpleButton.vue'

  const modelReady = ref(true)
  const isScanning = ref(false)
  const showPermissionDialog = ref(false)
  const cameraGranted = ref(false)

  onMounted(() => {
    // Dialog beim Laden der Komponente anzeigen
    showPermissionDialog.value = true
  })

  async function requestCamera () {
    showPermissionDialog.value = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Kamera erfolgreich, Stream wieder stoppen
      for (const track of stream.getTracks()) track.stop()
      cameraGranted.value = true
      showPermissionDialog.value = false
    } catch (error: any) {
      console.error('Kamerazugriff-Fehler:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Kamerazugriff wurde verweigert')
      } else {
        if (error.message.startsWith('Device in use')) {
          alert('Fehler beim Kamerazugriff: Das Gerät wird gerade von einer anderen Anwendung genutzt.\n'
            + 'Beenden Sie die andere Anwendung und versuchen Sie es erneut. ')
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

  function toggleScanning () {
    if (!cameraGranted.value) {
      showPermissionDialog.value = true
      return
    }
    isScanning.value = !isScanning.value
  }
</script>
