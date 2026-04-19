-- WIS CRM schema
-- Run this entire file in Supabase SQL editor

create extension if not exists pgcrypto;

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  channel text not null default 'otro',
  stage text not null default 'frio',
  source text not null default 'manual',
  notes text,
  estimated_value numeric,
  birthday date,
  last_contact_at timestamptz,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prospects_channel_check check (channel in ('whatsapp', 'linkedin', 'email', 'referido', 'telegram', 'otro')),
  constraint prospects_stage_check check (stage in ('frio', 'contactado', 'reunion', 'propuesta', 'cliente'))
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activities_type_check check (type in ('contacto', 'reunion', 'propuesta', 'nota', 'stage_change', 'follow_up', 'recordatorio', 'mensaje'))
);

create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  title text not null,
  notes text,
  due_at timestamptz not null,
  status text not null default 'pendiente',
  priority text not null default 'media',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint follow_ups_status_check check (status in ('pendiente', 'hecho')),
  constraint follow_ups_priority_check check (priority in ('baja', 'media', 'alta'))
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete set null,
  title text not null,
  message text,
  remind_at timestamptz not null,
  status text not null default 'pendiente',
  category text not null default 'manual',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint reminders_status_check check (status in ('pendiente', 'enviado', 'hecho')),
  constraint reminders_category_check check (category in ('manual', 'cumpleanos', 'seguimiento', 'sugerencia_diaria'))
);

create table if not exists raw_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete set null,
  source text not null default 'telegram',
  direction text not null,
  kind text not null default 'text',
  content text,
  telegram_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint raw_messages_direction_check check (direction in ('inbound', 'outbound')),
  constraint raw_messages_kind_check check (kind in ('text', 'audio', 'system'))
);

alter table prospects add column if not exists source text not null default 'manual';
alter table prospects add column if not exists birthday date;
alter table prospects add column if not exists last_contact_at timestamptz;
alter table prospects add column if not exists next_action_at timestamptz;

alter table activities add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table follow_ups add column if not exists updated_at timestamptz not null default now();
alter table reminders add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at on prospects;
create trigger set_updated_at
before update on prospects
for each row execute function update_updated_at();

drop trigger if exists set_follow_ups_updated_at on follow_ups;
create trigger set_follow_ups_updated_at
before update on follow_ups
for each row execute function update_updated_at();

drop trigger if exists set_reminders_updated_at on reminders;
create trigger set_reminders_updated_at
before update on reminders
for each row execute function update_updated_at();

create index if not exists idx_prospects_stage on prospects(stage);
create index if not exists idx_prospects_company on prospects(company);
create index if not exists idx_follow_ups_due_at on follow_ups(due_at);
create index if not exists idx_follow_ups_status on follow_ups(status);
create index if not exists idx_reminders_remind_at on reminders(remind_at);
create index if not exists idx_reminders_status on reminders(status);
create index if not exists idx_raw_messages_created_at on raw_messages(created_at desc);
create index if not exists idx_raw_messages_prospect_id on raw_messages(prospect_id);

alter table prospects enable row level security;
alter table activities enable row level security;
alter table follow_ups enable row level security;
alter table reminders enable row level security;
alter table raw_messages enable row level security;

drop policy if exists "Allow all on prospects" on prospects;
create policy "Allow all on prospects" on prospects for all using (true) with check (true);

drop policy if exists "Allow all on activities" on activities;
create policy "Allow all on activities" on activities for all using (true) with check (true);

drop policy if exists "Allow all on follow_ups" on follow_ups;
create policy "Allow all on follow_ups" on follow_ups for all using (true) with check (true);

drop policy if exists "Allow all on reminders" on reminders;
create policy "Allow all on reminders" on reminders for all using (true) with check (true);

drop policy if exists "Allow all on raw_messages" on raw_messages;
create policy "Allow all on raw_messages" on raw_messages for all using (true) with check (true);

create or replace view crm_daily_brief as
select
  (select count(*) from prospects) as total_prospects,
  (select count(*) from prospects where stage = 'cliente') as total_clientes,
  (select count(*) from follow_ups where status = 'pendiente' and due_at <= now()) as follow_ups_vencidos,
  (select count(*) from reminders where status = 'pendiente' and remind_at <= now()) as reminders_vencidos,
  (select count(*) from raw_messages where direction = 'inbound' and created_at >= now() - interval '24 hours') as mensajes_ultimas_24h;
