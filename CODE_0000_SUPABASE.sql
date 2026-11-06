-- FreshDesk : remplace l’Edge Function par une fonction SQL avec PIN fixe 0000.
-- Exécuter une seule fois dans Supabase > SQL Editor. N'efface pas les données existantes.
-- PIN 0000 = protection symbolique, PAS une sécurité adaptée à des données sensibles.

-- Vérifier que la table d'origine existe avant de faire la suite.
do $$ begin
 if to_regclass('public.freshdesk_state') is null then
  raise exception 'Table freshdesk_state absente. Exécuter INSTALLATION_SUPABASE.sql d’abord.';
 end if;
end $$;

alter table public.freshdesk_state enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.freshdesk_state from anon, authenticated;
grant select on public.freshdesk_state to anon, authenticated;
drop policy if exists "freshdesk_authenticated_update" on public.freshdesk_state;
drop policy if exists "freshdesk_public_read" on public.freshdesk_state;
create policy "freshdesk_public_read" on public.freshdesk_state for select to anon, authenticated using (true);

create or replace function public.freshdesk_save_with_pin(
  edit_code text,
  operation text,
  expected_version integer default null,
  new_products jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_version integer;
  item jsonb;
  product_count integer;
begin
  if edit_code is distinct from '0000' then
    return pg_catalog.jsonb_build_object('error','Code incorrect');
  end if;
  if operation = 'check' then
    return pg_catalog.jsonb_build_object('ok',true);
  end if;
  if operation is distinct from 'save' then
    return pg_catalog.jsonb_build_object('error','Action inconnue');
  end if;
  if expected_version is null or expected_version < 1 then
    return pg_catalog.jsonb_build_object('error','Version invalide');
  end if;
  if new_products is null or pg_catalog.jsonb_typeof(new_products) <> 'array' then
    return pg_catalog.jsonb_build_object('error','Format de catalogue invalide');
  end if;
  product_count := pg_catalog.jsonb_array_length(new_products);
  if product_count > 3000 or pg_catalog.length(new_products::text) > 2000000 then
    return pg_catalog.jsonb_build_object('error','Catalogue trop volumineux');
  end if;
  for item in select value from pg_catalog.jsonb_array_elements(new_products) loop
    if pg_catalog.jsonb_typeof(item) <> 'object'
       or pg_catalog.jsonb_typeof(item->'id') <> 'string'
       or pg_catalog.length(item->>'id') > 150
       or pg_catalog.jsonb_typeof(item->'name') <> 'string'
       or pg_catalog.length(item->>'name') not between 1 and 100
       or item->>'category' not in ('Fruit','Légume')
       or pg_catalog.jsonb_typeof(item->'seasons') <> 'array'
       or (item->>'qty') !~ '^[0-9]{1,7}$'
       or (item->>'qty')::numeric > 1000000
       or pg_catalog.length(item->>'unit') > 30
       or item->>'status' not in ('active','paused')
       or pg_catalog.length(item->>'note') > 500
    then
      return pg_catalog.jsonb_build_object('error','Produit invalide');
    end if;
    if exists (select 1 from pg_catalog.jsonb_array_elements_text(item->'seasons') s where s not in ('Printemps','Été','Automne','Hiver')) then
      return pg_catalog.jsonb_build_object('error','Saison invalide');
    end if;
  end loop;
  update public.freshdesk_state
  set products = new_products, version = version + 1, updated_at = pg_catalog.now()
  where id = 1 and version = expected_version
  returning version into next_version;
  if next_version is null then
    return pg_catalog.jsonb_build_object('conflict',true);
  end if;
  return pg_catalog.jsonb_build_object('version',next_version,'conflict',false);
end;
$$;

revoke all on function public.freshdesk_save_with_pin(text,text,integer,jsonb) from public;
grant execute on function public.freshdesk_save_with_pin(text,text,integer,jsonb) to anon, authenticated;

-- Bloquer les anciennes fonctions d'écriture, si elles existent.
do $$ begin
 if to_regprocedure('public.save_freshdesk(integer,jsonb)') is not null then
  revoke all on function public.save_freshdesk(integer,jsonb) from public,anon,authenticated;
 end if;
end $$;
