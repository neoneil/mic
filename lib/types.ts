export type InvoiceLineItem = {
  description: string;
  chineseName: string | null;
  micCode: string | null;
  partNumber: string | null;
  price: string | null;
};

export type InvoiceRecord = {
  id: string;
  fileName: string;
  invoiceNumber: string | null;
  contactName: string | null;
  addressLines: string[];
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  reference: string | null;
  lineItems: InvoiceLineItem[];
  invoiceDate: string | null;
  dueDate: string | null;
  total: string | null;
  currency: string | null;
  rawText: string;
};
