# MIC Invoice Importer

A Next.js + TypeScript operations MVP. It tracks daily jobs from order opening
through stock picking, courier booking, and completion. It also imports text-based
Xero invoice PDFs without OCR or AI, stores originals in Cloudflare R2, and saves
records in Supabase.

## Requirements

- Node.js 20.9 or newer
- A Cloudflare R2 bucket and API token with object write permission
- A Supabase project

## Setup

1. Install dependencies:

   ```bash
   corepack pnpm install
   ```

2. Run the complete `supabase/schema.sql` in the Supabase SQL Editor. It is
   safe to run again after an earlier version; it creates missing tables and indexes.

3. Fill in the empty values in `.env.local`:

   - `SUPABASE_URL`: project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key, never the anon key
   - `R2_ACCOUNT_ID`: Cloudflare account ID
   - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: R2 API credentials
   - `R2_BUCKET_NAME`: destination bucket name

   All credentials are read only by server modules. Do not add `NEXT_PUBLIC_`
   prefixes. `.env.local` is ignored by Git.

4. Start development:

   ```bash
   corepack pnpm dev
   ```

   Open http://localhost:3000. Create and manage daily jobs from the main board;
   expand Invoice PDF intake to upload a text-based PDF up to 10 MB.

## Validation

```bash
corepack pnpm test
corepack pnpm lint
corepack pnpm build
corepack pnpm db:check
```

The build does not require credentials. A real upload requires all environment
variables and the Supabase schema.

## Current scope

- One PDF per request
- Text PDFs only; scans are rejected instead of sent to OCR
- Basic best-effort extraction of invoice number, contact, dates, amount, and currency
- Private R2 object storage; the browser never receives R2 or Supabase credentials
- Daily job board with date filtering and local search
- Optional customer, suburb, source, reference, invoice number, and notes
- Guided picking and courier workflow with colour-coded progress

For production, add authentication, rate limiting, malware scanning, a retry or
cleanup strategy for partial R2/Supabase failures, and invoice review/editing.
