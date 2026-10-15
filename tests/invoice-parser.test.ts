import { describe, expect, it } from "vitest";
import { extractInvoiceFields } from "@/lib/invoice-parser";

describe("extractInvoiceFields", () => {
  it("extracts common Xero invoice labels", () => {
    const text = `
      TAX INVOICE
      Invoice Number INV-1042
      Invoice Date: 15 October 2026
      Due Date: 29 October 2026
      To: Example Customer Pty Ltd
      Amount Due: AUD $1,234.50
    `;

    expect(extractInvoiceFields(text)).toEqual({
      invoiceNumber: "INV-1042",
      contactName: "Example Customer Pty Ltd",
      invoiceDate: "2026-10-15",
      dueDate: "2026-10-29",
      total: "1,234.50",
      currency: "AUD",
    });
  });

  it("returns null for missing fields", () => {
    expect(extractInvoiceFields("A plain invoice with no standard labels.")).toEqual({
      invoiceNumber: null,
      contactName: null,
      invoiceDate: null,
      dueDate: null,
      total: null,
      currency: null,
    });
  });
});
