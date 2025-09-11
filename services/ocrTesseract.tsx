import Tesseract from "tesseract.js"

export async function extractAllTextFromImage(imageFile: File): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imageFile, "eng", {
      logger: (m) => console.log(m),
    })
    return text
  } catch (error) {
    console.error("OCR Error:", error)
    throw new Error("Falha ao extrair texto da imagem")
  }
}
