-- AMZ Prints ERP — Supabase schema (replaces Google Sheets)
-- Run once in Supabase SQL Editor (Hostinger → Supabase → SQL)

create extension if not exists "pgcrypto";

-- ========== USERS ==========
create table if not exists users (
  id text primary key,
  username text unique not null,
  password text not null default '',
  name text default '',
  role text default 'Admin',
  status text default 'Active',
  permissions jsonb default '[]'::jsonb,
  email text default '',
  employee_id text default '',
  created_at timestamptz default now()
);

-- ========== CUSTOMERS + CRM ==========
create table if not exists customers (
  id text primary key,
  name text default '',
  phone text default '',
  email text default '',
  address text default '',
  city text default '',
  notes text default '',
  in_crm boolean default false,
  stage text default '',
  stage_updated_at text default '',
  notify_whatsapp boolean default true,
  notify_email boolean default true,
  portal_password text default '',
  created_at timestamptz default now()
);
alter table customers add column if not exists portal_password text;
-- Office tracking code + block/unblock controls
alter table customers add column if not exists customer_code text default '';
alter table customers add column if not exists blocked boolean default false;
alter table customers add column if not exists block_reason text default '';
alter table customers add column if not exists blocked_at text default '';
alter table customers add column if not exists blocked_by text default '';
create index if not exists customers_phone_idx on customers (phone);
create index if not exists customers_in_crm_idx on customers (in_crm);
create index if not exists customers_code_idx on customers (customer_code);

create table if not exists crm_notes (
  id text primary key,
  customer_id text not null references customers(id) on delete cascade,
  note text not null default '',
  created_at text default '',
  created_by text default 'staff'
);
create index if not exists crm_notes_customer_idx on crm_notes (customer_id);

-- ========== EMPLOYEES ==========
create table if not exists employees (
  id text primary key,
  employee_code text default '',
  name text default '',
  phone text default '',
  email text default '',
  cnic text default '',
  role text default 'Staff',
  designation text default '',
  department text default 'General',
  join_date text default '',
  end_date text default '',
  valid_from text default '',
  valid_until text default '',
  salary numeric default 0,
  status text default 'Active',
  address text default '',
  city text default '',
  emergency_contact text default '',
  emergency_phone text default '',
  notes text default '',
  photo text default '',
  created_at timestamptz default now()
);

-- alter table employees add column if not exists end_date text default '';
-- alter table employees add column if not exists valid_from text default '';
-- alter table employees add column if not exists valid_until text default '';
-- alter table users add column if not exists employee_id text default '';

-- ========== PRODUCTS ==========
create table if not exists products (
  id text primary key,
  name text default '',
  category text default '',
  rate numeric default 0,
  unit text default '',
  description text default '',
  status text default 'Active',
  product_type text default 'Product',
  designer text default '',
  stock numeric default 0,
  material text default '',
  size text default '',
  min_quantity numeric default 0,
  image text default '',
  created_at timestamptz default now()
);

-- alter table products add column if not exists image text default '';

-- ========== ORDERS (+ quotations / POS via doc_type) ==========
create table if not exists orders (
  id text primary key,
  order_id text,
  date text default '',
  customer_id text default '',
  customer_name text default '',
  customer_phone text default '',
  customer_email text default '',
  customer_address text default '',
  status text default 'Order Received',
  delivery_date text default '',
  products jsonb default '[]'::jsonb,
  total_amount numeric default 0,
  advance_payment numeric default 0,
  balance_amount numeric default 0,
  remarks text default '',
  assigned_designer text default '',
  token_no text default '',
  doc_type text default 'Order',
  tracking_number text default '',
  status_history jsonb default '[]'::jsonb,
  delivery_address text default '',
  quotation_id text default '',
  payment_method text default '',
  created_at timestamptz default now()
);

-- Optional website-commerce columns (safe to re-run)
alter table orders add column if not exists payment_status text default '';
alter table orders add column if not exists payment_history jsonb default '[]'::jsonb;
alter table orders add column if not exists order_source text default '';
alter table orders add column if not exists subtotal numeric default 0;
alter table orders add column if not exists discount_amount numeric default 0;
alter table orders add column if not exists delivery_charges numeric default 0;

