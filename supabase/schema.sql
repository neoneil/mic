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

create table if not exists public.part_cross_reference (
  id bigint generated always as identity primary key,
  brand text not null,
  model text,
  mic_code text not null,
  part_number text not null,
  part_number_normalized text not null,
  chinese_name text,
  description text,
  source text not null default 'Seven Brands',
  source_updated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists part_cross_reference_part_number_idx
  on public.part_cross_reference (part_number_normalized);

alter table public.part_cross_reference enable row level security;

alter table public.part_cross_reference
  add column if not exists chinese_name text;

