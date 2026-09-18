-- Run once in the selected shared project's SQL Editor. Never use the
-- project's service-role key for Napoli's shared-project deployment.
begin;
create role napoli_api login nosuperuser nocreatedb nocreaterole noinherit nobypassrls connection limit 3;
alter role napoli_api set statement_timeout = '5s';
alter role napoli_api set lock_timeout = '2s';
alter role napoli_api set idle_in_transaction_session_timeout = '5s';
create schema napoli;
revoke all on schema napoli from public, anon, authenticated;
grant usage on schema napoli to napoli_api;
create table napoli.orders (
  id text primary key check (id ~ '^nap_[a-f0-9]{32}$'),
  idempotency_key text not null unique,
  order_payload jsonb not null,
  created_at timestamptz not null default now()
);
create table napoli.order_events (
  id bigint generated always as identity primary key,
  order_id text not null references napoli.orders(id),
  status text not null check (status = 'confirmed'),
  created_at timestamptz not null default now(),
  unique(order_id, status)
);
alter table napoli.orders enable row level security;
alter table napoli.order_events enable row level security;
revoke all on all tables in schema napoli from public, anon, authenticated;
revoke all on all sequences in schema napoli from public, anon, authenticated;
grant select, insert on napoli.orders, napoli.order_events to napoli_api;
grant usage on sequence napoli.order_events_id_seq to napoli_api;
create policy napoli_server_read on napoli.orders for select to napoli_api using (true);
create policy napoli_server_create on napoli.orders for insert to napoli_api with check (true);
create policy napoli_event_read on napoli.order_events for select to napoli_api using (true);
create policy napoli_event_create on napoli.order_events for insert to napoli_api with check (true);
commit;

-- Set a generated password separately, transfer it directly to Vercel's
-- NAPOLI_DATABASE_URL secret, and never save the returned credential in Git.
