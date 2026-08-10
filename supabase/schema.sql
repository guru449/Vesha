-- Vesha — Supabase schema (auth + wardrobe + outfits + wear history + storage)
-- Run this once in the Supabase SQL Editor.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  height_cm integer,
  weight_kg integer,
  style_preferences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clothing items
create table if not exists public.clothing_items (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  image_uri text not null,
  category text not null,
  color text not null,
  pattern text not null,
  material text not null,
  style text not null,
  occasion text not null,
  brand text,
  notes text,
  ai_confidence double precision,
  created_at timestamptz not null default now(),
  last_worn_at timestamptz
);

alter table public.clothing_items add column if not exists last_worn_at timestamptz;

create index if not exists clothing_items_user_id_idx
  on public.clothing_items (user_id);

-- Outfits
create table if not exists public.outfits (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  occasion text,
  item_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_worn_at timestamptz,
  is_pinned boolean not null default false
);

alter table public.outfits add column if not exists is_pinned boolean not null default false;

create index if not exists outfits_user_id_idx
  on public.outfits (user_id);

-- Wear history (outfit_id nullable for solo item wears)
create table if not exists public.wear_history (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  outfit_id text,
  outfit_name text not null,
  item_ids text[] not null default '{}',
  worn_at timestamptz not null default now(),
  occasion text,
  source text not null default 'outfit'
);

-- Safe upgrades if an older schema already exists
alter table public.wear_history alter column outfit_id drop not null;
alter table public.wear_history add column if not exists source text not null default 'outfit';

create index if not exists wear_history_user_id_idx
  on public.wear_history (user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Vesha user'),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.clothing_items enable row level security;
alter table public.outfits enable row level security;
alter table public.wear_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "items_all_own" on public.clothing_items;
create policy "items_all_own"
  on public.clothing_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "outfits_all_own" on public.outfits;
create policy "outfits_all_own"
  on public.outfits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "wear_all_own" on public.wear_history;
create policy "wear_all_own"
  on public.wear_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for wardrobe photos (public read for Image components)
insert into storage.buckets (id, name, public)
values ('wardrobe-images', 'wardrobe-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "wardrobe_images_read" on storage.objects;
create policy "wardrobe_images_read"
  on storage.objects for select
  using (bucket_id = 'wardrobe-images');

drop policy if exists "wardrobe_images_insert_own" on storage.objects;
create policy "wardrobe_images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'wardrobe-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "wardrobe_images_update_own" on storage.objects;
create policy "wardrobe_images_update_own"
  on storage.objects for update
  using (
    bucket_id = 'wardrobe-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "wardrobe_images_delete_own" on storage.objects;
create policy "wardrobe_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'wardrobe-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
