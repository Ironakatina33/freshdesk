/* FreshDesk V5: visual enhancements only, no remote write actions.
   The catalogue and Supabase state remain owned by the original application. */
(function(){
 'use strict';
 const KEY='freshdesk.theme.v5';
 const root=document.documentElement;
 const theme=()=>root.dataset.fleTheme==='dark'?'dark':'light';
 function applyTheme(value){
  const next=value==='dark'?'dark':'light';
  root.dataset.fleTheme=next;
  try{localStorage.setItem(KEY,next)}catch{}
  const btn=document.getElementById('fleThemeBtn');
  if(btn){
   btn.textContent=next==='dark'?'☀':'☾';
   btn.setAttribute('aria-label',next==='dark'?'Activer le mode clair':'Activer le mode nuit');
   btn.title=next==='dark'?'Mode clair':'Mode nuit';
   btn.setAttribute('aria-pressed',String(next==='dark'));
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=next==='dark'?'#172937':'#f5f7f6';
 }
 function setup(){
  let stored='light';
  try{stored=localStorage.getItem(KEY)||'light'}catch{}
  applyTheme(stored);
  const themeBtn=document.getElementById('fleThemeBtn');
  themeBtn?.addEventListener('click',()=>applyTheme(theme()==='dark'?'light':'dark'));
  if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   document.body.classList.add('fle-ready');
  }
  // Product search: Ctrl+K or /, only when no text field already has focus.
  document.addEventListener('keydown',e=>{
   const target=e.target;
   const typing=target?.matches?.('input, textarea, select, [contenteditable="true"]');
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();document.getElementById('search')?.focus();return;
   }
   if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&!typing&&e.key==='/'){
    e.preventDefault();document.getElementById('search')?.focus();
   }
  });
  // Use the native view buttons. This animation never updates order state.
  const workplace=document.querySelector('.workspace');
  document.querySelectorAll('[data-view],[data-layout]').forEach(button=>{
   button.addEventListener('click',()=>{
    if(!workplace||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    workplace.classList.remove('fle-switch');
    void workplace.offsetWidth;
    workplace.classList.add('fle-switch');
   });
  });
  workplace?.addEventListener('animationend',e=>{
   if(e.target!==workplace)return;
   workplace.classList.remove('fle-switch');
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
