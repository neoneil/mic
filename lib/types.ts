export type InvoiceRecord = {
  id: string;
  fileName: string;
  invoiceNumber: string | null;
  contactName: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  total: string | null;
  currency: string | null;
  rawText: string;
};
