alter table public.medical_ids
  add column if not exists clinician_address text,
  add column if not exists clinician_maps_url text;
