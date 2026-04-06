create table if not exists public.privacy_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  private_mode boolean default false not null,
  hide_notification_previews boolean default true not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  unique (user_id)
);

create table if not exists public.cycle_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  enabled boolean default false not null,
  last_period_start date,
  cycle_length_days int default 28 not null,
  period_length_days int default 5 not null,
  irregular_cycles boolean default false not null,
  symptoms_text text,
  notes text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  unique (user_id)
);

create index if not exists idx_privacy_settings_user_id on public.privacy_settings (user_id);
create index if not exists idx_cycle_profiles_user_id on public.cycle_profiles (user_id);

create trigger set_privacy_settings_updated_at
before update on public.privacy_settings
for each row execute procedure public.set_updated_at();

create trigger set_cycle_profiles_updated_at
before update on public.cycle_profiles
for each row execute procedure public.set_updated_at();

alter table public.privacy_settings enable row level security;
alter table public.cycle_profiles enable row level security;

create policy "Users manage own privacy settings" on public.privacy_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own cycle profiles" on public.cycle_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
