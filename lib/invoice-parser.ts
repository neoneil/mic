import type { InvoiceLineItem, InvoiceRecord } from "@/lib/types";

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

function linesOf(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractCustomerBlock(text: string) {
  const lines = linesOf(text);
  const start = lines.findIndex((line) => /^(?:to|bill to|invoice to)\b/i.test(line));
  if (start < 0) {
    return { contactName: null, addressLines: [], suburb: null, state: null, postcode: null };
  }

  const inline = lines[start]
    .replace(/^(?:to|bill to|invoice to)\s*:?\s*/i, "")
    .replace(/(?:^|\s+)(?:invoice date|invoice number|reference|due date)\b.*$/i, "");
  const block = (inline ? [inline] : []).concat(lines.slice(start + 1)).slice(0, 6)
    .map((line) => line.replace(/(?:^|\s+)(?:invoice date|invoice number|reference|due date)\b.*$/i, "").trim());
  const stop = block.findIndex((line) => /^(?:invoice date|invoice number|reference|description|tax invoice)\b/i.test(line));
  const customerLines = (stop >= 0 ? block.slice(0, stop) : block).filter(Boolean);
  const contactName = customerLines.shift() ?? null;
  const locationIndex = customerLines.findIndex((line) => /\b(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\s+\d{4}\b/i.test(line));
  const location = locationIndex >= 0 ? customerLines[locationIndex] : null;
  const locationMatch = location?.match(/^(.+?)\s+(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\s+(\d{4})$/i);

  return {
    contactName,
    addressLines: locationIndex >= 0 ? customerLines.slice(0, locationIndex) : customerLines,
    suburb: locationMatch?.[1] ?? null,
    state: locationMatch?.[2]?.toUpperCase() ?? null,
    postcode: locationMatch?.[3] ?? null,
  };
}

function looksLikePartNumber(value: string) {
  return /\d/.test(value) && /^[A-Z0-9][A-Z0-9 .\-/_]{3,}$/i.test(value);
}

function extractLineItems(text: string): InvoiceLineItem[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => /\bdescription\b/i.test(line) && /\b(?:amount|price)\b/i.test(line));
  if (headerIndex < 0) return [];

  const items: InvoiceLineItem[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (/^(?:sub\s*total|total\b|amount due|payment advice|due date)/i.test(line)) break;
    const columns = line.split(/\t|\s{2,}/).map((value) => value.trim()).filter(Boolean);
    if (columns.length >= 3 && looksLikePartNumber(columns[1])) {
      const price = [...columns].reverse().find((value) => /^\$?[\d,]+\.\d{2}$/.test(value));
      items.push({
        description: columns[0],
        chineseName: null,
        micCode: null,
        partNumber: columns[1],
        price: price?.replace(/^\$/, "") ?? null,
      });
      continue;
    }

    const compact = line.match(/^(.+?)\s+([A-Z0-9][A-Z0-9 .\-/_]*\d[A-Z0-9 .\-/_]*)\s+\$?([\d,]+\.\d{2})$/);
    if (compact && looksLikePartNumber(compact[2])) {
      items.push({ description: compact[1], chineseName: null, micCode: null, partNumber: compact[2], price: compact[3] });
    }
  }
  return items;
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
    /^\s*(?:Amount Due|Total Due)\s*:?\s*(?:[A-Z]{3}\s*)?\$?\s*([\d,]+\.\d{2})\s*$/im,
    /^\s*TOTAL\s+(?:AUD|USD|NZD|GBP|EUR|CAD|SGD)\s+\$?\s*([\d,]+\.\d{2})\s*$/im,
  ]);
  const currency = firstMatch(text, [
    /^\s*(?:Amount Due|Total Due|TOTAL)\s*:?\s*(AUD|USD|NZD|GBP|EUR|CAD|SGD)\b/im,
    /\b(AUD|USD|NZD|GBP|EUR|CAD|SGD)\b/i,
  ]);
  const customer = extractCustomerBlock(text);
  const reference = firstMatch(text, [/\bReference\s*:?\s*([^\n\r]+)/i]);
  const lineItems = extractLineItems(text);

  return { invoiceNumber, ...customer, reference, lineItems, invoiceDate, dueDate, total, currency };
}
