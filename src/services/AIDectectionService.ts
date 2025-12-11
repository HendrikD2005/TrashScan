import type * as tmImage from '@teachablemachine/image'

declare global {
  interface Window {
    tf: any
    tmImage: typeof tmImage
  }
}

export interface PredictionResult {
  className: string
  probability: number
  confidence: number
}

export class AIDectectionService {
  private TIMEOUT = 500
  private LIBRARIES_LOAD_TIMEOUT = 30_000
  private model: any = null
  private maxPredictions = 0
  private isModelLoaded = false
  private loadingPromise: Promise<void> | null = null
  private librariesReady = false

  constructor () {}

  private checkLibrariesPeriodically (): void {
    const checkInterval = setInterval(() => {
      if (window.tf && window.tmImage) {
        this.librariesReady = true
        clearInterval(checkInterval)
      }
    }, this.TIMEOUT)

    setTimeout(() => {
      clearInterval(checkInterval)
      if (!this.librariesReady) {
        console.error('Error > Libraries failed to load.')
      }
    }, this.LIBRARIES_LOAD_TIMEOUT)
  }

  private async waitForLibraries (): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.librariesReady) {
        resolve()
        return
      }

      let attempts = 0
      const maxAttempts = 10

      const checkLibraries = () => {
        attempts++

        if (window.tf && window.tmImage) {
          this.librariesReady = true
          console.log('Libraries loaded successfully.')
          resolve()
        } else if (attempts >= maxAttempts) {
          reject(new Error('Libraries failed to load within 30 seconds.'))
        } else {
          setTimeout(checkLibraries, 100)
        }
      }
      checkLibraries()
    })
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
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
        throw new Error(`Failed to fetch model file: ${modelURL}. (Status: ${modelResponse.status})`)
      }

      const metadataResponse = await fetch(metadataURL)
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata file: ${metadataURL}. (Status: ${metadataResponse.status})`)
      }

      console.log('Model files loaded successfully.')
    } catch (error) {
      console.error('Error > Failed to load model files:', error)
      throw new Error(`Model files not accessible: ${error instanceof Error ? error.message : 'Unknown error.'}`)
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async loadModel (modelPath = '/model/'): Promise<void> {
    try {
      console.log('Waiting for libraries...')
      await this.waitForLibraries()

      if (!window.tmImage) {
        throw new Error('Failed to load Teachable Machine Image library.')
      }

      console.log('Check model files...')
      await this.checkModelFiles(modelPath)

      const modelURL = modelPath + 'model.json'
      const metadataURL = modelPath + 'metadata.json'

      console.log('Loading model from: ' + modelURL)
      console.log('Loading metadata from: ' + metadataURL)

      this.model = await window.tmImage.load(modelURL, metadataURL)
      this.maxPredictions = this.model.getTotalClasses()
      this.isModelLoaded = true

      console.log('Model loaded successfully.')
      console.log('Max predictions: ' + this.maxPredictions)

      const labels = this.model.getClassLabels()
      for (let i = 0; i < this.maxPredictions; i++) {
        console.log(`Class ${i}: labels[i]`)
      }
    } catch (error) {
      console.error('Error > Failed to load model:', error)
      this.isModelLoaded = false
      this.loadingPromise = null

      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error('Model files not found. Please check the path in the settings.')
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Failed to load model files. Please check your internet connection.')
        }
      }
      throw error
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async predictImage (imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<PredictionResult[]> {
    if (!this.isModelLoaded) {
      throw new Error('Model not loaded.')
    }

    try {
      const predictions = await this.model.predict(imageElement)

      const results: PredictionResult[] = predictions
        .map((prediction: any) => ({
          className: prediction.className,
          probability: prediction.probability,
          confidence: Math.round(prediction.probability * 100),
        }))
        .toSorted((a: PredictionResult, b: PredictionResult) => b.probability - a.probability)

      return results
    } catch (error) {
      console.error('Error > Failed to predict image:', error)
      throw error
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async predictFromCanvas (canvas: HTMLCanvasElement): Promise<PredictionResult[]> {
    return this.predictImage(canvas)
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getBestPrediction (imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<PredictionResult | null> {
    const predictions = await this.predictImage(imageElement)
    return predictions.length > 0 ? predictions[0] : null
  }

  getModelInfo (): { isLoaded: boolean, maxPredictions: number, classes: string[] } {
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
}
