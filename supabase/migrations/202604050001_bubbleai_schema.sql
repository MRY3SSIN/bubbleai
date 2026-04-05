create extension if not exists "pgcrypto";

create type public.risk_level as enum ('green', 'yellow', 'red');
create type public.chat_mode as enum ('text', 'voice');
create type public.insight_period as enum ('week', 'month', '6_month', 'year');
create type public.recommendation_kind as enum (
  'hydration',
  'walk',
  'stretch',
  'breathing',
  'journal',
  'sleep',
  'meal',
  'reach_out',
  'contact_clinician'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  display_name text,
  pronouns text,
  birth_year int,
  gender_identity text,
  preferred_voice text default 'neutral_calm' not null,
  menstrual_support_enabled boolean default false not null,
  onboarding_complete boolean default false not null,
  privacy_accepted_at timestamptz,
  ai_disclaimer_accepted_at timestamptz,
  crisis_disclaimer_accepted_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  smoking_habits text,
  drinking_habits text,
  medications_text text,
  symptoms_text text,
  notification_opt_in boolean default true not null,
  unique (user_id)
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  enabled boolean default true not null,
  daily_checkin boolean default true not null,
  journaling boolean default true not null,
  bedtime boolean default true not null,
  hydration boolean default true not null,
  movement boolean default false not null,
  quiet_hours_start text default '22:00' not null,
  quiet_hours_end text default '07:00' not null,
  push_token text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  unique (user_id)
);

create table if not exists public.clinician_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  relationship text,
  is_favorite boolean default false not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mood smallint not null check (mood between 1 and 5),
  stress smallint not null check (stress between 1 and 10),
  energy smallint not null check (energy between 1 and 10),
  sleep_hours numeric(4,1) not null check (sleep_hours between 0 and 24),
  overwhelm smallint not null check (overwhelm between 1 and 10),
  notes text,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value between 1 and 5),
  source text default 'daily_checkin' not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.stress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value between 1 and 10),
  source text default 'daily_checkin' not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  hours numeric(4,1) not null check (hours between 0 and 24),
  quality smallint check (quality between 1 and 5),
  source text default 'daily_checkin' not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  assessment_type text not null default 'daily_checkin',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  voice_transcript text,
  analysis_status text default 'pending' not null,
  risk_level public.risk_level default 'green' not null,
  summary text,
  themes jsonb default '[]'::jsonb not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  mode public.chat_mode default 'text' not null,
  risk_state public.risk_level default 'green' not null,
  last_message_at timestamptz default timezone('utc', now()) not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  moderation jsonb default '{}'::jsonb not null,
  risk_level public.risk_level default 'green' not null,
  response_id text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric text not null,
  period public.insight_period not null,
  title text not null,
  narrative text not null,
  chart_payload jsonb default '[]'::jsonb not null,
  created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.recommendation_kind not null,
  title text not null,
  description text not null,
  surfaced_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  source_id uuid,
  moderation_result jsonb default '{}'::jsonb not null,
  classifier_result jsonb default '{}'::jsonb not null,
  risk_level public.risk_level not null,
  escalation_path text,
  acknowledged_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null
);

create index if not exists idx_daily_checkins_user_created_at on public.daily_checkins (user_id, created_at desc);
create index if not exists idx_journal_entries_user_created_at on public.journal_entries (user_id, created_at desc);
create index if not exists idx_chat_sessions_user_updated_at on public.chat_sessions (user_id, updated_at desc);
create index if not exists idx_chat_messages_session_created_at on public.chat_messages (session_id, created_at asc);
create index if not exists idx_insights_user_metric_period on public.insights (user_id, metric, period);
create index if not exists idx_safety_events_user_created_at on public.safety_events (user_id, created_at desc);

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_notification_settings_updated_at before update on public.notification_settings for each row execute procedure public.set_updated_at();
create trigger set_journal_entries_updated_at before update on public.journal_entries for each row execute procedure public.set_updated_at();
create trigger set_chat_sessions_updated_at before update on public.chat_sessions for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.notification_settings enable row level security;
alter table public.clinician_contacts enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.mood_logs enable row level security;
alter table public.stress_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.assessments enable row level security;
alter table public.journal_entries enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.insights enable row level security;
alter table public.recommendations enable row level security;
alter table public.safety_events enable row level security;

create policy "Users manage own profiles" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own preferences" on public.preferences
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own notification settings" on public.notification_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own clinician contacts" on public.clinician_contacts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own trusted contacts" on public.trusted_contacts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own daily checkins" on public.daily_checkins
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own mood logs" on public.mood_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own stress logs" on public.stress_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own sleep logs" on public.sleep_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own assessments" on public.assessments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own journal entries" on public.journal_entries
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own chat sessions" on public.chat_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own chat messages" on public.chat_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own insights" on public.insights
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own recommendations" on public.recommendations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own safety events" on public.safety_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('journal-audio', 'journal-audio', false),
  ('exports', 'exports', false)
on conflict (id) do nothing;

