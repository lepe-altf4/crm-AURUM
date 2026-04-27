-- =============================================
-- AURUM CRM — Schema inicial
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- ---- Profiles (extiende auth.users) ----
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default 'Closer' check (role in ('Admin', 'Closer')),
  initials    text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- Stages ----
create table if not exists stages (
  id          text primary key,
  name        text not null,
  "order"     smallint not null,
  created_at  timestamptz not null default now()
);

insert into stages (id, name, "order") values
  ('s1', 'Nuevo contacto', 1),
  ('s2', 'En seguimiento', 2),
  ('s3', 'Test drive',     3),
  ('s4', 'Negociación',    4),
  ('s5', 'Cerrado',        5)
on conflict (id) do nothing;

-- ---- Contacts (Leads) ----
create table if not exists contacts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text,
  origin       text check (origin in ('Meli','IG','Referido','Web')),
  car_interest text,
  stage_id     text not null references stages(id) default 's1',
  vendor_id    uuid references profiles(id) on delete set null,
  amount       numeric not null default 0,
  days         integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---- Companies ----
create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  industry    text,
  website     text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- Deals ----
create table if not exists deals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact_id  uuid references contacts(id) on delete set null,
  company_id  uuid references companies(id) on delete set null,
  stage_id    text not null references stages(id) default 's1',
  amount      numeric not null default 0,
  car         text,
  vendor_id   uuid references profiles(id) on delete set null,
  days        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- Inventory (Stock) ----
create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  brand       text not null,
  model       text not null,
  year        integer not null,
  km          integer not null default 0,
  price       numeric not null default 0,
  status      text not null default 'available' check (status in ('available','reserved','sold')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- Activities ----
create table if not exists activities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('note','call','email','meeting','stage_change')),
  description text not null,
  contact_id  uuid references contacts(id) on delete cascade,
  deal_id     uuid references deals(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---- Weekly Sales (Dashboard) ----
create table if not exists weekly_sales (
  id          uuid primary key default gen_random_uuid(),
  week        text not null,
  units       integer not null default 0,
  revenue     numeric not null default 0,
  target      integer not null default 5,
  created_at  timestamptz not null default now()
);

insert into weekly_sales (week, units, revenue, target) values
  ('Sem 14', 4,  612000,  5),
  ('Sem 15', 6,  928000,  5),
  ('Sem 16', 5,  785000,  5),
  ('Sem 17', 7, 1184000,  5)
on conflict do nothing;

-- =============================================
-- Seed de inventario de ejemplo
-- =============================================
insert into inventory (brand, model, year, km, price, status) values
  ('Porsche',       'Cayenne S',              2023, 18400, 165000, 'reserved'),
  ('Porsche',       'Cayenne Coupé',           2024,  6200, 172000, 'available'),
  ('Porsche',       'Cayenne Turbo GT',        2023, 11800, 215000, 'sold'),
  ('Porsche',       'Cayenne E-Hybrid',        2024,  3100, 158000, 'available'),
  ('BMW',           'M3 Competition',          2023, 14200, 138000, 'available'),
  ('BMW',           'M3 Touring',              2024,  4800, 145000, 'reserved'),
  ('BMW',           'M3 CS',                   2023,  9600, 168000, 'available'),
  ('Audi',          'Q8 55 TFSI quattro',      2024,  7400, 152000, 'available'),
  ('Audi',          'Q8 60 TFSI e quattro',    2024,  2900, 162000, 'available'),
  ('Audi',          'SQ8 TFSI',                2023, 16800, 148000, 'sold'),
  ('Mercedes-Benz', 'GLE 450 4MATIC',          2024,  5400, 142000, 'available'),
  ('Mercedes-Benz', 'GLE 53 AMG 4MATIC+',      2023, 12100, 168000, 'reserved'),
  ('Mercedes-Benz', 'GLE 63 S AMG 4MATIC+',    2024,  3800, 198000, 'available'),
  ('Mercedes-Benz', 'GLE 400 d 4MATIC',        2023, 21400, 128000, 'sold'),
  ('Land Rover',    'Range Rover Sport HSE',   2023, 13600, 178000, 'available'),
  ('Land Rover',    'Range Rover Sport Autobio.',2024, 4200, 195000,'reserved'),
  ('Land Rover',    'Range Rover Sport SVR',   2023,  8900, 205000, 'available'),
  ('Land Rover',    'Range Rover Sport P440e', 2024,  2400, 188000, 'available')
on conflict do nothing;

-- =============================================
-- Row Level Security
-- =============================================
alter table profiles    enable row level security;
alter table stages      enable row level security;
alter table contacts    enable row level security;
alter table companies   enable row level security;
alter table deals       enable row level security;
alter table inventory   enable row level security;
alter table activities  enable row level security;
alter table weekly_sales enable row level security;

-- Stages: public read
create policy "Anyone can read stages"     on stages      for select using (true);
create policy "Authenticated update stages" on stages     for update using (auth.role() = 'authenticated');

-- Weekly sales: public read for authenticated
create policy "Authenticated read weekly_sales" on weekly_sales for select using (auth.role() = 'authenticated');

-- Profiles
create policy "Authenticated read profiles"   on profiles for select using (auth.role() = 'authenticated');
create policy "Users update own profile"       on profiles for update using (auth.uid() = id);

-- Contacts
create policy "Authenticated read contacts"   on contacts for select  using (auth.role() = 'authenticated');
create policy "Authenticated insert contacts" on contacts for insert  with check (auth.role() = 'authenticated');
create policy "Authenticated update contacts" on contacts for update  using (auth.role() = 'authenticated');
create policy "Authenticated delete contacts" on contacts for delete  using (auth.role() = 'authenticated');

-- Companies
create policy "Authenticated read companies"   on companies for select  using (auth.role() = 'authenticated');
create policy "Authenticated insert companies" on companies for insert  with check (auth.role() = 'authenticated');
create policy "Authenticated update companies" on companies for update  using (auth.role() = 'authenticated');
create policy "Authenticated delete companies" on companies for delete  using (auth.role() = 'authenticated');

-- Deals
create policy "Authenticated read deals"   on deals for select  using (auth.role() = 'authenticated');
create policy "Authenticated insert deals" on deals for insert  with check (auth.role() = 'authenticated');
create policy "Authenticated update deals" on deals for update  using (auth.role() = 'authenticated');
create policy "Authenticated delete deals" on deals for delete  using (auth.role() = 'authenticated');

-- Inventory
create policy "Authenticated read inventory"   on inventory for select  using (auth.role() = 'authenticated');
create policy "Authenticated insert inventory" on inventory for insert  with check (auth.role() = 'authenticated');
create policy "Authenticated update inventory" on inventory for update  using (auth.role() = 'authenticated');
create policy "Authenticated delete inventory" on inventory for delete  using (auth.role() = 'authenticated');

-- Activities
create policy "Authenticated read activities"   on activities for select  using (auth.role() = 'authenticated');
create policy "Authenticated insert activities" on activities for insert  with check (auth.role() = 'authenticated');

-- =============================================
-- Trigger: auto-create profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  full_name text;
  user_initials text;
begin
  full_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  user_initials := upper(
    substring(full_name, 1, 1) ||
    coalesce(substring(split_part(full_name, ' ', 2), 1, 1), '')
  );
  insert into public.profiles (id, name, email, role, initials)
  values (new.id, full_name, new.email, 'Closer', user_initials)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Enable Realtime for live dashboard
-- =============================================
alter publication supabase_realtime add table contacts;
alter publication supabase_realtime add table inventory;
alter publication supabase_realtime add table activities;
alter publication supabase_realtime add table deals;
