-- AMZ ERP — Internal tasks + customer broadcasts (safe to re-run)

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
