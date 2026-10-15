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
  status: JobStatus;
  courierRequired: boolean | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type JobInput = Pick<
  Job,
  "workDate" | "customerName" | "suburb" | "source" | "jobNumber" | "invoiceNumber" | "notes"
>;

export const statusLabels: Record<JobStatus, string> = {
  opened: "Order opened",
  picking: "Picking stock",
  picked: "Stock ready",
  courier_needed: "Courier required",
  courier_booked: "Courier booked",
  completed: "Completed",
};

export const progressSteps = [
  { status: "opened", label: "Opened" },
  { status: "picking", label: "Picking" },
  { status: "picked", label: "Ready" },
  { status: "courier_needed", label: "Courier" },
  { status: "courier_booked", label: "Booked" },
  { status: "completed", label: "Done" },
] satisfies { status: JobStatus; label: string }[];

export function statusIndex(status: JobStatus, courierRequired: boolean | null) {
  if (status === "completed") return progressSteps.length - 1;
  if (status === "picked" && courierRequired === false) return 4;
  return progressSteps.findIndex((step) => step.status === status);
}
