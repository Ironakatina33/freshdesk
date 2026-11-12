/* FreshDesk Insights 1.0 — product sheets with factual, event-derived metrics.
   Never assume cashier sales, old order history or unknown lot ages. */
(function(){
 'use strict';
 const A=()=>window.FreshDeskAnalytics;
 const $=id=>document.getElementById(id);
 const esc=v=>String(v===null||v===undefined?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fr=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1});
 let state={products:[],admin:false,server:false,dirty:false,saving:false,conflict:false};
 let currentId=null,period='12m',section='overview';
 const months=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
 const seasons=['Hiver','Printemps','Été','Automne'];
 const date=s=>{try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s))}catch{return String(s||'')}};
 const product=()=>state.products.find(p=>p.id===currentId);
 const known=p=>p.stock!==null&&p.stock!==undefined&&Number.isFinite(Number(p.stock));
 const shelfLabel=p=>p.shelfFill===0?'Vide · 0 %':p.shelfFill===25?'Moins de 50 %':p.shelfFill===75?'50 à 99 %':p.shelfFill===100?'Plein · 100 %':'Non renseigné';
 function relativePeriod(iso){
  if(period==='all')return true;
  if(period==='year')return iso.slice(0,4)===String(new Date().getFullYear());
  const now=new Date();const m=period==='3m'?3:12;
  const start=new Date(Date.UTC(now.getFullYear(),now.getMonth()+1-m,1)).toISOString().slice(0,7);
  return iso.slice(0,7)>=start;
 }
 function monthRows(p){return A().periodRows(p,period)}
 function totalCard(title,value,hint,decor=''){
  return '<div class="fle-ins-kpi '+decor+'"><span>'+esc(title)+'</span>'+
   '<strong>'+esc(value)+'</strong><small>'+esc(hint)+'</small></div>';
 }
 function dateStats(p,rows,all){
  const events=A().normalize(p).events.filter(e=>e.unit===p.unit&&relativePeriod(e.at));
  // Estimate stock coverage only after 7+ days of *recorded* exits in the last
  // 30 days. The scope is manual exits, not till receipts.
  const cutoff=Date.now()-30*86400000;
  const exits=events.filter(e=>e.type==='exit'&&Date.parse(e.at)>=cutoff);
  const byDay=new Set(exits.map(e=>e.at.slice(0,10)));
  let coverage=null;
  if(known(p)&&byDay.size>=2&&exits.length>=2){
   const first=Math.min(...exits.map(e=>Date.parse(e.at)));
   const span=Math.min(30,Math.max(1,(Date.now()-first)/86400000));
   if(span>=7){
    const daily=exits.reduce((n,e)=>n+e.qty,0)/span;
    if(daily>0)coverage=Number(p.stock)/daily;
   }
  }
  const avg=all.rotationUnits>0?all.rotationDayUnits/all.rotationUnits:null;
  const unit=esc(p.unit);
  return '<div class="fle-ins-kpis">'+
   totalCard('Stock en réserve',known(p)?fr.format(p.stock):'—',known(p)?unit:'À inventorier','is-hero')+
   totalCard('Remplissage du rayon',shelfLabel(p),'Indication visuelle · sans impact sur le stock','is-shelf')+
   totalCard('Quantité commandée*',fr.format(all.ordered),unit+' marqués envoyés')+
   totalCard('Réceptionnés',fr.format(all.received),unit+' reçus')+
   totalCard('Sorties saisies',fr.format(all.exit),unit+' déclarés')+
   totalCard('Pertes / casse',fr.format(all.waste),unit+' déclarés','is-warn')+
   totalCard('Délai en stock',avg!==null?fr.format(avg)+' j':'—',avg!==null?'Estimation FIFO · '+all.rotationUnits+' '+unit+' suivis':'Ancienneté inconnue')+
   '</div>'+
   '<p class="fle-ins-subnote">* « Commandés » signifie <strong>marqués envoyés dans FLE</strong>, pas transmis automatiquement au fournisseur. Les sorties ne sont pas des ventes de caisse. '+(coverage===null?'La couverture de stock sera estimée après plusieurs sorties sur au moins 7 jours.':'Au rythme des sorties saisies, le stock couvre environ <strong>'+fr.format(coverage)+' jour(s)</strong>.')+'</p>';
 }
 function chartBars(title,rows,keys){
  const values=rows.map(r=>keys.map(k=>Number(r[k]||0)));
  const max=Math.max(1,...values.flat());
  const hasData=values.some(arr=>arr.some(v=>v>0));
  if(!rows.length||!hasData)return '<section class="fle-ins-chart"><h3>'+esc(title)+'</h3><p class="fle-ins-empty">Pas encore de volumes enregistrés pour cette période.</p></section>';
  const labels={ordered:'Commandé',received:'Réceptionné',exit:'Sorti',waste:'Pertes'};
  const colors={ordered:'ordered',received:'received',exit:'exit',waste:'waste'};
  const bars=rows.map((row,i)=>'<div class="fle-ins-chart-col" role="group" aria-label="'+esc(row.label)+': '+esc(keys.map(k=>labels[k]+' '+fr.format(row[k]||0)).join(', '))+'">'+
    '<div class="fle-ins-bars">'+keys.map(k=>{
     const val=Math.max(0,Number(row[k])||0),height=val===0?0:Math.max(3,val/max*100);
     return '<span class="fle-ins-bar '+colors[k]+'" style="height:'+height.toFixed(2)+'%" title="'+esc(labels[k]+' : '+fr.format(val))+'"></span>';
    }).join('')+'</div><small>'+esc(row.label)+'</small></div>').join('');
  return '<section class="fle-ins-chart"><div class="fle-ins-chart-top"><h3>'+esc(title)+'</h3>'+
   '<div class="fle-ins-legend">'+keys.map(k=>'<span class="'+colors[k]+'">'+esc(labels[k])+'</span>').join('')+'</div></div>'+
   '<div class="fle-ins-chart-scroller"><div class="fle-ins-chart-grid" style="--fle-chart-cols:'+Math.max(4,rows.length)+'">'+bars+'</div></div></section>';
 }
 function monthlySeries(rows){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  if(period==='all'){
   return rows.slice(-24).map(r=>({...r,label:months[Number(r.month.slice(5))-1]+' '+r.month.slice(2,4)}));
  }
  let length=period==='3m'?3:period==='year'?m+1:12;
  length=Math.max(1,length);
  return Array.from({length},(_,i)=>{
   const date=new Date(Date.UTC(y,period==='year'?i:m-length+1+i,1));
   const key=date.toISOString().slice(0,7),match=rows.find(r=>r.month===key);
   return {...(match||{ordered:0,received:0,exit:0,waste:0}),
    label:months[date.getUTCMonth()]+(period==='12m'?' '+String(date.getUTCFullYear()).slice(2):'')};
  });
 }
 function seasonsSeries(rows){
  return seasons.map(name=>{
   const matched=rows.filter(r=>A().seasonFor(r.month+'-15T12:00:00Z')===name);
   const t=A().totals(matched);
   return {label:name,ordered:t.ordered,received:t.received,exit:t.exit,waste:t.waste};
  });
 }
 function history(p){
  const events=A().normalize(p).events.filter(e=>e.unit===p.unit&&relativePeriod(e.at)).slice(-80).reverse();
  if(!events.length)return '<p class="fle-ins-empty">Aucun mouvement enregistré sur cette période. Les anciennes commandes ne peuvent pas être reconstituées.</p>';
  const labels=A().TYPES;
  const icons={ordered:'↗',cancel:'×',received:'↓',exit:'↑',waste:'!',entry:'+',inventory:'≡',adjust:'±'};
  return '<div class="fle-ins-timeline">'+events.map(e=>
   '<div class="fle-ins-event"><span class="fle-ins-event-icon '+esc(e.type)+'">'+icons[e.type]+'</span>'+
   '<div class="fle-ins-event-desc"><strong>'+esc(labels[e.type]||e.type)+'</strong>'+
   '<small>'+esc(date(e.at))+'</small>'+(e.note?'<p>'+esc(e.note)+'</p>':'')+'</div>'+
   '<strong class="fle-ins-event-qty '+esc(e.type)+'">'+(e.type==='exit'||e.type==='waste'||e.type==='cancel'?'−':e.type==='received'||e.type==='entry'?'+':'')+
   esc(fr.format(e.qty))+' <small>'+esc(e.unit)+'</small></strong></div>'
  ).join('')+'</div><p class="fle-ins-subnote">Derniers événements conservés sur la fiche. Les totaux mensuels persistent même lorsque les anciens détails ne sont plus affichés.</p>';
 }
 function currentPill(p){
  const filled=p.shelfFill===75||p.shelfFill===100;
  const shelf=p.shelfFill===null?'<span class="fle-ins-badge neutral">Rayon non renseigné</span>':
   '<span class="fle-ins-badge '+(p.shelfFill===0?'warning':filled?'good':'neutral')+'">Rayon : '+esc(shelfLabel(p))+'</span>';
  const reserve=!known(p)?'<span class="fle-ins-badge neutral">Réserve à inventorier</span>':
   p.stock===0?'<span class="fle-ins-badge '+(filled?'neutral':'warning')+'">Réserve vide</span>':
   p.stockMin>0&&p.stock<=p.stockMin?'<span class="fle-ins-badge warning">Réserve basse</span>':
   '<span class="fle-ins-badge good">En réserve</span>';
  return reserve+' '+shelf;
 }
 function content(p,rows,totals){
  if(section==='history')return '<section class="fle-ins-block"><h3>Historique des mouvements</h3>'+history(p)+'</section>';
  if(section==='trends'){
   return chartBars('Commandes et réceptions',monthlySeries(rows),['ordered','received'])+
    chartBars('Sorties et pertes',monthlySeries(rows),['exit','waste'])+
    chartBars('Comparaison des saisons',seasonsSeries(rows),['ordered','received'])+
    '<p class="fle-ins-subnote">Une saison est regroupée par mois calendrier. Les périodes incomplètes restent partielles. Les données sont enregistrées à partir du suivi des mouvements.</p>';
  }
  return dateStats(p,rows,totals)+
   chartBars('Quantités commandées et reçues',monthlySeries(rows),['ordered','received'])+
   '<div class="fle-ins-two"><div><h3>Commande actuelle</h3><p>'+fr.format(p.qty)+' '+esc(p.unit)+' en préparation</p>'+
   '<small>'+(p.analytics?.sentQty?'Déjà marquée envoyée : '+fr.format(p.analytics.sentQty)+' '+esc(p.unit):'Aucune commande envoyée en attente pour cette référence')+'</small></div>'+
   '<div><h3>Historique de la référence</h3><p>'+fr.format(totals.exit)+' '+esc(p.unit)+' sortis manuellement</p>'+
   '<small>Aucune vente caisse n’est importée automatiquement.</small></div></div>';
 }
 function update(){
  const dialog=$('fleInsightsDialog');
  if(!dialog||!dialog.open)return;
  const p=product();
  if(!p){dialog.close();return}
  const rows=monthRows(p),sum=A().totals(rows);
  $('fleInsightsProduct').textContent=p.name;
  $('fleInsightsCategory').textContent=p.category+' · '+p.unit;
  $('fleInsightsEmoji').textContent=p.category==='Fruit'?'🍎':'🥬';
  $('fleInsightsStatus').innerHTML=currentPill(p);
  $('fleInsightsBody').innerHTML=content(p,rows,sum);
  $('fleInsightsRange').value=period;
  dialog.querySelectorAll('[data-insights-tab]').forEach(b=>{
   const active=b.dataset.insightsTab===section;
   b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));
  });
  const adjust=$('fleInsightsAdjust');
  adjust.hidden=!!state.server&&!state.admin;
  adjust.disabled=!!state.saving||!!state.conflict;
  $('fleInsightsScope').textContent=period==='3m'?'3 derniers mois':period==='12m'?'12 derniers mois':period==='year'?'Année '+new Date().getFullYear():'Historique disponible';
 }
 function openProduct(id){
  currentId=id;section='overview';period='12m';
  const dialog=$('fleInsightsDialog');
  if(!dialog)return;
  if(!dialog.open)dialog.showModal();
  update();
 }
 function mount(){
  if($('fleInsightsDialog'))return;
  const dialog=document.createElement('dialog');
  dialog.id='fleInsightsDialog';dialog.className='fle-insights-dialog';dialog.setAttribute('aria-labelledby','fleInsightsProduct');
  dialog.innerHTML='<header class="fle-insights-header"><div class="fle-insights-product-head">'+
   '<span class="fle-insights-emoji" id="fleInsightsEmoji" aria-hidden="true">🍎</span>'+
   '<div><small>FICHE PRODUIT · FRESHDESK</small><h2 id="fleInsightsProduct">Produit</h2>'+
   '<p id="fleInsightsCategory"></p><div id="fleInsightsStatus"></div></div></div>'+
   '<button class="fle-insights-close" type="button" aria-label="Fermer la fiche">✕</button></header>'+
   '<div class="fle-insights-toolbar"><div class="fle-insights-tabs" role="tablist" aria-label="Sections du produit">'+
   '<button role="tab" type="button" data-insights-tab="overview">Aperçu</button>'+
   '<button role="tab" type="button" data-insights-tab="trends">Statistiques</button>'+
   '<button role="tab" type="button" data-insights-tab="history">Historique</button></div>'+
   '<label class="fle-insights-period">Période<select id="fleInsightsRange">'+
   '<option value="3m">3 mois</option><option value="12m">12 mois</option>'+
   '<option value="year">Cette année</option><option value="all">Tout</option></select></label></div>'+
   '<div id="fleInsightsBody" class="fle-insights-body"></div>'+
   '<footer class="fle-insights-footer"><small id="fleInsightsScope">12 derniers mois</small>'+
   '<div><button type="button" id="fleInsightsAdjust" class="fle-insights-adjust">Ajuster le stock</button>'+
   '<button type="button" class="fle-insights-close fle-insights-done">Fermer</button></div></footer>';
  document.body.appendChild(dialog);
  dialog.querySelectorAll('.fle-insights-close').forEach(b=>b.addEventListener('click',()=>dialog.close()));
  dialog.querySelectorAll('[data-insights-tab]').forEach(b=>b.addEventListener('click',()=>{section=b.dataset.insightsTab;update()}));
  $('fleInsightsRange').addEventListener('change',e=>{period=e.target.value;update()});
  $('fleInsightsAdjust').addEventListener('click',()=>{
   const id=currentId;dialog.close();window.dispatchEvent(new CustomEvent('fle:stock-edit',{detail:{id}}));
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  window.addEventListener('fle:insights-open',e=>{if(e.detail?.id)openProduct(e.detail.id)});
  window.addEventListener('fle:state',e=>{state=e.detail||state;if(dialog.open)update()});
  window.dispatchEvent(new Event('fle:request-state'));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
