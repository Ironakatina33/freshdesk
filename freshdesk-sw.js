/* FreshDesk PWA V6 — cache only the static shell, never Supabase data. */
const VERSION='freshdesk-insights-v1.1.1';
const SHELL=[
 './','./index.html','./brand-fresh.svg','./manifest.webmanifest',
 './freshdesk-v5.css?v=5.4.0','./freshdesk-mobile.css?v=6.0.0','./freshdesk-mobile-v7.css?v=7.0.0','./freshdesk-mobile-v8.css?v=8.0.0','./freshdesk-mobile-v9.css?v=9.0.0','./freshdesk-stock.css?v=1.1.0','./freshdesk-insights.css?v=1.0.2','./freshdesk-history.js?v=1.2.2','./freshdesk-analytics-core.js?v=1.0.1','./freshdesk-stock.js?v=1.2.1','./freshdesk-insights.js?v=1.0.2',
 './freshdesk-v5.js?v=5.0.0','./freshdesk-mobile.js?v=6.1.0',
 './config.js'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(async cache=>{
  // Keep installation non-blocking when one resource is unavailable.
  await Promise.allSettled(SHELL.map(url=>cache.add(url)));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key.startsWith('freshdesk-')&&key!==VERSION).map(key=>caches.delete(key))
 )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 // The shell uses a network-first strategy to avoid outdated quantities.
 // All dynamic Supabase calls happen on a different origin and pass through.
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok)caches.open(VERSION).then(c=>c.put('./index.html',response.clone())).catch(()=>{});
   return response;
  }).catch(async()=>await caches.match('./index.html')||Response.error()));
  return;
 }
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
