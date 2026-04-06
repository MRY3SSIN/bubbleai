alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_theme text default 'mint' not null;

create table if not exists public.medical_ids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  blood_type text,
  allergies text,
  conditions text,
  medications text,
  notes text,
  clinician_name text,
  clinician_phone text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  unique (user_id)
);

create trigger set_medical_ids_updated_at
before update on public.medical_ids
for each row execute procedure public.set_updated_at();

alter table public.medical_ids enable row level security;

create policy "Users manage own medical ids" on public.medical_ids
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own avatar objects" on storage.objects
for all
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
