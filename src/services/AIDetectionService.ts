import { ref } from 'vue'

declare global {
  interface Window {
    tmImage: any
    tf: any
  }
}

export interface PredictionResult {
  className: string
  probability: number
  confidence: number
}

export class AIDetection {
  private model: any = null
  private maxPredictions = 0
  private isModelLoaded = false
  private loadingPromise: Promise<void> | null = null
  private librariesReady = false

  constructor () {
    this.checkLibrariesPeriodically()
  }

  private checkLibrariesPeriodically (): void {
    const checkInterval = setInterval(() => {
      if (window.tf && window.tmImage) {
        this.librariesReady = true
        console.log('TensorFlow.js and Teachable Machine libraries are ready')
        clearInterval(checkInterval)
      }
    }, 500)

    setTimeout(() => {
      clearInterval(checkInterval)
      if (!this.librariesReady) {
        console.error('Libraries failed to load after 30 seconds')
      }
    }, 30000)
  }

  private async waitForLibraries (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.librariesReady) {
        resolve()
        return
      }

      let attempts = 0
      const maxAttempts = 300

      const checkLibraries = () => {
        attempts++

        if (window.tf && window.tmImage) {
          this.librariesReady = true
          console.log('TensorFlow.js and Teachable Machine libraries are ready')
          resolve()
        } else if (attempts >= maxAttempts) {
          reject(new Error('Libraries failed to load within 30 seconds. Please check your internet connection and try again.'))
        } else {
          setTimeout(checkLibraries, 100)
        }
      }

      checkLibraries()
    })
  }

  async initializeModel (): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = this.loadModel()
    return this.loadingPromise
  }

  private async checkModelFiles (modelPath: string): Promise<void> {
    const modelURL = modelPath + 'model.json'
    const metadataURL = modelPath + 'metadata.json'

    try {
      const modelResponse = await fetch(modelURL)
      if (!modelResponse.ok) {
        throw new Error(`Model file not found: ${modelURL} (Status: ${modelResponse.status})`)
      }

      const metadataResponse = await fetch(metadataURL)
      if (!metadataResponse.ok) {
        throw new Error(`Metadata file not found: ${metadataURL} (Status: ${metadataResponse.status})`)
      }

      console.log('✓ Model files are accessible')
    } catch (error) {
      console.error('Model file check failed:', error)
      throw new Error(`Model files not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async loadModel (modelPath = './assets/my_model/'): Promise<void> {
    try {
      console.log('Warte auf Bibliotheken...')
      await this.waitForLibraries()

      if (!window.tmImage) {
        throw new Error('Teachable Machine library not available')
      }

      console.log('Prüfe Modell-Dateien...')
      await this.checkModelFiles(modelPath)

      const modelURL = modelPath + 'model.json'
      const metadataURL = modelPath + 'metadata.json'

      console.log('Lade Modell von:', modelURL)
      console.log('Lade Metadaten von:', metadataURL)

      this.model = await window.tmImage.load(modelURL, metadataURL)
      this.maxPredictions = this.model.getTotalClasses()
      this.isModelLoaded = true

      console.log('✓ Teachable Machine Modell erfolgreich geladen')
      console.log('Anzahl Klassen:', this.maxPredictions)

      const labels = this.model.getClassLabels()
      for (let i = 0; i < this.maxPredictions; i++) {
        console.log(`Klasse ${i}:`, labels[i])
      }
    } catch (error) {
      console.error('Fehler beim Laden des Teachable Machine Modells:', error)
      this.isModelLoaded = false
      this.loadingPromise = null

      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error('Modell-Dateien nicht gefunden. Stellen Sie sicher, dass sich die Dateien im assets/my_model/ Ordner befinden.')
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Netzwerkfehler beim Laden des Modells. Prüfen Sie Ihre Internetverbindung.')
        }
      }

      throw error
    }
  }

  async predictImage (imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<PredictionResult[]> {
    if (!this.isModelLoaded) {
      throw new Error('Modell nicht geladen. Rufen Sie initializeModel() zuerst auf.')
    }

    try {
      const predictions = await this.model.predict(imageElement)

      const results: PredictionResult[] = predictions
        .map((prediction: any) => ({
          className: prediction.className,
          probability: prediction.probability,
          confidence: Math.round(prediction.probability * 100),
        }))
        .sort((a: PredictionResult, b: PredictionResult) => b.probability - a.probability)

      return results
    } catch (error) {
      console.error('Fehler bei der Vorhersage:', error)
      throw error
    }
  }

  async predictFromCanvas (canvas: HTMLCanvasElement): Promise<PredictionResult[]> {
    return this.predictImage(canvas)
  }

  async getBestPrediction (imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<PredictionResult | null> {
    const predictions = await this.predictImage(imageElement)
    return predictions.length > 0 ? (predictions[0] ?? null) : null
  }

  getModelInfo (): { isLoaded: boolean; maxPredictions: number; classes: string[] } {
    const classes = this.model ? this.model.getClassLabels() : []
    return {
      isLoaded: this.isModelLoaded,
      maxPredictions: this.maxPredictions,
      classes,
    }
  }

  isReady (): boolean {
    return this.isModelLoaded
  }

  areLibrariesReady (): boolean {
    return this.librariesReady
  }

  getClassLabels (): string[] {
    return this.model ? this.model.getClassLabels() : []
  }

  async retryLoadModel (): Promise<void> {
    this.loadingPromise = null
    this.isModelLoaded = false
    return this.initializeModel()
  }

  async debugModelPath (): Promise<void> {
    console.log('=== Model Debug Info ===')
    console.log('Current location:', window.location.href)
    console.log('Base href:', document.querySelector('base')?.href)

    const testPaths = [
      './assets/my_model/model.json',
      '/assets/my_model/model.json',
      'assets/my_model/model.json',
    ]

    for (const path of testPaths) {
      try {
        const response = await fetch(path)
        console.log(`${path}: ${response.ok ? '✓ OK' : `✗ ${response.status}`}`)
      } catch (error) {
        console.log(`${path}: ✗ Error`)
      }
    }
  }
}

// Singleton Instance
const aiDetectionInstance = new AIDetection()

// Composable
export function useAIDetection () {
  const modelReady = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const initializeModel = async () => {
    isLoading.value = true
    error.value = null
    try {
      await aiDetectionInstance.initializeModel()
      modelReady.value = aiDetectionInstance.isReady()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Model initialization failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  const predictImage = async (element: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement) => {
    return await aiDetectionInstance.predictImage(element)
  }

  const getBestPrediction = async (element: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement) => {
    return await aiDetectionInstance.getBestPrediction(element)
  }

  const getModelInfo = () => {
    return aiDetectionInstance.getModelInfo()
  }

  return {
    modelReady,
    isLoading,
    error,
    initializeModel,
    predictImage,
    getBestPrediction,
    getModelInfo,
  }
}
