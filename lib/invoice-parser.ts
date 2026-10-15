import type { InvoiceRecord } from "@/lib/types";

export type ExtractedFields = Omit<InvoiceRecord, "id" | "fileName" | "rawText">;

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function normaliseDate(value: string | null) {
  if (!value) return null;
  const cleaned = value.trim();
  const namedDate = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  const numericDate = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];

  if (namedDate) {
    const month = months.findIndex((name) =>
      name.startsWith(namedDate[2].toLowerCase()),
    );
    if (month >= 0) {
      return `${namedDate[3]}-${String(month + 1).padStart(2, "0")}-${namedDate[1].padStart(2, "0")}`;
    }
  }
  if (numericDate) {
    return `${numericDate[3]}-${numericDate[2].padStart(2, "0")}-${numericDate[1].padStart(2, "0")}`;
  }
  return cleaned;
}

export function extractInvoiceFields(text: string): ExtractedFields {
  const invoiceNumber = firstMatch(text, [
    /Invoice\s*(?:Number|No\.?|#)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-/]*)/i,
    /Tax Invoice\s*#?\s*([A-Z0-9][A-Z0-9\-/]*)/i,
  ]);
  const invoiceDate = normaliseDate(firstMatch(text, [
    /Invoice Date\s*:?\s*([^\n\r]+)/i,
    /Date\s*:?\s*(\d{1,2}[\s/-][A-Za-z0-9]+[\s/-]\d{2,4})/i,
  ]));
  const dueDate = normaliseDate(firstMatch(text, [/Due Date\s*:?\s*([^\n\r]+)/i]));
  const total = firstMatch(text, [
    /(?:Amount Due|Total Due)\s*:?\s*(?:[A-Z]{3}\s*)?\$?\s*([\d,]+\.\d{2})/i,
    /TOTAL\s*:?\s*(?:[A-Z]{3}\s*)?\$?\s*([\d,]+\.\d{2})/i,
  ]);
  const currency = firstMatch(text, [
    /(?:Amount Due|Total Due|TOTAL)\s*:?\s*([A-Z]{3})\b/i,
    /\b(AUD|USD|NZD|GBP|EUR|CAD|SGD)\b/i,
  ]);
  const contactName = firstMatch(text, [
    /(?:^|[\n\r])\s*(?:Bill To|Invoice To|To)\s*:?\s*([^\n\r]+)/im,
  ]);

  return { invoiceNumber, contactName, invoiceDate, dueDate, total, currency };
}
