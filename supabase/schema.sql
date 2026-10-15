create extension if not exists pgcrypto;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  original_file_name text not null,
  r2_object_key text not null unique,
  raw_text text not null,
  invoice_number text,
  contact_name text,
  invoice_date date,
  due_date date,
  total_amount numeric(14, 2),
  currency text,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

-- The MVP writes with the server-only service role key, which bypasses RLS.
-- Add authenticated read policies later when a user-facing invoice list is introduced.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  work_date date not null default current_date,
  customer_name text,
  suburb text,
  source text,
  job_number text,
  invoice_number text,
  notes text,
  status text not null default 'opened'
    check (status in ('opened', 'picking', 'picked', 'courier_needed', 'courier_booked', 'completed')),
  courier_required boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists jobs_work_date_idx on public.jobs (work_date desc);
create index if not exists jobs_status_idx on public.jobs (status);

alter table public.jobs enable row level security;
