-- Databáze pro společný žebříček.
-- Spusť celý soubor jednou v Supabase: SQL Editor -> New query -> vložit -> Run.

-- Hráči. Každý má jednu přezdívku, která se nesmí opakovat (bez ohledu na velikost písmen).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 20),
  created_at timestamptz not null default now()
);

create unique index profiles_nickname_unique on public.profiles (lower(btrim(nickname)));

-- Výsledky. Hodnota je počet opakování, nebo čas v milisekundách.
create table public.results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_id text not null check (char_length(spot_id) between 1 and 64),
  challenge_id text not null check (char_length(challenge_id) between 1 and 64),
  value integer not null check (value > 0 and value < 100000000),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index results_board on public.results (spot_id, challenge_id, created_at);

-- Pravidla přístupu: číst může každý, zapisovat jen přihlášený hráč sám za sebe.
alter table public.profiles enable row level security;
alter table public.results enable row level security;

create policy "profiles: cist muze kazdy" on public.profiles
  for select using (true);
create policy "profiles: zalozit jen svuj" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: upravit jen svuj" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "results: cist muze kazdy" on public.results
  for select using (true);
create policy "results: zapsat jen za sebe" on public.results
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Oprávnění. U výsledků smí klient poslat jen čtyři sloupce; hráče a čas
-- zápisu doplní databáze, takže je nejde podvrhnout. Výsledky nejdou měnit ani mazat.
revoke all on public.profiles, public.results from anon, authenticated;
grant select on public.profiles, public.results to anon, authenticated;
-- Úprava sloupce id je povolená jen kvůli způsobu, jakým Supabase posílá upsert;
-- změnit ho na cizí hodnotu nedovolí pravidlo výše.
grant insert (id, nickname), update (id, nickname) on public.profiles to authenticated;
grant insert (spot_id, challenge_id, value, verified) on public.results to authenticated;
