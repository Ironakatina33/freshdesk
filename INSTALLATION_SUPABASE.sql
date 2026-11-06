-- FreshDesk · Installation initiale · À exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- L'inscription publique doit être désactivée dans Authentication > Providers > Email.
create table if not exists public.freshdesk_state (
 id integer primary key check (id = 1),
 products jsonb not null default '[]'::jsonb check (jsonb_typeof(products) = 'array'),
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now()
);

alter table public.freshdesk_state enable row level security;
revoke all on table public.freshdesk_state from anon;
grant select, update on table public.freshdesk_state to authenticated;

-- Seuls les utilisateurs connectés peuvent lire et mettre à jour le catalogue.
-- À utiliser dans un projet Supabase DÉDIÉ, avec les inscriptions publiques désactivées.
drop policy if exists "freshdesk_authenticated_read" on public.freshdesk_state;
create policy "freshdesk_authenticated_read" on public.freshdesk_state
 for select to authenticated using (true);
drop policy if exists "freshdesk_authenticated_update" on public.freshdesk_state;
create policy "freshdesk_authenticated_update" on public.freshdesk_state
 for update to authenticated using (true) with check (true);

-- Import des 16 références d'origine. N'écrase PAS le catalogue existant.
insert into public.freshdesk_state (id,products,version)
values (1, '[{"id": "source-1", "name": "Myrtille", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-2", "name": "Pommes Canada", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-3", "name": "Pastèque", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-4", "name": "Kaki", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-5", "name": "Melon", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-6", "name": "Nectarine", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-7", "name": "Pêche", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-8", "name": "Raisin noir", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-9", "name": "Raisin Chasselas", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-10", "name": "Raisin BQT", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-11", "name": "Framboises", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-12", "name": "Abricot vrac / BQT", "category": "Fruit", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-13", "name": "TMT cerise mix", "category": "Légume", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-14", "name": "PDT Rouge", "category": "Légume", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-15", "name": "TMT cot", "category": "Légume", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}, {"id": "source-16", "name": "PDT 2kg CQLP", "category": "Légume", "seasons": [], "qty": 0, "unit": "Colis", "status": "active", "note": ""}]'::jsonb, 1)
on conflict (id) do nothing;

-- Sauvegarde atomique : empêche qu'un utilisateur écrase silencieusement
-- les changements d'un autre. NULL = conflit de versions.
create or replace function public.save_freshdesk(expected_version integer, new_products jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare saved_version integer;
begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 if jsonb_typeof(new_products) is distinct from 'array' or jsonb_array_length(new_products) > 3000 or pg_catalog.length(new_products::text) > 2000000 then
  raise exception 'Catalogue invalide';
 end if;
 update public.freshdesk_state
 set products = new_products, version = version + 1, updated_at = now()
 where id = 1 and version = expected_version
 returning version into saved_version;
 return saved_version;
end;
$$;
revoke all on function public.save_freshdesk(integer,jsonb) from PUBLIC, anon;
grant execute on function public.save_freshdesk(integer,jsonb) to authenticated;

-- Realtime : si déjà ajouté à la publication, ignorer l'erreur duplicate_object.
do $$ begin
 alter publication supabase_realtime add table public.freshdesk_state;
exception when duplicate_object then null;
end $$;
