-- FreshDesk : consultation libre / modifications via Edge Function avec code secret.
-- IMPORTANT : sur un projet dédié. Ce script remplace les anciennes politiques de FreshDesk.
create table if not exists public.freshdesk_state (
 id integer primary key check (id = 1),
 products jsonb not null default '[]'::jsonb check (jsonb_typeof(products)='array'),
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now()
);
alter table public.freshdesk_state enable row level security;
revoke all on public.freshdesk_state from anon, authenticated;
grant select on public.freshdesk_state to anon, authenticated;
-- Remove legacy policies, especially ones allowing direct modification by authenticated users.
drop policy if exists "freshdesk_authenticated_read" on public.freshdesk_state;
drop policy if exists "freshdesk_authenticated_update" on public.freshdesk_state;
drop policy if exists "freshdesk_public_read" on public.freshdesk_state;
create policy "freshdesk_public_read" on public.freshdesk_state for select to anon,authenticated using(true);
-- Do NOT create an INSERT/UPDATE/DELETE policy for anon or authenticated.
-- Existing data is preserved. Initial inventory only when no prior row exists.
insert into public.freshdesk_state(id,products,version)
values(1,'[{"id":"source-1","name":"Myrtille","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-2","name":"Pommes Canada","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-3","name":"Pastèque","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-4","name":"Kaki","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-5","name":"Melon","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-6","name":"Nectarine","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-7","name":"Pêche","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-8","name":"Raisin noir","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-9","name":"Raisin Chasselas","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-10","name":"Raisin BQT","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-11","name":"Framboises","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-12","name":"Abricot vrac / BQT","category":"Fruit","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-13","name":"TMT cerise mix","category":"Légume","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-14","name":"PDT Rouge","category":"Légume","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-15","name":"TMT cot","category":"Légume","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""},{"id":"source-16","name":"PDT 2kg CQLP","category":"Légume","seasons":[],"qty":0,"unit":"Colis","status":"active","note":""}]'::jsonb,1)
on conflict(id) do nothing;
-- Only the server-side function calls this RPC, using its Supabase server key.
create or replace function public.freshdesk_save_as_server(expected_version integer,new_products jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare next_version integer;
begin
 if jsonb_typeof(new_products) is distinct from 'array' or jsonb_array_length(new_products)>3000 or pg_catalog.length(new_products::text)>2000000 then raise exception 'Invalid payload'; end if;
 update public.freshdesk_state set products=new_products,version=version+1,updated_at=now()
 where id=1 and version=expected_version returning version into next_version;
 return next_version;
end;$$;
revoke all on function public.freshdesk_save_as_server(integer,jsonb) from PUBLIC,anon,authenticated;
grant execute on function public.freshdesk_save_as_server(integer,jsonb) to service_role;
-- Legacy RPC must not remain callable by public roles, if previously installed.
do $$ begin
 if to_regprocedure('public.save_freshdesk(integer,jsonb)') is not null then
   revoke all on function public.save_freshdesk(integer,jsonb) from PUBLIC,anon,authenticated;
 end if;
end $$;
do $$ begin
 alter publication supabase_realtime add table public.freshdesk_state;
exception when duplicate_object then null;
end $$;
