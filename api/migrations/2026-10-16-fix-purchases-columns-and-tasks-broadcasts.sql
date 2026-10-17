-- AMZ Prints ERP — targeted fix for confirmed live schema drift.
--
-- What this fixes (confirmed against the live Supabase project on 2026-10-16):
--   1. The `purchases` table is missing 6 columns that the already-deployed
--      Purchase Order screens/API (shipped in PR #46) read and write:
--      expected_delivery_date, actual_delivery_date, paid_amount,
--      vendor_invoice_number, linked_order_id, notes.
--      Without these columns, saving/loading a PO's delivery date or payable
--      tracking silently fails or 500s against the live API.
--   2. The `internal_tasks`, `broadcasts`, and `broadcast_sends` tables do not
--      exist at all, so the already-deployed Tasks and Broadcasts modules are
--      completely broken in production (every request 500s).
--
-- Safety: every statement below is additive and idempotent (`if not exists`),
-- matching the convention already used throughout api/schema.sql. It does not
-- touch, alter the type of, or delete any existing column, row, or table, so
-- it is safe to run against the live database with existing data in place.
-- It is also safe to re-run this file more than once.
--
-- How to run (no database password required):
--   Supabase dashboard → select the project → SQL Editor → New query →
--   paste this entire file → Run.
--
-- This exact content is also captured permanently in api/schema.sql (the
-- `purchases` ALTERs near the `purchases` table, and the
-- `internal_tasks` / `broadcasts` / `broadcast_sends` tables near the end),
-- so any brand-new Supabase project created from schema.sql going forward
-- already includes all of this and does not need this file.

-- ===== 1. Purchase Order columns (PR #46 already ships code expecting these) =====
alter table purchases add column if not exists paid_amount numeric default 0;
alter table purchases add column if not exists vendor_invoice_number text default '';
alter table purchases add column if not exists expected_delivery_date text default '';
alter table purchases add column if not exists actual_delivery_date text default '';
alter table purchases add column if not exists linked_order_id text default '';
alter table purchases add column if not exists notes text default '';

-- ===== 2. Internal Tasks + Customer Broadcasts (already-shipped modules) =====
create table if not exists internal_tasks (
  id text primary key,
  title text default '',
  description text default '',
  assignee_id text default '',
  assignee_name text default '',
  priority text default 'Medium',
  status text default 'Pending',
  deadline text default '',
  created_by text default '',
  created_by_name text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists internal_tasks_assignee_idx on internal_tasks (assignee_id);
create index if not exists internal_tasks_status_idx on internal_tasks (status);

create table if not exists broadcasts (
  id text primary key,
  title text default '',
  message text default '',
  image text default '',
  created_by text default '',
  created_by_name text default '',
  created_at timestamptz default now()
);

create table if not exists broadcast_sends (
  id text primary key,
  broadcast_id text not null,
  customer_id text default '',
  customer_name text default '',
  customer_phone text default '',
  status text default 'opened',
  sent_at timestamptz default now()
);
create index if not exists broadcast_sends_broadcast_idx on broadcast_sends (broadcast_id);

-- Verify afterwards with (should return 0 rows / no errors):
--   select column_name from information_schema.columns
--     where table_name = 'purchases'
--     and column_name in ('paid_amount','vendor_invoice_number','expected_delivery_date','actual_delivery_date','linked_order_id','notes');
--   -- expect all 6 rows back
--   select to_regclass('public.internal_tasks'), to_regclass('public.broadcasts'), to_regclass('public.broadcast_sends');
--   -- expect all 3 to be non-null
