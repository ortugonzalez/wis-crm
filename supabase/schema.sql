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

create table if not exists monthly_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  month date not null,
  target_value integer not null default 1,
  current_value integer not null default 0,
  unit text not null default 'acciones',
  business_area text not null default 'general',
  status text not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_goals_status_check check (status in ('activo', 'pausado', 'cumplido', 'cancelado')),
  constraint monthly_goals_target_check check (target_value >= 0),
  constraint monthly_goals_current_check check (current_value >= 0)
);

create table if not exists goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references monthly_goals(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'otro',
  target_count integer not null default 1,
  completed_count integer not null default 0,
  status text not null default 'pendiente',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_tasks_category_check check (category in ('contactos', 'emails', 'llamadas', 'propuestas', 'reuniones', 'linkedin', 'scraping', 'estrategia', 'follow_up', 'otro')),
  constraint goal_tasks_status_check check (status in ('pendiente', 'hecho')),
  constraint goal_tasks_target_check check (target_count >= 0),
  constraint goal_tasks_completed_check check (completed_count >= 0)
);

create table if not exists daily_work_plans (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null default current_date,
  summary text not null,
  priorities jsonb not null default '[]'::jsonb,
  score_start integer,
  generated_by text not null default 'n8n',
  created_at timestamptz not null default now(),
  constraint daily_work_plans_score_check check (score_start is null or (score_start >= 0 and score_start <= 100))
);

create table if not exists daily_closeouts (
  id uuid primary key default gen_random_uuid(),
  closeout_date date not null default current_date,
  raw_text text not null,
  summary text,
  wins text,
  blockers text,
  tomorrow_focus text,
  created_at timestamptz not null default now()
);

create table if not exists daily_work_scores (
  id uuid primary key default gen_random_uuid(),
  score_date date not null default current_date,
  score integer not null default 0,
  source text not null default 'telegram_closeout',
  closeout_id uuid references daily_closeouts(id) on delete set null,
  contacts_count integer not null default 0,
  follow_ups_done integer not null default 0,
  proposals_sent integer not null default 0,
  meetings_count integer not null default 0,
  goal_progress_points integer not null default 0,
  notes text,
  recommendations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_work_scores_score_check check (score >= 0 and score <= 100)
);

create table if not exists sales_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text,
  business_area text not null default 'general',
  target_channel text not null default 'otro',
  target_count integer not null default 1,
  completed_count integer not null default 0,
  daily_target integer not null default 10,
  start_date date default current_date,
  end_date date,
  goal_id uuid references monthly_goals(id) on delete set null,
  notes text,
  status text not null default 'activa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_campaigns_status_check check (status in ('activa', 'pausada', 'cerrada'))
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null default 'whatsapp',
  use_case text not null default 'follow_up',
  tone text not null default 'directo',
  body text not null,
  success_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commercial_playbooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text not null default 'general',
  channel text not null default 'whatsapp',
  opening_message text not null,
  follow_up_message text not null,
  proposal_angle text not null,
  qualification_questions jsonb not null default '[]'::jsonb,
  status text not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_playbooks_status_check check (status in ('activo', 'pausado'))
);

create table if not exists secretary_tasks (
  id uuid primary key default gen_random_uuid(),
  task_date date not null default current_date,
  task_type text not null default 'micro_mission',
  title text not null,
  instruction text not null,
  expected_response text,
  status text not null default 'pendiente',
  priority text not null default 'media',
  step_number integer not null default 1,
  due_at timestamptz,
  reminded_at timestamptz,
  completed_at timestamptz,
  attempts integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint secretary_tasks_status_check check (status in ('pendiente', 'en_progreso', 'hecha', 'postergada', 'cancelada')),
  constraint secretary_tasks_priority_check check (priority in ('baja', 'media', 'alta')),
  constraint secretary_tasks_attempts_check check (attempts >= 0)
);

