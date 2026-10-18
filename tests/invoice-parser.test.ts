import { describe, expect, it } from "vitest";
import { extractInvoiceFields } from "@/lib/invoice-parser";

describe("extractInvoiceFields", () => {
  it("extracts common Xero invoice labels", () => {
    const text = `
      TAX INVOICE
      Invoice Number INV-1042
      Invoice Date: 15 October 2026
      Due Date: 29 October 2026
      To:
      Capital SMART Dandenong South
      42-44 Kitchen Road
      DANDENONG SOUTH VIC 3175
      Reference: CS-24017
      Description  Part number  Price AUD
      Bumper Bar  C0065 32 333  245.00
      Reinforcement  MG3015-BRKT  89.50
      Subtotal 334.50
      Amount Due: AUD $1,234.50
    `;

    expect(extractInvoiceFields(text)).toEqual({
      invoiceNumber: "INV-1042",
      contactName: "Capital SMART Dandenong South",
      addressLines: ["42-44 Kitchen Road"],
      suburb: "DANDENONG SOUTH",
      state: "VIC",
      postcode: "3175",
      reference: "CS-24017",
      lineItems: [
        { description: "Bumper Bar", chineseName: null, micCode: null, partNumber: "C0065 32 333", price: "245.00" },
        { description: "Reinforcement", chineseName: null, micCode: null, partNumber: "MG3015-BRKT", price: "89.50" },
      ],
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
      addressLines: [],
      suburb: null,
      state: null,
      postcode: null,
      reference: null,
      lineItems: [],
      invoiceDate: null,
      dueDate: null,
      total: null,
      currency: null,
    });
  });

  it("separates fields when PDF extraction merges left and right columns", () => {
    const text = `TAX INVOICE MIC AUTO PARTS
To Invoice Date 17 October 2026
Capital SMART Dandenong South Invoice Number INV-TEST-1042
42-44 Kitchen Road Reference CS-24017
DANDENONG SOUTH VIC 3175 Due Date 31 October 2026
Description Part number Price AUD
Front bumper bar C0065 32 333 245.00
Bumper reinforcement MG3015-BRKT 89.50
Left bumper guide 52116-TBA-A00 36.00
Subtotal 370.50
TOTAL GST 10% 37.05
TOTAL AUD 407.55`;

    const result = extractInvoiceFields(text);
    expect(result.contactName).toBe("Capital SMART Dandenong South");
    expect(result.addressLines).toEqual(["42-44 Kitchen Road"]);
    expect(result.suburb).toBe("DANDENONG SOUTH");
    expect(result.state).toBe("VIC");
    expect(result.postcode).toBe("3175");
    expect(result.reference).toBe("CS-24017");
    expect(result.lineItems).toEqual([
      { description: "Front bumper bar", chineseName: null, micCode: null, partNumber: "C0065 32 333", price: "245.00" },
      { description: "Bumper reinforcement", chineseName: null, micCode: null, partNumber: "MG3015-BRKT", price: "89.50" },
      { description: "Left bumper guide", chineseName: null, micCode: null, partNumber: "52116-TBA-A00", price: "36.00" },
    ]);
  });
});
