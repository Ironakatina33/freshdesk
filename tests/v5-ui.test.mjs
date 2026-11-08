import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V5 preserves order manager, print, product modes and Supabase hooks',()=>{
 const html=read('index.html');
 for(const token of ['id="productRows"','id="alternateView"','id="printSheet"',
 'id="topPrint"','id="mainPrint"','id="sidePrint"','id="codeForm"','id="codeInput"',
 'id="productForm"','id="syncTitle"','id="exportBtn"','id="importBtn"',
 'data-view="catalog"','data-view="order"','data-layout="table"',
 'data-layout="list"','data-layout="cards"','id="fleThemeBtn"']){
  assert.ok(html.includes(token),'Missing function/control '+token);
 }
 assert.match(html,/client=window\.supabase\.createClient/);
 assert.match(html,/await loadRemote\(true\)/);
 assert.match(html,/async function save\(\)/);
 assert.match(html,/function buildPrint\(\)/);
 assert.match(html,/\@media print/);
});
test('V5 scripts parse correctly, including the preserved inline application',()=>{
 const html=read('index.html');
 const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(m=>m[1]).filter(s=>s.trim());
 assert.ok(inlineScripts.length>=2,'Expected theme bootstrap + original app');
 inlineScripts.forEach((js,i)=>assert.doesNotThrow(()=>new Script(js), 'inline script '+i));
 assert.doesNotThrow(()=>new Script(read('freshdesk-v5.js')));
});
test('V5 design and night theme are versioned and accessible',()=>{
 const html=read('index.html'),css=read('freshdesk-v5.css'),js=read('freshdesk-v5.js');
 assert.match(html,/freshdesk-v5\.css\?v=5\.0\.0/);
 assert.match(html,/freshdesk-v5\.js\?v=5\.0\.0/);
 assert.match(css,/html\[data-fle-theme="dark"\]/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media screen/);
 assert.match(css,/\.product-table tbody tr:hover/);
 assert.match(js,/freshdesk\.theme\.v5/);
 assert.match(js,/search/);
 assert.match(html,/https:\/\/city-ornano\.fr\//);
});
test('V5 theme toggle is local-only (no API or order writes)',()=>{
 const code=read('freshdesk-v5.js');
 const listeners={};
 const btn={textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(t,f){listeners[t]=f}};
 const meta={content:''};
 const search={focus(){}};
 const root={dataset:{}};
 const store=new Map();
 const document={
  readyState:'complete',
  documentElement:root,
  body:{classList:{add(){}}},
  getElementById(id){return id==='fleThemeBtn'?btn:id==='search'?search:null},
  querySelector(sel){return sel==='meta[name="theme-color"]'?meta:null},
  querySelectorAll(){return []},
  addEventListener(t,f){listeners['doc-'+t]=f},
 };
 const fakeWindow={matchMedia:()=>({matches:false})};
 const context={document,window:fakeWindow,
  localStorage:{setItem(k,v){store.set(k,v)},getItem(k){return store.get(k)||null}}};
 runInNewContext(code,context);
 assert.equal(root.dataset.fleTheme,'light');
 assert.equal(btn.attrs['aria-label'],'Activer le mode nuit');
 listeners.click();
 assert.equal(root.dataset.fleTheme,'dark');
 assert.equal(meta.content,'#172937');
 assert.equal(store.get('freshdesk.theme.v5'),'dark');
 listeners.click();
 assert.equal(root.dataset.fleTheme,'light');
});
