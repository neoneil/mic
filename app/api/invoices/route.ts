import { NextResponse } from "next/server";
import { extractInvoiceFields } from "@/lib/invoice-parser";
import { extractPdfText } from "@/lib/pdf";
import { saveInvoice } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "The PDF is empty." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "The PDF exceeds the 10 MB limit." }, { status: 413 });
    }
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 415 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = new TextDecoder("ascii").decode(bytes.slice(0, 5));
    if (signature !== "%PDF-") {
      return NextResponse.json({ error: "This file is not a valid PDF." }, { status: 415 });
    }

    const rawText = await extractPdfText(bytes);
    if (rawText.length < 20) {
      return NextResponse.json(
        { error: "No usable text was found. Please upload a text-based Xero PDF, not a scan." },
        { status: 422 },
      );
    }

    const id = crypto.randomUUID();
    const fields = extractInvoiceFields(rawText);
    await saveInvoice({ id, fileName: file.name, bytes, text: rawText, fields });

    return NextResponse.json({
      invoice: { id, fileName: file.name, rawText, ...fields },
    }, { status: 201 });
  } catch (error) {
    console.error("Invoice import failed", error);
    const message = error instanceof Error ? error.message : "Invoice import failed.";
    const safeMessage = message.startsWith("Server storage is not configured")
      ? message
      : "Could not import the invoice. Please try again.";
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