create table if not exists secretary_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  summary text not null,
  raw_text text,
  task_id uuid references secretary_tasks(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists secretary_preferences (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'ortu' unique,
  mode text not null default 'normal',
  work_start_hour integer not null default 9,
  work_end_hour integer not null default 18,
  reminder_minutes integer not null default 45,
  max_attempts integer not null default 3,
  max_open_tasks integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint secretary_preferences_mode_check check (mode in ('liviano', 'normal', 'sprint', 'pausa')),
  constraint secretary_preferences_hours_check check (work_start_hour between 0 and 23 and work_end_hour between 0 and 23),
  constraint secretary_preferences_positive_check check (reminder_minutes > 0 and max_attempts > 0 and max_open_tasks > 0)
);

create table if not exists work_activity_log (
  id uuid primary key default gen_random_uuid(),
  activity_date date not null default current_date,
  type text not null,
  quantity integer not null default 1,
  title text not null,
  notes text,
  prospect_id uuid references prospects(id) on delete set null,
  goal_id uuid references monthly_goals(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint work_activity_log_type_check check (type in ('contacto', 'email', 'llamada', 'propuesta', 'reunion', 'linkedin', 'scraping', 'follow_up', 'estrategia', 'otro')),
  constraint work_activity_log_quantity_check check (quantity > 0)
);

alter table prospects add column if not exists source text not null default 'manual';
alter table prospects add column if not exists birthday date;
alter table prospects add column if not exists last_contact_at timestamptz;
alter table prospects add column if not exists next_action_at timestamptz;
alter table monthly_goals add column if not exists business_area text not null default 'general';
alter table daily_work_scores add column if not exists source text not null default 'telegram_closeout';
alter table daily_work_scores add column if not exists closeout_id uuid references daily_closeouts(id) on delete set null;
alter table daily_work_scores drop constraint if exists daily_work_scores_score_date_key;
alter table sales_campaigns add column if not exists objective text;
alter table sales_campaigns add column if not exists daily_target integer not null default 10;
alter table sales_campaigns add column if not exists start_date date default current_date;
alter table sales_campaigns add column if not exists end_date date;
alter table sales_campaigns add column if not exists goal_id uuid references monthly_goals(id) on delete set null;
alter table sales_campaigns add column if not exists notes text;
alter table message_templates add column if not exists tone text not null default 'directo';
alter table message_templates add column if not exists success_count integer not null default 0;
insert into secretary_preferences (singleton_key)
values ('ortu')
on conflict (singleton_key) do nothing;

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

drop trigger if exists set_monthly_goals_updated_at on monthly_goals;
create trigger set_monthly_goals_updated_at
before update on monthly_goals
for each row execute function update_updated_at();

drop trigger if exists set_goal_tasks_updated_at on goal_tasks;
create trigger set_goal_tasks_updated_at
before update on goal_tasks
for each row execute function update_updated_at();

drop trigger if exists set_daily_work_scores_updated_at on daily_work_scores;
create trigger set_daily_work_scores_updated_at
before update on daily_work_scores
for each row execute function update_updated_at();

drop trigger if exists set_sales_campaigns_updated_at on sales_campaigns;
create trigger set_sales_campaigns_updated_at
before update on sales_campaigns
for each row execute function update_updated_at();

drop trigger if exists set_message_templates_updated_at on message_templates;
create trigger set_message_templates_updated_at
before update on message_templates
for each row execute function update_updated_at();

drop trigger if exists set_commercial_playbooks_updated_at on commercial_playbooks;
create trigger set_commercial_playbooks_updated_at
before update on commercial_playbooks
for each row execute function update_updated_at();

drop trigger if exists set_secretary_tasks_updated_at on secretary_tasks;
create trigger set_secretary_tasks_updated_at
before update on secretary_tasks
for each row execute function update_updated_at();

drop trigger if exists set_secretary_preferences_updated_at on secretary_preferences;
create trigger set_secretary_preferences_updated_at
before update on secretary_preferences
for each row execute function update_updated_at();

create index if not exists idx_prospects_stage on prospects(stage);
create index if not exists idx_prospects_company on prospects(company);
create index if not exists idx_follow_ups_due_at on follow_ups(due_at);
create index if not exists idx_follow_ups_status on follow_ups(status);
create index if not exists idx_reminders_remind_at on reminders(remind_at);
create index if not exists idx_reminders_status on reminders(status);
create index if not exists idx_raw_messages_created_at on raw_messages(created_at desc);
create index if not exists idx_raw_messages_prospect_id on raw_messages(prospect_id);
create index if not exists idx_monthly_goals_month on monthly_goals(month);
create index if not exists idx_monthly_goals_status on monthly_goals(status);
create index if not exists idx_goal_tasks_goal_id on goal_tasks(goal_id);
create index if not exists idx_goal_tasks_due_date on goal_tasks(due_date);
create index if not exists idx_daily_work_plans_plan_date on daily_work_plans(plan_date desc);
create index if not exists idx_work_activity_log_activity_date on work_activity_log(activity_date desc);
create index if not exists idx_work_activity_log_goal_id on work_activity_log(goal_id);
create index if not exists idx_daily_closeouts_closeout_date on daily_closeouts(closeout_date desc);
create index if not exists idx_daily_work_scores_score_date on daily_work_scores(score_date desc);
create index if not exists idx_sales_campaigns_status on sales_campaigns(status);
create index if not exists idx_sales_campaigns_goal_id on sales_campaigns(goal_id);
create index if not exists idx_sales_campaigns_dates on sales_campaigns(start_date, end_date);
create index if not exists idx_message_templates_use_case on message_templates(use_case);
create index if not exists idx_commercial_playbooks_status on commercial_playbooks(status);
create index if not exists idx_commercial_playbooks_segment on commercial_playbooks(segment);
create index if not exists idx_secretary_tasks_status on secretary_tasks(status);
create index if not exists idx_secretary_tasks_task_date on secretary_tasks(task_date desc);
create index if not exists idx_secretary_tasks_due_at on secretary_tasks(due_at);
create index if not exists idx_secretary_events_created_at on secretary_events(created_at desc);

alter table prospects enable row level security;
alter table activities enable row level security;
alter table follow_ups enable row level security;
alter table reminders enable row level security;
alter table raw_messages enable row level security;
alter table monthly_goals enable row level security;
alter table goal_tasks enable row level security;
alter table daily_work_plans enable row level security;
alter table daily_work_scores enable row level security;
alter table work_activity_log enable row level security;
alter table daily_closeouts enable row level security;
alter table sales_campaigns enable row level security;
alter table message_templates enable row level security;
alter table commercial_playbooks enable row level security;
alter table secretary_tasks enable row level security;
alter table secretary_events enable row level security;
alter table secretary_preferences enable row level security;

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

drop policy if exists "Allow all on monthly_goals" on monthly_goals;
create policy "Allow all on monthly_goals" on monthly_goals for all using (true) with check (true);

drop policy if exists "Allow all on goal_tasks" on goal_tasks;
create policy "Allow all on goal_tasks" on goal_tasks for all using (true) with check (true);

drop policy if exists "Allow all on daily_work_plans" on daily_work_plans;
create policy "Allow all on daily_work_plans" on daily_work_plans for all using (true) with check (true);

drop policy if exists "Allow all on daily_work_scores" on daily_work_scores;
create policy "Allow all on daily_work_scores" on daily_work_scores for all using (true) with check (true);

drop policy if exists "Allow all on work_activity_log" on work_activity_log;
create policy "Allow all on work_activity_log" on work_activity_log for all using (true) with check (true);

drop policy if exists "Allow all on daily_closeouts" on daily_closeouts;
create policy "Allow all on daily_closeouts" on daily_closeouts for all using (true) with check (true);

drop policy if exists "Allow all on sales_campaigns" on sales_campaigns;
create policy "Allow all on sales_campaigns" on sales_campaigns for all using (true) with check (true);

drop policy if exists "Allow all on message_templates" on message_templates;
create policy "Allow all on message_templates" on message_templates for all using (true) with check (true);

drop policy if exists "Allow all on commercial_playbooks" on commercial_playbooks;
create policy "Allow all on commercial_playbooks" on commercial_playbooks for all using (true) with check (true);

drop policy if exists "Allow all on secretary_tasks" on secretary_tasks;
create policy "Allow all on secretary_tasks" on secretary_tasks for all using (true) with check (true);

drop policy if exists "Allow all on secretary_events" on secretary_events;
create policy "Allow all on secretary_events" on secretary_events for all using (true) with check (true);

drop policy if exists "Allow all on secretary_preferences" on secretary_preferences;
create policy "Allow all on secretary_preferences" on secretary_preferences for all using (true) with check (true);

create or replace view crm_daily_brief as
select
  (select count(*) from prospects) as total_prospects,
  (select count(*) from prospects where stage = 'cliente') as total_clientes,
  (select count(*) from follow_ups where status = 'pendiente' and due_at <= now()) as follow_ups_vencidos,
  (select count(*) from reminders where status = 'pendiente' and remind_at <= now()) as reminders_vencidos,
  (select count(*) from raw_messages where direction = 'inbound' and created_at >= now() - interval '24 hours') as mensajes_ultimas_24h;

create or replace view crm_work_score_today as
with today_activity as (
  select
    coalesce(sum(quantity) filter (where type in ('contacto', 'email', 'linkedin')), 0) as contacts_count,
    coalesce(sum(quantity) filter (where type = 'follow_up'), 0) as follow_ups_done,
    coalesce(sum(quantity) filter (where type = 'propuesta'), 0) as proposals_sent,
    coalesce(sum(quantity) filter (where type = 'reunion'), 0) as meetings_count
  from work_activity_log
  where activity_date = current_date
),
goal_progress as (
  select coalesce(sum(least(20, floor((current_value::numeric / nullif(target_value, 0)) * 20)::int)), 0) as points
  from monthly_goals
  where status = 'activo'
    and date_trunc('month', month) = date_trunc('month', current_date)
)
select
  current_date as score_date,
  least(100,
    least(20, contacts_count * 2) +
    least(20, follow_ups_done * 5) +
    least(20, proposals_sent * 10) +
    least(20, meetings_count * 10) +
    least(20, points)
  ) as score,
  contacts_count,
  follow_ups_done,
  proposals_sent,
  meetings_count,
  least(20, points) as goal_progress_points
from today_activity, goal_progress;

create or replace view crm_goal_pacing as
select
  id,
  title,
  month,
  business_area,
  target_value,
  current_value,
  unit,
  status,
  greatest(1, extract(day from (date_trunc('month', month) + interval '1 month - 1 day'))::int) as days_in_month,
  extract(day from least(current_date, (date_trunc('month', month) + interval '1 month - 1 day')::date))::int as day_of_month,
  ceil((target_value::numeric / greatest(1, extract(day from (date_trunc('month', month) + interval '1 month - 1 day'))::int)) * extract(day from least(current_date, (date_trunc('month', month) + interval '1 month - 1 day')::date)))::int as expected_by_today,
  greatest(0, ceil((target_value::numeric / greatest(1, extract(day from (date_trunc('month', month) + interval '1 month - 1 day'))::int)) * extract(day from least(current_date, (date_trunc('month', month) + interval '1 month - 1 day')::date)))::int - current_value) as behind_by,
  case
    when current_value >= target_value then 'cumplido'
    when current_value >= ceil((target_value::numeric / greatest(1, extract(day from (date_trunc('month', month) + interval '1 month - 1 day'))::int)) * extract(day from least(current_date, (date_trunc('month', month) + interval '1 month - 1 day')::date))) then 'verde'
    when current_value + 1 >= ceil((target_value::numeric / greatest(1, extract(day from (date_trunc('month', month) + interval '1 month - 1 day'))::int)) * extract(day from least(current_date, (date_trunc('month', month) + interval '1 month - 1 day')::date))) then 'amarillo'
    else 'rojo'
  end as pace_status
from monthly_goals;

create or replace view crm_activity_ranking_30d as
select
  type,
  sum(quantity) as total_quantity,
  count(*) as entries_count
from work_activity_log
where activity_date >= current_date - interval '30 days'
group by type
order by total_quantity desc;

create or replace view crm_abandoned_prospects as
select *
from prospects
where stage <> 'cliente'
  and coalesce(last_contact_at, updated_at, created_at) < now() - interval '14 days'
order by coalesce(last_contact_at, updated_at, created_at) asc;

create or replace view crm_upcoming_birthdays as
select
  *,
  make_date(extract(year from current_date)::int, extract(month from birthday)::int, extract(day from birthday)::int) as birthday_this_year
from prospects
where birthday is not null
  and make_date(extract(year from current_date)::int, extract(month from birthday)::int, extract(day from birthday)::int)
    between current_date and current_date + interval '14 days'
order by birthday_this_year asc;

create or replace view crm_pipeline_future_signal as
select
  (select count(*) from prospects where stage = 'reunion') as reuniones_en_pipeline,
  (select count(*) from prospects where stage = 'propuesta') as propuestas_en_pipeline,
  (select count(*) from follow_ups where status = 'pendiente' and due_at between now() and now() + interval '14 days') as followups_proximos_14d;

create or replace view crm_commercial_forecast as
with month_goals as (
  select coalesce(sum(target_value), 0) as target_clients, coalesce(sum(current_value), 0) as current_clients
  from monthly_goals
  where status = 'activo'
    and unit in ('clientes', 'cliente', 'cierres', 'cierre')
    and date_trunc('month', month) = date_trunc('month', current_date)
),
pipeline as (
  select
    coalesce(sum(case stage when 'contactado' then 0.15 when 'reunion' then 0.35 when 'propuesta' then 0.6 when 'cliente' then 1 else 0.05 end), 0) as weighted_pipeline,
    count(*) filter (where stage = 'reunion') as meetings,
    count(*) filter (where stage = 'propuesta') as proposals
  from prospects
)
select
  target_clients,
  current_clients,
  weighted_pipeline,
  meetings,
  proposals,
  current_clients + floor(weighted_pipeline)::int as projected_clients,
  case
    when target_clients = 0 then 'amarillo'
    when current_clients + floor(weighted_pipeline)::int >= target_clients then 'verde'
    when meetings + proposals >= greatest(1, target_clients - current_clients) then 'amarillo'
    else 'rojo'
  end as forecast_status
from month_goals, pipeline;

create or replace view crm_campaign_dashboard as
select
  sc.*,
  greatest(0, sc.target_count - sc.completed_count) as remaining_count,
  case
    when sc.target_count = 0 then 0
    else round((sc.completed_count::numeric / sc.target_count::numeric) * 100)
  end as progress_percent,
  coalesce(sum(wal.quantity), 0) as logged_actions
from sales_campaigns sc
left join work_activity_log wal on wal.metadata->>'campaign_id' = sc.id::text
group by sc.id;

create or replace view crm_secretary_open_task as
select *
from secretary_tasks
where status in ('pendiente', 'en_progreso')
order by created_at desc
limit 1;

create or replace view crm_secretary_today as
select
  current_date as task_date,
  count(*) filter (where status = 'hecha') as completed_tasks,
  count(*) filter (where status in ('pendiente', 'en_progreso')) as open_tasks,
  count(*) filter (where status = 'postergada') as postponed_tasks,
  coalesce(max(step_number), 0) as current_step
from secretary_tasks
where task_date = current_date;
