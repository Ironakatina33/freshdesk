/* FreshDesk · Product Analytics 1.0
   Shared product JSON only. No network access, no cashier-sale inference.
   Monthly aggregates persist when the detailed events roll off. */
(function(root){
 'use strict';
 const TYPES={ordered:'Commandé',received:'Réceptionné',exit:'Sortie enregistrée',
  waste:'Perte / casse',entry:'Entrée manuelle',inventory:'Inventaire',adjust:'Correction'};
 const FIELDS={ordered:'ordered',received:'received',exit:'exit',waste:'waste',entry:'entry'};
 const MAX_EVENTS=200,MAX_MONTHS=120,MAX_LOTS=100;
 const num=x=>Number.isSafeInteger(Number(x))&&Number(x)>=0&&Number(x)<=1000000?Number(x):0;
 const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(x)&&Number.isFinite(Date.parse(x));
 const cleanMonth=x=>x&&/^\d{4}-(0[1-9]|1[0-2])$/.test(x);
 const clampString=(x,n)=>String(x??'').slice(0,n);
 function seasonFor(iso){
  const month=Number(iso.slice(5,7));
  return month>=3&&month<=5?'Printemps':month>=6&&month<=8?'Été':month>=9&&month<=11?'Automne':'Hiver';
 }
 function normalizeEvent(e,unit){
  if(!e||!validDate(e.at))return null;
  const type=Object.prototype.hasOwnProperty.call(TYPES,e.type)?e.type:'adjust';
  return {id:clampString(e.id||e.at+'-'+type+'-'+e.qty,90),at:e.at.slice(0,36),
   type,qty:num(e.qty),unit:clampString(e.unit||unit,30),
   note:clampString(e.note,140),rotationUnits:num(e.rotationUnits),
   rotationDayUnits:Math.max(0,Math.min(100000000,Number(e.rotationDayUnits)||0))};
 }
 function emptyMonth(month,unit){
  return {month,unit,ordered:0,received:0,exit:0,waste:0,entry:0,
   rotationUnits:0,rotationDayUnits:0};
 }
 function cleanMonthRow(x){
  if(!x||!cleanMonth(x.month))return null;
  return {...emptyMonth(x.month,clampString(x.unit||'Colis',30)),
   ordered:num(x.ordered),received:num(x.received),exit:num(x.exit),
   waste:num(x.waste),entry:num(x.entry),rotationUnits:num(x.rotationUnits),
   rotationDayUnits:Math.max(0,Number(x.rotationDayUnits)||0)};
 }
 function addMonthly(months,event){
  const key=event.at.slice(0,7);
  if(!cleanMonth(key))return months;
  let row=months.find(m=>m.month===key&&m.unit===event.unit);
  if(!row){row=emptyMonth(key,event.unit);months.push(row)}
  const field=FIELDS[event.type];
  if(field)row[field]+=event.qty;
  if(event.rotationUnits>0){
   row.rotationUnits+=event.rotationUnits;row.rotationDayUnits+=event.rotationDayUnits;
  }
  months.sort((a,b)=>a.month.localeCompare(b.month)||a.unit.localeCompare(b.unit));
  if(months.length>MAX_MONTHS)months.splice(0,months.length-MAX_MONTHS);
  return months;
 }
 function legacyType(kind){
  const k=String(kind||'').toLowerCase();
  if(k.startsWith('réception'))return 'received';
  if(k.startsWith('sortie'))return 'exit';
  if(k.startsWith('entrée'))return 'entry';
  if(k.startsWith('inventaire'))return 'inventory';
  return 'adjust';
 }
 function fromOld(e,unit,i){
  if(!e||!validDate(e.at))return null;
  const type=legacyType(e.kind);
  const qty=(type==='received'||type==='exit'||type==='entry')?Math.abs(Number(e.delta)||0):0;
  return normalizeEvent({id:'legacy-'+i+'-'+e.at,at:e.at,type,qty,unit,note:e.note||e.kind},unit);
 }
 function cleanLot(x){
  if(!x||!Number.isFinite(Number(x.remaining)))return null;
  return {remaining:num(x.remaining),at:validDate(x.at)?x.at.slice(0,36):null};
 }
 function reconcileLots(lots,stock){
  const target=stock===null||stock===undefined?null:num(stock);
  if(target===null)return [];
  const valid=lots.filter(x=>x.remaining>0);
  let total=valid.reduce((a,b)=>a+b.remaining,0);
  if(total<target)valid.unshift({remaining:target-total,at:null});
  if(total>target){
   let delta=total-target;
   for(let i=0;i<valid.length&&delta>0;i++){let n=Math.min(valid[i].remaining,delta);valid[i].remaining-=n;delta-=n}
  }
  return valid.filter(x=>x.remaining>0);
 }
 function normalize(product){
  const src=product.analytics&&typeof product.analytics==='object'?product.analytics:{};
  const unit=clampString(product.unit||'Colis',30);
  const hasNew=Array.isArray(src.events)||Array.isArray(src.months);
  const old=hasNew?[]:(Array.isArray(product.stockEvents)?product.stockEvents:[])
   .map((e,i)=>fromOld(e,unit,i)).filter(Boolean);
  const events=(Array.isArray(src.events)?src.events.map(e=>normalizeEvent(e,unit)).filter(Boolean):old)
   .sort((a,b)=>a.at.localeCompare(b.at)).slice(-MAX_EVENTS);
  const months=Array.isArray(src.months)?
   src.months.map(cleanMonthRow).filter(Boolean).slice(-MAX_MONTHS):
   events.reduce((a,e)=>addMonthly(a,e),[]);
  const lots=Array.isArray(src.lots)?src.lots.map(cleanLot).filter(Boolean):[];
  const originalLots=reconcileLots(lots,product.stock);
  return {events,months,lots:originalLots,sentQty:num(src.sentQty),
   lastSentAt:validDate(src.lastSentAt)?src.lastSentAt.slice(0,36):null};
 }
 function ensure(product){
  if(!product.analytics)product.analytics=normalize(product);
  return product.analytics;
 }
 function moveLots(lots,amount,at,trackRotation){
  let remain=num(amount),units=0,days=0;
  // FIFO estimate: the date of a known recorded entry, never assumed for
  // opening balances. Manual exits are not necessarily cashier sales.
  for(const lot of lots){
   if(remain<=0)break;
   const taken=Math.min(lot.remaining,remain);lot.remaining-=taken;remain-=taken;
   if(trackRotation&&lot.at&&validDate(lot.at)){
    const elapsed=(Date.parse(at)-Date.parse(lot.at))/86400000;
    if(elapsed>=0&&Number.isFinite(elapsed)){units+=taken;days+=taken*elapsed}
   }
  }
  for(let i=lots.length-1;i>=0;i--)if(lots[i].remaining<=0)lots.splice(i,1);
  return {rotationUnits:units,rotationDayUnits:days};
 }
 function addEvent(product,{type,qty,at,note,before,after}){
  if(!Object.prototype.hasOwnProperty.call(TYPES,type))throw Error('Mouvement inconnu');
  const state=ensure(product),stamp=validDate(at)?at:new Date().toISOString(),amount=num(qty);
  let rotation={rotationUnits:0,rotationDayUnits:0};
  const lots=state.lots;
  if(type==='received'||type==='entry'){
   if(amount)lots.push({remaining:amount,at:stamp});
  }else if(type==='exit'||type==='waste'){
   rotation=moveLots(lots,amount,stamp,type==='exit');
  }else if(type==='inventory'||type==='adjust'){
   if(after!==null&&after!==undefined){
    const delta=num(after)-(before===null||before===undefined?0:num(before));
    if(delta>0)lots.push({remaining:delta,at:null});
    if(delta<0)moveLots(lots,-delta,stamp,false);
   }
  }
  if(type==='ordered'){
   state.sentQty=amount;state.lastSentAt=stamp;
  }else if(type==='received'){
   state.sentQty=0;state.lastSentAt=null;
  }
  // Never discard current stock just because the number of lots grows.
  if(lots.length>MAX_LOTS){
   const extra=lots.splice(0,lots.length-(MAX_LOTS-1));
   lots.unshift({remaining:extra.reduce((a,b)=>a+b.remaining,0),at:null});
  }
  const event=normalizeEvent({id:stamp+'-'+type+'-'+Math.random().toString(36).slice(2,7),
   at:stamp,type,qty:amount,unit:product.unit,note, ...rotation},product.unit);
  state.events.push(event);
  if(state.events.length>MAX_EVENTS)state.events.splice(0,state.events.length-MAX_EVENTS);
  addMonthly(state.months,event);
  return event;
 }
 function periodRows(product,period='12m',now=new Date()){
  const analytics=normalize(product),unit=clampString(product.unit||'Colis',30);
  let rows=analytics.months.filter(r=>r.unit===unit);
  const y=now.getFullYear(),m=now.getMonth()+1;
  if(period==='year')rows=rows.filter(r=>r.month.startsWith(String(y)));
  if(period==='12m'){
   const cut=new Date(Date.UTC(y,m-12,1)).toISOString().slice(0,7);
   rows=rows.filter(r=>r.month>=cut);
  }
  if(period==='3m'){
   const cut=new Date(Date.UTC(y,m-3,1)).toISOString().slice(0,7);
   rows=rows.filter(r=>r.month>=cut);
  }
  return rows.sort((a,b)=>a.month.localeCompare(b.month));
 }
 function totals(rows){
  return rows.reduce((sum,row)=>{
   for(const field of ['ordered','received','exit','waste','entry','rotationUnits','rotationDayUnits'])
    sum[field]+=(row[field]||0);
   return sum;
  },{ordered:0,received:0,exit:0,waste:0,entry:0,rotationUnits:0,rotationDayUnits:0});
 }
 root.FreshDeskAnalytics=Object.freeze({normalize,addEvent,periodRows,totals,seasonFor,TYPES});
})(window);
