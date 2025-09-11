import { createWorker } from "tesseract.js"

export class OCRService {
  private worker: any = null

  async initWorker() {
    if (!this.worker) {
      this.worker = await createWorker("por+eng")
    }
    return this.worker
  }

  async extractText(imageFile: File): Promise<string> {
    try {
      const worker = await this.initWorker()

      const {
        data: { text },
      } = await worker.recognize(imageFile)

      return text
    } catch (error) {
      console.error("Erro no OCR:", error)
      throw new Error("Falha ao extrair texto da imagem")
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}
