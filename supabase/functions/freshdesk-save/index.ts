// FreshDesk: only this function may modify the catalogue.
// Set FRESHDESK_EDIT_CODE in Supabase Edge Functions > Secrets.
import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });
async function sha(s: string) { return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); }
async function secureEqual(a: string, b: string) {
  const [aa,bb]=await Promise.all([sha(a),sha(b)]);
  let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;
}
Deno.serve(async req => {
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return reply({error:'Méthode non autorisée'},405);
  const expectedCode=Deno.env.get('FRESHDESK_EDIT_CODE');
  if(!expectedCode||expectedCode.length<10)return reply({error:'Code gestion non configuré (10 caractères minimum)'},503);
  if(Number(req.headers.get('content-length')||0)>2_500_000)return reply({error:'Taille excessive'},413);
  let input: Record<string,unknown>;
  try { input=await req.json(); } catch { return reply({error:'Corps JSON invalide'},400); }
  if(typeof input.code!=='string'||input.code.length>256||!(await secureEqual(input.code,expectedCode)))return reply({error:'Code incorrect'},403);
  if(input.action==='check')return reply({ok:true});
  if(input.action!=='save')return reply({error:'Action inconnue'},400);
  if(!Array.isArray(input.products)||input.products.length>3000||JSON.stringify(input.products).length>2_000_000)return reply({error:'Catalogue trop volumineux'},400);
  if(!Number.isSafeInteger(input.expected_version)||Number(input.expected_version)<1)return reply({error:'Version invalide'},400);
  const products=input.products as Record<string,unknown>[];
  const seasons=['Printemps','Été','Automne','Hiver'];
  const valid=products.every(p=>p&&typeof p==='object'&&typeof p.id==='string'&&p.id.length<=150&&typeof p.name==='string'&&p.name.length>0&&p.name.length<=100&&['Fruit','Légume'].includes(String(p.category))&&Array.isArray(p.seasons)&&p.seasons.every(s=>seasons.includes(String(s)))&&Number.isSafeInteger(p.qty)&&Number(p.qty)>=0&&Number(p.qty)<=1_000_000&&typeof p.unit==='string'&&p.unit.length<=30&&['active','paused'].includes(String(p.status))&&typeof p.note==='string'&&p.note.length<=500);
  if(!valid)return reply({error:'Certains produits sont invalides'},400);
  const url=Deno.env.get('SUPABASE_URL')!;
  const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
  const secret=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!secret)return reply({error:'Clé serveur non disponible'},503);
  const admin=createClient(url,secret,{auth:{persistSession:false}});
  // Optimistic concurrency guard: RPC executes a single UPDATE ... WHERE version = expected.
  const {data,error}=await admin.rpc('freshdesk_save_as_server',{expected_version:input.expected_version,new_products:products});
  if(error){console.error('FreshDesk save failed',error.message);return reply({error:'Sauvegarde indisponible'},500)}
  if(data===null)return reply({conflict:true});
  return reply({version:data,conflict:false});
});
