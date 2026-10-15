import { NextResponse } from "next/server";
import { z } from "zod";
import { createJob, listJobs, updateJob } from "@/lib/jobs";
import { jobStatuses } from "@/lib/job-types";

export const runtime = "nodejs";

const optionalText = z.string().trim().max(300).optional().nullable()
  .transform((value) => value || null);

const createSchema = z.object({
  workDate: z.iso.date(),
  customerName: optionalText,
  suburb: optionalText,
  source: optionalText,
  jobNumber: optionalText,
  invoiceNumber: optionalText,
  notes: z.string().trim().max(2000).optional().nullable()
    .transform((value) => value || null),
});

const updateSchema = z.object({
  id: z.uuid(),
  status: z.enum(jobStatuses),
  courierRequired: z.boolean().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date") || undefined;
    if (date && !z.iso.date().safeParse(date).success) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    return NextResponse.json({ jobs: await listJobs(date) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the job details." }, { status: 400 });
    }
    return NextResponse.json({ job: await createJob(parsed.data) }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid job update." }, { status: 400 });
    }
    const { id, ...input } = parsed.data;
    return NextResponse.json({ job: await updateJob(id, input) });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  console.error("Job request failed", error);
  const message = error instanceof Error ? error.message : "";
  const safeMessage = message.startsWith("Server storage is not configured")
    ? message
    : "Could not save the job. Please try again.";
  return NextResponse.json({ error: safeMessage }, { status: 500 });
}
