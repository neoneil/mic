import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
if (required.some((key) => !process.env[key])) {
  console.error("Supabase credentials are missing from .env.local.");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const checks = {
  invoices: "id,original_file_name,r2_object_key,raw_text",
  jobs: "id,work_date,customer_name,suburb,source,job_number,invoice_number,notes,status,courier_required,created_at,updated_at,completed_at",
};

let failed = false;
for (const [table, columns] of Object.entries(checks)) {
  const { error } = await supabase
    .from(table)
    .select(columns)
    .limit(1);
  if (error) {
    failed = true;
    console.error(`✗ ${table}: ${error.message}`);
  } else {
    console.log(`✓ ${table}: ready`);
  }
}

if (failed) process.exit(1);
