import "server-only";
import { PDFParse } from "pdf-parse";
import { getData } from "pdf-parse/worker";

PDFParse.setWorker(getData());

export async function extractPdfText(bytes: Uint8Array) {
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
