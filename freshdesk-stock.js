/* FreshDesk Stock v1 — extra UI; uses the existing PIN-guarded, versioned catalogue.
   This script never contacts Supabase directly or writes localStorage. */
(function(){
 'use strict';
 const $ = id => document.getElementById(id);
 const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state = {products:[],admin:false,server:false,dirty:false,saving:false,conflict:false};
 let open = false, currentId = null, filter = 'all';
 const byId = id => state.products.find(p=>p.id===id);
 const known = p => p.stock !== null && p.stock !== undefined && Number.isFinite(Number(p.stock));
 const low = p => known(p) && p.stockMin>0 && Number(p.stock)<=Number(p.stockMin);
 const date = value => {try{return new Date(value).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'})}catch{return String(value||'')}};
 function changeView(next){
  open=next;
  document.body.classList.toggle('fle-stock-mode',open);
  document.querySelectorAll('[data-stock-open]').forEach(el=>el.classList.toggle('active',open));
  if(open)document.querySelectorAll('.side [data-view],.fle-mobile-nav [data-view]').forEach(el=>el.classList.remove('active'));
  if(open){render();$('fleStockPanel').scrollIntoView({behavior:'smooth',block:'start'})}
 }
 function needAdmin(){
  if(state.server&&!state.admin){
   $('adminBtn')?.click();
   return false;
  }
  if(state.saving||state.conflict){alert('Attends la fin de la sauvegarde ou résous le conflit avant de modifier le stock.');return false}
  return true;
 }
 function render(){
  if(!$('fleStockPanel'))return;
  const products=state.products||[];
  const tracked=products.filter(known).length,alarms=products.filter(low).length;
  const unknown=products.length-tracked;
  const ordered=products.filter(p=>p.status==='active'&&Number(p.qty)>0);
  $('fleStockTracked').textContent=tracked+' / '+products.length;
  $('fleStockLow').textContent=String(alarms);
  $('fleStockUnknown').textContent=String(unknown);
  $('fleStockOrders').textContent=String(ordered.length);
  $('fleStockNotice').textContent=state.server
   ? 'Stock du magasin · données partagées. La commande ne change pas le stock avant réception.'
   : 'Mode local : les stocks de ce navigateur ne sont pas partagés entre les appareils.';
  const receive=$('fleStockReceive');
  receive.disabled=!ordered.length || state.saving || state.conflict || (state.server&&!state.admin);
  receive.title=!ordered.length?'Aucune quantité commandée':state.server&&!state.admin?'Active la gestion pour réceptionner':'';
  $('fleStockManageHint').hidden=!state.server||state.admin;
  const q=$('fleStockSearch').value.trim().toLocaleLowerCase('fr');
  const items=products.filter(p=>(!q||(p.name+' '+p.category+' '+p.note).toLocaleLowerCase('fr').includes(q))) 
    .filter(p=>filter==='low'?low(p):filter==='unknown'?!known(p):filter==='ordered'?p.qty>0:true)
    .sort((a,b)=>a.category.localeCompare(b.category,'fr')||a.name.localeCompare(b.name,'fr'));
  $('fleStockCount').textContent=items.length+' produit'+(items.length>1?'s':'');
  $('fleStockRows').innerHTML=items.map(p=>{
   const isKnown=known(p),isLow=low(p);
   const remaining=isKnown?esc(p.stock)+' '+esc(p.unit):'Non renseigné';
   const after=isKnown&&p.qty>0?'Après réception : '+esc(Number(p.stock)+Number(p.qty))+' '+esc(p.unit):'';
   const badge=isLow?'<span class="fle-stock-alert">Stock bas</span>':!isKnown?'<span class="fle-stock-unset">À inventorier</span>':'';
   return '<article class="fle-stock-item'+(isLow?' is-low':'')+'">'+
    '<div class="fle-stock-item-icon" aria-hidden="true">'+(p.category==='Fruit'?'🍎':'🥬')+'</div>'+
    '<div class="fle-stock-item-info"><strong>'+esc(p.name)+'</strong>'+
    '<small>'+esc(p.category)+' · '+esc(p.unit)+(p.stockMin>0?' · Alerte à '+esc(p.stockMin):'')+'</small>'+
    (Number(p.qty)>0?'<span class="fle-stock-ordered">Commandé : '+esc(p.qty)+' '+esc(p.unit)+'</span>':'')+'</div>'+
    '<div class="fle-stock-amount"><strong>'+remaining+'</strong>'+badge+(after?'<small>'+after+'</small>':'')+'</div>'+
    '<button type="button" class="fle-stock-adjust" data-stock-edit="'+esc(p.id)+'"'+(state.server&&!state.admin?' title="Accès gestion nécessaire"':'')+'>'+(isKnown?'Ajuster':'Inventaire')+'</button>'+
    '</article>';
  }).join('')||'<div class="fle-stock-empty">Aucun produit avec ces filtres.</div>';
 }
 function edit(id){
  if(!needAdmin())return;
  const p=byId(id);if(!p)return;
  currentId=id;
  $('fleStockDialogTitle').textContent=p.name;
  $('fleStockDialogIntro').textContent=known(p)?'En stock : '+p.stock+' '+p.unit:'Aucun inventaire enregistré pour ce produit.';
  $('fleStockType').value=known(p)?'add':'set';
  $('fleStockMin').value=p.stockMin||0;
  $('fleStockNote').value='';
  updateType();
  $('fleStockMovementHistory').innerHTML=(p.stockEvents||[]).slice(-5).reverse().map(e=>
   '<li><strong>'+esc(e.kind)+'</strong> · '+esc(date(e.at))+'<small>'+esc(e.before===null?'?':e.before)+' → '+esc(e.after)+(e.note?' · '+esc(e.note):'')+'</small></li>').join('')||'<li>Aucun mouvement enregistré.</li>';
  $('fleStockDialog').showModal();
 }
 function updateType(){
  const p=byId(currentId);if(!p)return;
  const type=$('fleStockType').value;
  $('fleStockQtyLabel').textContent=type==='set'?'Stock réellement compté':type==='add'?'Quantité entrée':'Quantité sortie';
  $('fleStockQty').value=type==='set'?(known(p)?p.stock:0):1;
  $('fleStockQty').focus();
 }
 function submit(e){
  e.preventDefault();
  if(!currentId||!needAdmin())return;
  const type=$('fleStockType').value,value=Number($('fleStockQty').value),
        minimum=Number($('fleStockMin').value),note=$('fleStockNote').value.trim();
  if(!Number.isSafeInteger(value)||value<0||value>1000000||
     !Number.isSafeInteger(minimum)||minimum<0||minimum>1000000){
   $('fleStockError').textContent='Indique des nombres entiers valides.';return;
  }
  $('fleStockError').textContent='';
  window.dispatchEvent(new CustomEvent('fle:stock-commit',{detail:{id:currentId,type,value,minimum,note}}));
 }
 function receive(){
  if(!needAdmin())return;
  const list=state.products.filter(p=>p.status==='active'&&p.qty>0);
  if(!list.length)return;
  const unset=list.filter(p=>!known(p));
  if(unset.length){
   alert('Stock initial manquant pour '+unset.length+' produit(s). Fais d’abord leur inventaire pour éviter un stock erroné.');
   return;
  }
  if(!confirm('Confirmer la réception de '+list.length+' produit(s) ?\n\nLe stock de chaque produit sera augmenté des quantités commandées.\nLes quantités de commande seront remises à zéro.\n\nImprimer un bon seul ne fait jamais cela.'))return;
  window.dispatchEvent(new CustomEvent('fle:stock-commit',{detail:{type:'receive'}}));
 }
 function mount(){
  if($('fleStockPanel'))return;
  const sidebar=document.querySelector('.side [data-view="order"]');
  const tabs=document.querySelector('.tabs [data-view="order"]');
  const mobile=document.querySelector('.fle-mobile-nav [data-view="order"]');
  const workspace=$('fle-catalogue');
  if(!sidebar||!tabs||!workspace||!mobile)return;
  sidebar.insertAdjacentHTML('afterend','<button type="button" data-stock-open id="fleStockSidebar">▤ &nbsp; Stock du magasin</button>');
  tabs.insertAdjacentHTML('afterend','<button type="button" data-stock-open id="fleStockTab">▤ Stock</button>');
  mobile.insertAdjacentHTML('afterend','<button type="button" data-stock-open id="fleStockMobile" aria-label="Consulter les stocks"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7 12 3l9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v10"/></svg><span>Stock</span></button>');
  const panel=document.createElement('section');panel.id='fleStockPanel';panel.className='fle-stock-panel';
  panel.setAttribute('aria-label','Gestion du stock du magasin');
  panel.innerHTML=
   '<div class="fle-stock-head"><div><span class="fle-stock-eyebrow">FRESHDESK · INVENTAIRE</span><h2>Stock du magasin</h2><p id="fleStockNotice">Les stocks sont distincts des quantités commandées.</p></div>'+
   '<button id="fleStockReceive" type="button" class="fle-stock-receive">✓ Réceptionner la commande</button></div>'+
   '<div class="fle-stock-stats">'+
   '<div><small>Références inventoriées</small><strong id="fleStockTracked">0</strong></div>'+
   '<div><small>Stock bas</small><strong id="fleStockLow">0</strong></div>'+
   '<div><small>À inventorier</small><strong id="fleStockUnknown">0</strong></div>'+
   '<div><small>À réceptionner</small><strong id="fleStockOrders">0</strong></div></div>'+
   '<p id="fleStockManageHint" class="fle-stock-manage-hint" hidden>Pour modifier les stocks ou réceptionner une commande, active <strong>Accès gestion</strong>.</p>'+
   '<div class="fle-stock-filters"><label class="fle-stock-search"><span class="sr-only">Rechercher un produit</span><input type="search" id="fleStockSearch" placeholder="Rechercher un produit…" autocomplete="off"></label>'+
   '<select id="fleStockFilter" aria-label="Filtrer les stocks"><option value="all">Tous les produits</option><option value="low">Stocks bas</option><option value="unknown">À inventorier</option><option value="ordered">En commande</option></select>'+
   '<span id="fleStockCount" class="fle-stock-count">0 produit</span></div>'+
   '<div id="fleStockRows" class="fle-stock-rows"></div>';
  workspace.parentNode.insertBefore(panel,document.querySelector('.tabs'));
  const dialog=document.createElement('dialog');dialog.className='fle-stock-dialog';dialog.id='fleStockDialog';dialog.setAttribute('aria-labelledby','fleStockDialogTitle');
  dialog.innerHTML='<form id="fleStockForm"><header><span>MODIFIER LE STOCK</span><button type="button" class="fle-stock-close" aria-label="Fermer">✕</button></header>'+
   '<h2 id="fleStockDialogTitle">Produit</h2><p id="fleStockDialogIntro"></p>'+
   '<label>Action<select id="fleStockType"><option value="set">Inventaire / correction</option><option value="add">Entrée en stock (+)</option><option value="remove">Sortie du stock (−)</option></select></label>'+
   '<label><span id="fleStockQtyLabel">Quantité</span><input id="fleStockQty" type="number" min="0" max="1000000" step="1" required inputmode="numeric"></label>'+
   '<label>Seuil d’alerte (0 = désactivé)<input id="fleStockMin" type="number" min="0" max="1000000" step="1" required inputmode="numeric"></label>'+
   '<label>Motif / remarque (facultatif)<input id="fleStockNote" type="text" maxlength="140" placeholder="Ex. Inventaire du matin"></label>'+
   '<p id="fleStockError" class="fle-stock-error" role="alert"></p>'+
   '<button type="submit" class="fle-stock-submit">Enregistrer le stock</button>'+
   '<section class="fle-stock-movements"><strong>Derniers mouvements</strong><ul id="fleStockMovementHistory"></ul></section></form>';
  document.body.appendChild(dialog);
  document.querySelectorAll('[data-stock-open]').forEach(btn=>btn.addEventListener('click',()=>changeView(true)));
  // The core catalogue/order links have their own click handlers.
  document.addEventListener('click',e=>{if(e.target.closest('[data-view]'))changeView(false)},true);
  $('fleStockSearch').addEventListener('input',render);
  $('fleStockFilter').addEventListener('change',e=>{filter=e.target.value;render()});
  $('fleStockRows').addEventListener('click',e=>{const b=e.target.closest('[data-stock-edit]');if(b)edit(b.dataset.stockEdit)});
  $('fleStockType').addEventListener('change',updateType);
  $('fleStockForm').addEventListener('submit',submit);
  $('fleStockReceive').addEventListener('click',receive);
  dialog.querySelector('.fle-stock-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  window.addEventListener('fle:stock-feedback',e=>{
   if(e.detail?.ok&&dialog.open)dialog.close();
   else if(dialog.open&&e.detail?.message)$('fleStockError').textContent=e.detail.message;
  });
  window.addEventListener('fle:state',e=>{state=e.detail||state;if(open)changeButtons();render()});
  window.dispatchEvent(new Event('fle:request-state'));
 }
 function changeButtons(){
  document.querySelectorAll('[data-stock-open]').forEach(x=>x.classList.add('active'));
  document.querySelectorAll('.side [data-view],.fle-mobile-nav [data-view]').forEach(x=>x.classList.remove('active'));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
