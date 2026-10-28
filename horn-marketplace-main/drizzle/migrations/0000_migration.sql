create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone) values (new.id, new.raw_user_meta_data->>'full_name', new.phone);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique,
  shop_name text not null,
  whatsapp text not null,
  location text not null,
  created_at timestamptz not null default now()
);
grant select on public.merchants to anon;
grant select, insert, update on public.merchants to authenticated;
grant all on public.merchants to service_role;
alter table public.merchants enable row level security;
create policy "merchants public read" on public.merchants for select to anon, authenticated using (true);
create policy "merchant insert own" on public.merchants for insert to authenticated with check (auth.uid() = owner_id);
create policy "merchant update own" on public.merchants for update to authenticated using (auth.uid() = owner_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  price_usd numeric(12,2) not null,
  price_slsh numeric(14,0) not null,
  stock integer not null default 0,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "products owner write" on public.products for all to authenticated
  using (exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()))
  with check (exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  city text not null,
  landmark text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "own addresses" on public.addresses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create type public.order_status as enum ('new','packed','out_for_delivery','completed');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  merchant_id uuid not null references public.merchants(id),
  address_id uuid references public.addresses(id),
  delivery_city text not null,
  delivery_landmark text,
  delivery_lat double precision,
  delivery_lng double precision,
  buyer_phone text not null,
  payment_method text not null,
  total_usd numeric(12,2) not null,
  status public.order_status not null default 'new',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "buyer read own orders" on public.orders for select to authenticated using (auth.uid() = buyer_id);
create policy "buyer create orders" on public.orders for insert to authenticated with check (auth.uid() = buyer_id);
create policy "merchant read orders" on public.orders for select to authenticated using (exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()));
create policy "merchant update orders" on public.orders for update to authenticated using (exists (select 1 from public.merchants m where m.id = merchant_id and m.owner_id = auth.uid()));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  title text not null,
  quantity integer not null check (quantity > 0),
  unit_price_usd numeric(12,2) not null
);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o left join public.merchants m on m.id = o.merchant_id where o.id = order_id and (o.buyer_id = auth.uid() or m.owner_id = auth.uid())));
create policy "items insert" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product images upload own folder" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
