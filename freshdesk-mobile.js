/* FreshDesk Mobile V6.
 * UI-only enhancement. Does not modify the catalog, Supabase logic,
 * administrator authorization, order saving, or printing templates. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const mobile=()=>window.matchMedia('(max-width:700px)').matches;
 function init(){
  // These buttons are not data-view controls; the original application
  // continues to own all state changes, including print and permissions.
  $('fleMobileSearch')?.addEventListener('click',()=>{
   const input=$('search');
   if(!input)return;
   input.scrollIntoView?.({block:'center',behavior:'auto'});
   input.focus({preventScroll:true});
  });
  $('fleMobilePrint')?.addEventListener('click',()=>$('topPrint')?.click());

  // Keep tab content in view when changing between catalogue and order.
  document.querySelectorAll('.fle-mobile-nav [data-view]').forEach(button=>{
   button.addEventListener('click',()=>{
    if(!mobile())return;
    const workspace=document.querySelector('.workspace');
    if(workspace){
     requestAnimationFrame(()=>workspace.scrollIntoView({block:'start',behavior:'auto'}));
    }
   });
  });

  const promptDialog=$('fleInstallDialog');
  let deferredInstall=null;
  window.addEventListener('beforeinstallprompt',event=>{
   event.preventDefault();
   deferredInstall=event;
  });
  $('fleInstall')?.addEventListener('click',async()=>{
   if(deferredInstall){
    const event=deferredInstall;
    deferredInstall=null;
    try{await event.prompt()}catch{}
    return;
   }
   const p=$('fleInstallInstructions');
   if(p){
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent||'');
    p.textContent=ios?
     'Sur iPhone ou iPad, ouvre FreshDesk avec Safari, touche Partager puis « Sur l’écran d’accueil ».':
     'Dans le menu de ton navigateur, sélectionne « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur Android, utilise de préférence Chrome.';
   }
   if(promptDialog?.showModal)promptDialog.showModal();
  });
  $('fleInstallClose')?.addEventListener('click',()=>promptDialog?.close());
  promptDialog?.addEventListener('click',e=>{if(e.target===promptDialog)promptDialog.close()});

  // Optional native-style installation and static-shell offline fallback.
  // No API/Supabase responses are cached.
  if('serviceWorker' in navigator && location.protocol==='https:'){
   window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./freshdesk-sw.js',{scope:'./'}).catch(()=>{});
   },{once:true});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
