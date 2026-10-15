import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import type { ExtractedFields } from "@/lib/invoice-parser";

export async function saveInvoice(input: {
  id: string;
  fileName: string;
  bytes: Uint8Array;
  text: string;
  fields: ExtractedFields;
}) {
  const env = getServerEnv();
  const objectKey = `invoices/${new Date().toISOString().slice(0, 10)}/${input.id}.pdf`;
  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  await r2.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: objectKey,
    Body: input.bytes,
    ContentType: "application/pdf",
    Metadata: { originalName: encodeURIComponent(input.fileName) },
  }));

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("invoices").insert({
    id: input.id,
    original_file_name: input.fileName,
    r2_object_key: objectKey,
    raw_text: input.text,
    invoice_number: input.fields.invoiceNumber,
    contact_name: input.fields.contactName,
    invoice_date: input.fields.invoiceDate,
    due_date: input.fields.dueDate,
    total_amount: input.fields.total?.replaceAll(",", "") ?? null,
    currency: input.fields.currency,
  });

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return objectKey;
}