create index if not exists orders_doc_type_idx on orders (doc_type);
create index if not exists orders_order_id_idx on orders (order_id);
create index if not exists orders_tracking_idx on orders (tracking_number);

-- ========== INVOICES ==========
create table if not exists invoices (
  id text primary key,
  invoice_no text,
  date text default '',
  due_date text default '',
  order_id text default '',
  customer_id text default '',
  customer_name text default '',
  customer_phone text default '',
  customer_email text default '',
  customer_address text default '',
  items jsonb default '[]'::jsonb,
  subtotal numeric default 0,
  tax_rate numeric default 0,
  tax numeric default 0,
  discount numeric default 0,
  previous_balance numeric default 0,
  total numeric default 0,
  paid numeric default 0,
  status text default 'Unpaid',
  notes text default '',
  share_token text default '',
  created_at timestamptz default now()
);
create index if not exists invoices_share_token_idx on invoices (share_token);

-- ========== VENDORS / PURCHASES ==========
create table if not exists vendors (
  id text primary key,
  name text default '',
  phone text default '',
  email text default '',
  address text default '',
  notes text default '',
  contact_person text default '',
  category text default '',
  payment_terms text default '',
  tax_id text default '',
  created_at timestamptz default now()
);

create table if not exists purchases (
  id text primary key,
  purchase_no text,
  date text default '',
  vendor_id text default '',
  vendor_name text default '',
  vendor_invoice_number text default '',
  expected_delivery_date text default '',
  actual_delivery_date text default '',
  linked_order_id text default '',
  items jsonb default '[]'::jsonb,
  total numeric default 0,
  paid_amount numeric default 0,
  status text default 'Draft',
  notes text default '',
  created_at timestamptz default now()
);

-- Existing projects: run once in SQL editor if columns missing
-- alter table purchases add column if not exists paid_amount numeric default 0;
-- alter table purchases add column if not exists vendor_invoice_number text default '';
-- alter table purchases add column if not exists expected_delivery_date text default '';
-- alter table purchases add column if not exists actual_delivery_date text default '';
-- alter table purchases add column if not exists linked_order_id text default '';
-- alter table purchases add column if not exists notes text default '';

-- ========== EXPENSES / PAYMENTS ==========
create table if not exists expenses (
  id text primary key,
  date text default '',
  category text default '',
  amount numeric default 0,
  description text default '',
  payment_method text default '',
  created_at timestamptz default now()
);

create table if not exists payments (
  id text primary key,
  date text default '',
  type text default 'inflow',
  category text default '',
  ref_id text default '',
  customer_name text default '',
  customer_id text default '',
  party_phone text default '',
  amount numeric default 0,
  method text default '',
  notes text default '',
  balance_due numeric default 0,
  total_amount numeric default 0,
  created_at timestamptz default now()
);

-- ========== COUNTERS + TOKENS ==========
create table if not exists counters (
  id text primary key,
  counter_name text not null,
  access_holder text default '',
  prefix text default 'T',
  last_number integer default 0,
  status text default 'Active',
  created_at timestamptz default now()
);

create table if not exists tokens (
  id text primary key,
  token_no text,
  date text default '',
  time text default '',
  customer_id text default '',
  customer_name text default '',
  customer_phone text default '',
  service text default '',
  service_note text default '',
  token_status text default 'Waiting',
  called_at text default '',
  order_id text default '',
  notes text default '',
  counter_name text default '',
  created_at timestamptz default now()
);

-- ========== SETTINGS (key/value JSON blobs) ==========
create table if not exists settings (
  key text primary key,
  value jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Seed default Walk-in customer (POS)
insert into customers (id, name, phone, notes, in_crm, notify_whatsapp, notify_email)
values ('cust_walkin', 'Walk-in', '', 'Default POS walk-in customer', false, false, false)
on conflict (id) do nothing;

-- Seed default admin (change password after first login)
insert into users (id, username, password, name, role, status, email)
values ('user_admin', 'admin', 'admin123', 'Admin', 'Super Admin', 'Active', 'admin')
on conflict (id) do nothing;
