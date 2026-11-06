(() => {
'use strict';
const SEASONS=['Printemps','Été','Automne','Hiver'];
const SOURCE=[['Myrtille','Fruit'],['Pommes Canada','Fruit'],['Pastèque','Fruit'],['Kaki','Fruit'],['Melon','Fruit'],['Nectarine','Fruit'],['Pêche','Fruit'],['Raisin noir','Fruit'],['Raisin Chasselas','Fruit'],['Raisin BQT','Fruit'],['Framboises','Fruit'],['Abricot vrac / BQT','Fruit'],['TMT cerise mix','Légume'],['PDT Rouge','Légume'],['TMT cot','Légume'],['PDT 2kg CQLP','Légume']];
const seeded=()=>SOURCE.map(([name,category],i)=>({id:`source-${i+1}`,name,category,seasons:[],qty:0,unit:'Colis',status:'active',note:''}));
const $=id=>document.getElementById(id);
let products=[],view='catalog',editing=null,server=false,serverVersion=0,saving=false,saveQueued=false,conflicted=false,saveTimer=null,toastTimer=null,client=null,adminUnlocked=false,adminCode="",dirty=false,revision=0,pollTimer=null,subscription=null;
const loadLocal=()=>{try{let arr=JSON.parse(localStorage.getItem('freshdesk-products'));return Array.isArray(arr)?sanitize(arr):seeded()}catch{return seeded()}};
const sanitize=arr=>arr.filter(x=>x&&typeof x.name==='string').slice(0,3000).map((p,i)=>({id:String(p.id||`import-${i}`),name:String(p.name).slice(0,100),category:p.category==='Légume'?'Légume':'Fruit',seasons:Array.isArray(p.seasons)?p.seasons.filter(s=>SEASONS.includes(s)):[],qty:Math.max(0,Math.floor(Number(p.qty)||0)),unit:String(p.unit||'Colis').slice(0,30),status:p.status==='paused'?'paused':'active',note:String(p.note||'').slice(0,500)}));
const h=(v)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seasonNow=()=>{const m=new Date().getMonth()+1;return [12,1,2].includes(m)?'Hiver':[3,4,5].includes(m)?'Printemps':[6,7,8].includes(m)?'Été':'Automne'};
const countOrder=()=>products.filter(p=>p.qty>0&&p.status==='active').length;
function notice(s){const n=$('toast');n.textContent=s;n.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('visible'),2900)}
function setSync(title,subtitle,cls=''){ $('syncTitle').textContent=title;$('syncText').textContent=subtitle;$('syncDot').className='sync-dot '+cls;}
function persisted(){localStorage.setItem('freshdesk-products',JSON.stringify(products));if(server){dirty=true;revision++;if(!conflicted){clearTimeout(saveTimer);saveTimer=setTimeout(syncSave,500)}}}
function mutate(){if(!canEdit())return;persisted();render()}
function visibleProducts(){let search=$('search').value.trim().toLocaleLowerCase('fr');let cat=$('categoryFilter').value,season=$('seasonFilter').value,status=$('statusFilter').value;return products.filter(p=>{if(view==='order'&&!(p.qty>0&&p.status==='active'))return false;if(cat!=='all'&&p.category!==cat)return false;if(status!=='all'&&p.status!==status)return false;if(season==='none'&&p.seasons.length)return false;if(season==='auto'&&!p.seasons.includes(seasonNow()))return false;if(!['all','none','auto'].includes(season)&&!p.seasons.includes(season))return false;if(search&&!`${p.name} ${p.note}`.toLocaleLowerCase('fr').includes(search))return false;return true}).sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name,'fr'))}
function qtyMarkup(p){const disabled=server&&!adminUnlocked?'disabled':'';return `<div class="qty-control ${p.status==='paused'?'paused':''}"><button type="button" data-qty="minus" data-id="${h(p.id)}" aria-label="Diminuer ${h(p.name)}" ${p.status==='paused'||(server&&!adminUnlocked)?'disabled':''}>−</button><input type="number" min="0" step="1" inputmode="numeric" value="${p.qty}" aria-label="Quantité ${h(p.name)}" data-qty-input="${h(p.id)}" ${p.status==='paused'||(server&&!adminUnlocked)?'disabled':''}><button type="button" data-qty="plus" data-id="${h(p.id)}" aria-label="Augmenter ${h(p.name)}" ${p.status==='paused'||(server&&!adminUnlocked)?'disabled':''}>+</button></div>`}
function render(){const disabled=server&&!adminUnlocked?'disabled':'';const total=products.length,fruits=products.filter(p=>p.category==='Fruit').length,veg=total-fruits,n=countOrder();$('totalStat').textContent=total;$('fruitStat').textContent=fruits;$('vegStat').textContent=veg;$('orderStat').textContent=n;$('navProductCount').textContent=total;$('navOrderCount').textContent=n;$('quickProductCount').textContent=total;$('quickOrderCount').textContent=n;$('modeIndicator').textContent=server?(adminUnlocked?'● Gestion active':'○ Consultation'):'● Mode local';$('modeIndicator').classList.toggle('editing',adminUnlocked||!server);$('viewTitle').textContent=view==='catalog'?'Tous les produits':'Produits à commander';$('viewSubtitle').textContent=view==='catalog'?'Retrouve toutes les références et prépare les quantités.':'Seulement les références actives avec une quantité à commander.';$('printBtn').textContent=view==='order'?'⎙ Imprimer la commande':'⎙ Imprimer';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const vis=visibleProducts();$('resultCount').textContent=`${vis.length} produit${vis.length!==1?'s':''}`;$('addProduct').disabled=server&&!adminUnlocked;$('clearQuantities').disabled=server&&!adminUnlocked;$('sideImport').disabled=server&&!adminUnlocked;$('tableFoot').textContent=`${vis.length} référence${vis.length!==1?'s':''} affichée${vis.length!==1?'s':''}`;$('emptyState').classList.toggle('hidden',vis.length>0);document.body.classList.toggle('order-mode',view==='order');$('productRows').innerHTML=vis.map(p=>`<tr><td><button class="product-name" data-edit="${h(p.id)}" ${disabled}><span class="produce-emoji ${p.category==='Légume'?'vegetable':''}">${p.category==='Fruit'?'🍎':'🥬'}</span><span>${h(p.name)}</span></button></td><td><span class="category-pill ${p.category==='Fruit'?'fruit':'veg'}">${p.category==='Fruit'?'Fruit':'Légume'}</span></td><td><div class="season-pills">${p.seasons.length?p.seasons.map(s=>`<span class="season-pill ${s===seasonNow()?'current':''}">${h(s)}</span>`).join(''):'<span class="not-set">À renseigner</span>'}</div></td><td>${qtyMarkup(p)}</td><td>${h(p.unit)}</td><td><span class="status ${p.status==='paused'?'paused':''}">${p.status==='paused'?'En pause':'Actif'}</span></td><td><button class="row-action" data-edit="${h(p.id)}" aria-label="Modifier ${h(p.name)}" ${disabled}>✎</button></td></tr>`).join('');const old=document.querySelector('.print-header');if(old)old.remove();const head=document.createElement('div');head.className='print-header';const now=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});head.innerHTML=`<h1>Bon de commande · Fruits & légumes</h1><p>Édité le ${h(now)} · ${vis.length} produit(s) · Vue : ${view==='order'?'Produits à commander':'Catalogue'} · Saison : ${h($('seasonFilter').selectedOptions[0].textContent)}</p>`;document.querySelector('.workspace').prepend(head)}
function openEdit(id=null){if(!canEdit())return;editing=id;let p=id?products.find(p=>p.id===id):null;if(id&&!p)return;const f=$('productForm');f.reset();f.elements.name.value=p?.name||'';f.elements.category.value=p?.category||'Fruit';f.elements.unit.value=p?.unit||'Colis';f.elements.qty.value=p?.qty??0;f.elements.status.value=p?.status||'active';f.elements.note.value=p?.note||'';f.querySelectorAll('[name=seasons]').forEach(ch=>ch.checked=!!p?.seasons.includes(ch.value));$('modalTitle').textContent=p?'Modifier le produit':'Ajouter un produit';$('deleteProduct').classList.toggle('hidden',!p);$('productModal').classList.remove('hidden');setTimeout(()=>f.elements.name.focus(),50)}
function closeEdit(){$('productModal').classList.add('hidden');editing=null}
function setView(v){view=v;render();hideMenu()}
function hideMenu(){document.querySelector('.sidebar').classList.remove('open');$('menuOverlay').classList.add('hidden')}
function exportData(){const blob=new Blob([JSON.stringify({app:'FreshDesk',exportedAt:new Date().toISOString(),products},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`freshdesk-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notice('Sauvegarde téléchargée')}
function printNow(){window.print()}
const settings=window.FRESHDESK_CONFIG||{};
const configured=()=>/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test((settings.url||'').trim()) && /^(sb_publishable_|eyJ)/.test((settings.publishableKey||'').trim());
function canEdit(){if(server&&!adminUnlocked){$('settingsModal').classList.remove('hidden');notice('Saisis le code gestion pour modifier');return false}if(conflicted){notice('Conflit : exporte tes changements, puis actualise');return false}return true}
function accountUI(){const b=$('accountBtn');b.classList.toggle('hidden',!server);b.textContent=adminUnlocked?'🔓 Quitter gestion':'🔒 Accès gestion';render()}
function showLogin(message){setSync('Consultation partagée',message||'Code nécessaire uniquement pour modifier','online');$('settingsModal').classList.remove('hidden')}
async function writeRequest(action,payload={}){
 if(!client)throw new Error('Connexion Supabase indisponible');
 const args={edit_code:adminCode,operation:action,expected_version:payload.expected_version??null,new_products:payload.products??null};
 const {data,error}=await client.rpc('freshdesk_save_with_pin',args);
 if(error)throw new Error(error.message||'Erreur de connexion Supabase');
 if(!data||data.error)throw new Error(data?.error||'Réponse invalide');
 return data;
}
async function syncSave(){
 if(!server||!adminUnlocked||conflicted||!dirty)return;
 if(saving){saveQueued=true;return}
 saving=true;const sendingRevision=revision,snapshot=JSON.parse(JSON.stringify(products));
 setSync('Synchronisation…','Enregistrement dans Supabase');
 try{
  const {version:data,conflict}=await writeRequest('save',{expected_version:serverVersion,products:snapshot});
  if(conflict){conflicted=true;setSync('Conflit détecté','Tes changements locaux sont conservés · exporte-les','error');notice('Modifications simultanées : exporte ta sauvegarde avant de recharger');return}
  serverVersion=Number(data);
  if(revision===sendingRevision){dirty=false;setSync('En ligne · partagé','Toutes les modifications sont enregistrées','online')}
  else {saveQueued=true;setSync('Synchronisation…','Dernières modifications en attente')}
 }catch(e){setSync('Enregistrement en attente','Conserve cette page ouverte ou exporte les données','error');notice('Impossible de sauvegarder en ligne : vérifie ta connexion')}
 finally{saving=false;if(saveQueued&&!conflicted){saveQueued=false;clearTimeout(saveTimer);saveTimer=setTimeout(syncSave,600)}}
}
async function remoteLoad(force=false){
 if(!client)return false;
 if((dirty||saving)&&!force){return false}
 try{
  const {data,error}=await client.from('freshdesk_state').select('products,version').eq('id',1).single();
  if(error)throw error;
  if(!data)throw Error('Aucun catalogue distant');
  products=sanitize(data.products||[]);serverVersion=Number(data.version);dirty=false;conflicted=false;
  localStorage.setItem('freshdesk-products',JSON.stringify(products));render();setSync('En ligne · partagé','Commandes synchronisées','online');return true
 }catch(e){setSync('Connexion interrompue','Affichage d’une copie locale · vérifier la connexion','error');notice('Impossible de charger les données du magasin');return false}
}
async function connectUser(){adminUnlocked=true;accountUI();$('settingsModal').classList.add('hidden');$('loginError').classList.add('hidden');notice('Mode gestion activé');}
function subscribeRemote(){
 if(subscription){client.removeChannel(subscription);subscription=null}
 // Notification Realtime et vérification périodique : aucune donnée écrasée si une édition locale est en attente.
 subscription=client.channel('freshdesk-catalogue').on('postgres_changes',{event:'UPDATE',schema:'public',table:'freshdesk_state',filter:'id=eq.1'},payload=>{
  if(!client)return;
  if(!dirty&&!saving&&Number(payload.new?.version)>serverVersion)remoteLoad();
  else if(Number(payload.new?.version)>serverVersion&&dirty){setSync('Autres modifications détectées','Tes changements locaux restent conservés','error')}
 }).subscribe();
 if(pollTimer)clearInterval(pollTimer);
 pollTimer=setInterval(async()=>{
  if(!client||saving||document.hidden)return;
  if(dirty){if(!conflicted)syncSave();return}
  const {data,error}=await client.from('freshdesk_state').select('version').eq('id',1).single();
  if(!error&&data&&Number(data.version)>serverVersion)remoteLoad();
 },15000);
}
async function start(){
 products=loadLocal();$('todayText').textContent=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});render();
 if(!configured()){setSync('Mode démonstration','Configure config.js pour activer le partage');return}
 server=true;accountUI();
 if(!window.supabase?.createClient){setSync('Bibliothèque indisponible','Vérifie ta connexion internet','error');return}
 try{
  client=window.supabase.createClient(settings.url.trim(),settings.publishableKey.trim(),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  await remoteLoad(true);subscribeRemote();
 }catch(e){setSync('Connexion interrompue','Impossible de charger le catalogue partagé','error')}
}
$('productRows').addEventListener('click',e=>{const btn=e.target.closest('[data-edit],[data-qty]');if(!btn)return;if(btn.dataset.edit){openEdit(btn.dataset.edit);return}if(!canEdit())return;const p=products.find(p=>p.id===btn.dataset.id);if(!p)return;p.qty=Math.max(0,p.qty+(btn.dataset.qty==='plus'?1:-1));mutate()});
$('productRows').addEventListener('change',e=>{const id=e.target.dataset.qtyInput;if(!id)return;if(!canEdit())return;const p=products.find(p=>p.id===id);if(!p)return;p.qty=Math.max(0,Math.floor(Number(e.target.value)||0));mutate()});
$('productForm').addEventListener('submit',e=>{e.preventDefault();if(!canEdit())return;const f=e.currentTarget;const p={id:editing||`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:f.elements.name.value.trim(),category:f.elements.category.value,seasons:Array.from(f.querySelectorAll('[name=seasons]:checked')).map(el=>el.value),qty:Math.max(0,Math.floor(Number(f.elements.qty.value)||0)),unit:f.elements.unit.value,status:f.elements.status.value,note:f.elements.note.value.trim()};if(!p.name)return;if(editing){const i=products.findIndex(x=>x.id===editing);if(i>=0)products[i]=p}else products.push(p);closeEdit();mutate();notice('Produit enregistré')});
$('deleteProduct').onclick=()=>{if(!canEdit())return;if(!editing||!confirm('Supprimer définitivement ce produit ?'))return;products=products.filter(p=>p.id!==editing);closeEdit();mutate();notice('Produit supprimé')};
$('addProduct').onclick=()=>openEdit();$('closeModal').onclick=closeEdit;$('cancelModal').onclick=closeEdit;$('productModal').addEventListener('click',e=>{if(e.target===$('productModal'))closeEdit()});
for(let id of ['search','categoryFilter','seasonFilter','statusFilter'])$(id).addEventListener(id==='search'?'input':'change',render);
for(let id of ['printBtn','sidePrint','quickPrint'])$(id).onclick=printNow;
$('sideExport').onclick=exportData;$('sideImport').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{let file=e.target.files[0];if(!file)return;try{const payload=JSON.parse(await file.text());if(!Array.isArray(payload.products))throw Error('format');if(!canEdit())return;if(!confirm('Remplacer tout le catalogue actuel par les données de cette sauvegarde ?'))return;products=sanitize(payload.products);mutate();notice(`${products.length} produits importés`)}catch{notice('Fichier JSON de sauvegarde invalide')}finally{e.target.value=''}};
$('clearQuantities').onclick=()=>{if(!canEdit())return;if(!confirm('Remettre toutes les quantités à zéro ?'))return;products.forEach(p=>p.qty=0);mutate();notice('Quantités réinitialisées')};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('mobileMenu').onclick=()=>{document.querySelector('.sidebar').classList.add('open');$('menuOverlay').classList.remove('hidden')};$('menuOverlay').onclick=hideMenu;
$('refreshBtn').onclick=async()=>{
 if(server){if(saving){notice('Synchronisation en cours');return}
  if(dirty||conflicted){if(!confirm('Des changements ne sont pas sauvegardés. Exporte-les avant de remplacer. Continuer ?'))return}
  const ok=await remoteLoad(true);if(ok)notice('Catalogue à jour')
 }else{render();notice('Données locales à jour')}
};
$('loginForm').onsubmit=async e=>{
 e.preventDefault();if(!server){notice('Configure d’abord Supabase');return}
 $('loginButton').disabled=true;$('loginError').classList.add('hidden');adminCode=$('passwordInput').value;
 try{await writeRequest('check');await connectUser();$('passwordInput').value=''}
 catch(e){adminCode='';const msg=String(e?.message||'Erreur inconnue');$('loginError').textContent='Connexion gestion impossible : '+msg+' (vérifie la fonction freshdesk-save dans Supabase).';$('loginError').classList.remove('hidden');console.error('FreshDesk accès gestion :',e)}
 finally{$('loginButton').disabled=false}
};
$('accountBtn').onclick=()=>{if(!adminUnlocked){showLogin();return}
 if(dirty||saving||conflicted){notice('Sauvegarde les modifications avant de quitter la gestion');return}
 adminUnlocked=false;adminCode='';accountUI();notice('Mode consultation activé')
};
$('closeSettings').onclick=()=>{$('settingsModal').classList.add('hidden')};
window.addEventListener('beforeunload',e=>{if(server&&(dirty||saving)){e.preventDefault();e.returnValue=''}});
start();
})();
