import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import type { Job, JobInput, JobStatus } from "@/lib/job-types";

type JobRow = {
  id: string;
  work_date: string;
  customer_name: string | null;
  suburb: string | null;
  source: string | null;
  job_number: string | null;
  invoice_number: string | null;
  notes: string | null;
  status: JobStatus;
  courier_required: boolean | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type StoredJobDetails = {
  version: 1;
  notes: string | null;
  deliveryAddress: string | null;
  postcode: string | null;
  lineItems: Job["lineItems"];
  total: string | null;
  currency: string | null;
  courierBookedDate: string | null;
};

const DETAILS_PREFIX = "MIC_JOB_V1:";

function decodeDetails(value: string | null): StoredJobDetails {
  if (value?.startsWith(DETAILS_PREFIX)) {
    try {
      return JSON.parse(value.slice(DETAILS_PREFIX.length)) as StoredJobDetails;
    } catch {
    }
  }
  return {
    version: 1,
    notes: value,
    deliveryAddress: null,
    postcode: null,
    lineItems: [],
    total: null,
    currency: null,
    courierBookedDate: null,
  };
}

function encodeDetails(details: StoredJobDetails) {
  return `${DETAILS_PREFIX}${JSON.stringify(details)}`;
}

function client() {
  const env = getServerEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toJob(row: JobRow): Job {
  const details = decodeDetails(row.notes);
  return {
    id: row.id,
    workDate: row.work_date,
    customerName: row.customer_name,
    suburb: row.suburb,
    source: row.source,
    jobNumber: row.job_number,
    invoiceNumber: row.invoice_number,
    notes: details.notes,
    deliveryAddress: details.deliveryAddress,
    postcode: details.postcode,
    lineItems: details.lineItems,
    total: details.total,
    currency: details.currency,
    courierBookedDate: details.courierBookedDate,
    status: row.status,
    courierRequired: row.courier_required,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function listJobs(date?: string) {
  let query = client()
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (date) query = query.eq("work_date", date);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return (data as JobRow[]).map(toJob);
}

export async function createJob(input: JobInput) {
  const details: StoredJobDetails = {
    version: 1,
    notes: input.notes,
    deliveryAddress: input.deliveryAddress,
    postcode: input.postcode,
    lineItems: input.lineItems,
    total: input.total,
    currency: input.currency,
    courierBookedDate: null,
  };
  const { data, error } = await client()
    .from("jobs")
    .insert({
      work_date: input.workDate,
      customer_name: input.customerName,
      suburb: input.suburb,
      source: input.source,
      job_number: input.jobNumber,
      invoice_number: input.invoiceNumber,
      notes: encodeDetails(details),
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return toJob(data as JobRow);
}

export async function updateJob(
  id: string,
  input: { status: JobStatus; courierRequired?: boolean | null; courierBookedDate?: string | null },
) {
  const update: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
    completed_at: input.status === "completed" ? new Date().toISOString() : null,
  };
  if (input.courierRequired !== undefined) {
    update.courier_required = input.courierRequired;
  }
  if (input.courierBookedDate !== undefined) {
    const { data: existing, error: readError } = await client()
      .from("jobs")
      .select("notes")
      .eq("id", id)
      .single();
    if (readError) throw new Error(`Supabase query failed: ${readError.message}`);
    const details = decodeDetails(existing.notes as string | null);
    details.courierBookedDate = input.courierBookedDate;
    update.notes = encodeDetails(details);
  }

  const { data, error } = await client()
    .from("jobs")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Supabase update failed: ${error.message}`);
  return toJob(data as JobRow);
}
