export const jobStatuses = [
  "opened",
  "picking",
  "picked",
  "courier_needed",
  "courier_booked",
  "completed",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export type Job = {
  id: string;
  workDate: string;
  customerName: string | null;
  suburb: string | null;
  source: string | null;
  jobNumber: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  deliveryAddress: string | null;
  postcode: string | null;
  lineItems: { description: string; chineseName: string | null; micCode: string | null; partNumber: string | null; price: string | null }[];
  total: string | null;
  currency: string | null;
  courierBookedDate: string | null;
  status: JobStatus;
  courierRequired: boolean | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type JobInput = Pick<
  Job,
  | "workDate"
  | "customerName"
  | "suburb"
  | "source"
  | "jobNumber"
  | "invoiceNumber"
  | "notes"
  | "deliveryAddress"
  | "postcode"
  | "lineItems"
  | "total"
  | "currency"
>;

export const statusLabels: Record<JobStatus, string> = {
  opened: "Invoice received",
  picking: "Label printed",
  picked: "Parts picked",
  courier_needed: "Ready for courier",
  courier_booked: "Courier booked",
  completed: "Collected",
};

export const progressSteps = [
  { status: "opened", label: "Invoice" },
  { status: "picking", label: "Label" },
  { status: "picked", label: "Picking" },
  { status: "courier_needed", label: "Ready" },
  { status: "courier_booked", label: "Booked" },
  { status: "completed", label: "Collected" },
] satisfies { status: JobStatus; label: string }[];

export function statusIndex(status: JobStatus, courierRequired: boolean | null) {
  if (status === "completed") return progressSteps.length - 1;
  if (status === "picked" && courierRequired === false) return 4;
  return progressSteps.findIndex((step) => step.status === status);
}
