/* FreshDesk History V1 — on-device, version snapshots after confirmed saves.
   Never claims server-wide audit. No Supabase access or automatic restore. */
(()=>{
 'use strict';
 const KEY='freshdesk.history.v1',LIMIT=45;
 const $=id=>document.getElementById(id);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const clean=v=>Array.isArray(v)?v.filter(p=>p&&typeof p.name==='string').slice(0,3000).map(p=>({
  id:String(p.id||''),name:String(p.name).slice(0,100),category:p.category==='Légume'?'Légume':'Fruit',
  qty:Math.max(0,Math.floor(Number(p.qty)||0)),unit:String(p.unit||'Colis').slice(0,30),
  status:p.status==='paused'?'paused':'active',seasons:Array.isArray(p.seasons)?p.seasons.slice(0,8):[],note:String(p.note||'').slice(0,500)
 })):null;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 let entries=[],state=null,selected=null,storageError=false,localTimer=null;
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(Array.isArray(raw))entries=raw.filter(e=>e&&typeof e.id==='string'&&Array.isArray(e.products)&&typeof e.at==='string').slice(0,LIMIT);
 }catch{}
 const keyFor=a=>JSON.stringify(clean(a)||[]);
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(entries));storageError=false}
  catch{storageError=true;entries=entries.slice(0,15);
   try{localStorage.setItem(KEY,JSON.stringify(entries));storageError=false}catch{}
  }
 }
 function record(products,source='synced',version=null){
  const safe=clean(products);if(!safe)return;
  if(entries.length&&keyFor(entries[0].products)===keyFor(safe))return;
  const entry={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),
    at:new Date().toISOString(),source,version:Number.isFinite(Number(version))?Number(version):null,products:safe};
  entries.unshift(entry);entries=entries.slice(0,LIMIT);persist();updateBadge();
  if($('fleHistoryDialog')?.open)renderHistory();
 }
 function diff(oldList,newList){
  const a=new Map((oldList||[]).map(x=>[x.id,x])),b=new Map((newList||[]).map(x=>[x.id,x])),changes=[];
  const ids=new Set([...a.keys(),...b.keys()]);
  for(const id of ids){
   const before=a.get(id),after=b.get(id);
   if(!before){changes.push({label:after.name,description:'Produit ajouté'});continue}
   if(!after){changes.push({label:before.name,description:'Produit supprimé'});continue}
   const parts=[];
   if(before.qty!==after.qty)parts.push('Quantité '+before.qty+' → '+after.qty);
   if(before.name!==after.name)parts.push('Nom : '+before.name+' → '+after.name);
   if(before.category!==after.category)parts.push('Catégorie modifiée');
   if(before.unit!==after.unit)parts.push('Unité : '+before.unit+' → '+after.unit);
   if(before.status!==after.status)parts.push('État : '+before.status+' → '+after.status);
   if((before.seasons||[]).join('|')!==(after.seasons||[]).join('|'))parts.push('Saisons modifiées');
   if(before.note!==after.note)parts.push('Note modifiée');
   if(parts.length)changes.push({label:after.name,description:parts.join(' · ')});
  }
  return changes;
 }
 function dateLabel(iso){try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso}}
 function updateBadge(){
  const b=$('fleHistoryOpen');if(b){b.textContent='↶ Historique'+(entries.length?' ('+entries.length+')':'');b.title='Historique des versions sur cet appareil'}
 }
 function ensureUi(){
  if($('fleHistoryDialog'))return;
  const toolbar=document.querySelector('.workspace-head .toolbar-actions');
  if(!toolbar)return;
  const button=document.createElement('button');
  button.id='fleHistoryOpen';button.type='button';button.className='btn fle-history-button';
  button.addEventListener('click',()=>{selected=entries[0]?.id||null;renderHistory();$('fleHistoryDialog').showModal()});
  toolbar.prepend(button);
  const dialog=document.createElement('dialog');dialog.id='fleHistoryDialog';dialog.className='fle-history-dialog';
  dialog.setAttribute('aria-labelledby','fleHistoryTitle');
  dialog.innerHTML='<div class="fle-history-head"><div><small>FRESHDESK · SAUVEGARDE</small><h2 id="fleHistoryTitle">Historique des modifications</h2></div><button type="button" class="fle-history-close" aria-label="Fermer">✕</button></div><p class="fle-history-explain">Versions conservées <strong>sur cet appareil uniquement</strong>. Ce n’est pas encore un historique partagé de Supabase. Les versions commencent à être enregistrées à partir de cette mise à jour.</p><p class="fle-history-warning" id="fleHistoryWarning" hidden></p><div id="fleHistoryBody"></div><footer class="fle-history-footer"><button type="button" id="fleHistoryExport">Exporter toutes les versions</button><button type="button" class="fle-history-close">Fermer</button></footer>';
  document.body.appendChild(dialog);
  dialog.querySelectorAll('.fle-history-close').forEach(b=>b.onclick=()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  $('fleHistoryExport').addEventListener('click',()=>{
   const data=JSON.stringify({app:'FreshDesk',format:'device-history-v1',exportedAt:new Date().toISOString(),entries},null,2);
   const url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');
   a.href=url;a.download='freshdesk-historique-'+new Date().toISOString().slice(0,10)+'.json';
   a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  updateBadge();
 }
 function renderHistory(){
  ensureUi();const body=$('fleHistoryBody'),warning=$('fleHistoryWarning');if(!body)return;
  warning.hidden=!storageError;
  warning.textContent=storageError?'L’enregistrement local est saturé. Exporte immédiatement ton historique.':'';
  if(!entries.length){body.innerHTML='<div class="fle-history-empty">Aucune version enregistrée pour le moment. Les prochaines sauvegardes seront ajoutées ici.</div>';return}
  const current=clean(state?.products)||[],entry=entries.find(e=>e.id===selected)||entries[0];
  selected=entry.id;
  const position=entries.indexOf(entry),prior=entries[position+1],changes=diff(prior?.products||[],entry.products);
  const currentDiff=diff(current,entry.products);
  body.innerHTML='<div class="fle-history-grid"><div class="fle-history-list" role="list" aria-label="Versions conservées">'+entries.map((e,i)=>{
   const change=i+1<entries.length?diff(entries[i+1].products,e.products):[];
   return '<button type="button" class="fle-history-entry '+(e.id===selected?'selected':'')+'" data-history-id="'+escape(e.id)+'" aria-pressed="'+(e.id===selected)+'"><strong>'+escape(dateLabel(e.at))+'</strong><small>'+escape(e.source==='local'?'Modification locale':e.source==='before-restore'?'Avant restauration':'Version enregistrée')+' · '+e.products.length+' produits'+(i+1<entries.length?' · '+change.length+' modifiés':'')+'</small></button>';
  }).join('')+'</div><section class="fle-history-detail"><h3>Version du '+escape(dateLabel(entry.at))+'</h3><p>'+entry.products.length+' références conservées'+(entry.version!==null?' · Version serveur '+entry.version:'')+'</p><h4>Changements par rapport à la version précédente</h4><div class="fle-history-diff">'+(prior?(changes.length?changes.map(c=>'<div><strong>'+escape(c.label)+'</strong><small>'+escape(c.description)+'</small></div>').join(''):'<p>Pas de différence de contenu.</p>'):'<p>Première version conservée sur cet appareil.</p>')+'</div><h4>Différences avec les données affichées actuellement</h4><p>'+currentDiff.length+' produit(s) différents.</p><button type="button" id="fleHistoryRestore" class="fle-history-restore" '+(!currentDiff.length||!state?.admin&&state?.server||state?.dirty||state?.saving||state?.conflict?'disabled':'')+'>Restaurer cette version</button><small class="fle-history-permission">'+(state?.server&&!state?.admin?'Connecte-toi en gestion pour restaurer.':state?.dirty||state?.saving||state?.conflict?'Attends la synchronisation avant de restaurer.':'La restauration remplacera le catalogue actuel après confirmation.')+'</small></section></div>';
  body.querySelectorAll('[data-history-id]').forEach(b=>b.onclick=()=>{selected=b.dataset.historyId;renderHistory()});
  $('fleHistoryRestore')?.addEventListener('click',()=>{
   if(!state||!currentDiff.length||state.server&&!state.admin||state.dirty||state.saving||state.conflict)return;
   if(!confirm('Restaurer le catalogue du '+dateLabel(entry.at)+' ?\n'+currentDiff.length+' référence(s) seront modifiées.\nUne copie de l’état actuel sera conservée avant restauration.'))return;
   record(current,'before-restore',state.version);
   window.dispatchEvent(new CustomEvent('fle:restore-request',{detail:{products:clone(entry.products),historyId:entry.id}}));
   $('fleHistoryDialog').close();
  });
 }
 function handleState(e){state=e.detail;if(!state)return;ensureUi()}
 function init(){
  ensureUi();
  window.addEventListener('fle:state',handleState);
  window.addEventListener('fle:history',e=>{
   const d=e.detail||{};if(d.source==='local'){
    clearTimeout(localTimer);localTimer=setTimeout(()=>record(d.products,'local',d.version),700);
   }else record(d.products,d.source||'synced',d.version);
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
