import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Mobile: bottom tabs, quantity controls, install affordance and preserved server code',()=>{
 const html=read('index.html');
 for(const key of ['id="fleMobileOrderCount"','id="fleMobileSearch"','id="fleMobilePrint"',
    'id="fleInstall"','id="fleInstallDialog"','data-view="catalog"','data-view="order"',
    'id="codeForm"','id="productForm"','id="printSheet"']){
  assert.ok(html.includes(key),'Missing mobile/legacy feature '+key);
 }
 assert.match(html,/window\.matchMedia\('\(max-width:700px\)'\)\.matches\?'list':'table'/);
 assert.match(html,/mobileBadge\.dataset\.count=String\(n\)/);
 assert.match(html,/freshdesk-mobile\.css\?v=6\.0\.0/);
 assert.match(html,/freshdesk-mobile\.js\?v=6\.0\.0/);
 assert.match(html,/freshdesk_save_with_pin/);
 assert.match(html,/function buildPrint\(/);
});
test('Mobile: safe area, 44px touch targets, no print changes, and dark theme',()=>{
 const css=read('freshdesk-mobile.css');
 const base=read('index.html');
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/\.fle-mobile-nav/);
 assert.match(css,/\.list-line \.qty button/);
 assert.match(css,/html\[data-fle-theme="dark"\]/);
 assert.match(css,/@media screen and \(max-width:700px\)/);
 assert.match(css,/@media screen and \(min-width:701px\)/);
 assert.match(base,/@media print/);
});
test('Mobile: scripts and service worker parse; only static app shell is cached',()=>{
 assert.doesNotThrow(()=>new Script(read('freshdesk-mobile.js')));
 assert.doesNotThrow(()=>new Script(read('freshdesk-sw.js')));
 const sw=read('freshdesk-sw.js'),mf=JSON.parse(read('manifest.webmanifest'));
 assert.match(sw,/url\.origin!==self\.location\.origin/);
 assert.match(sw,/request\.method!=='GET'/);
 assert.doesNotMatch(sw,/supabase_save_with_pin/);
 assert.equal(mf.display,'standalone');
 assert.equal(mf.scope,'./');
});
test('Mobile: search/print buttons reuse original actions, not new save endpoints',()=>{
 const listeners={},clicks={print:0,search:0,install:0};
 const elements={
  fleMobileSearch:{addEventListener(t,cb){listeners['search-'+t]=cb}},
  fleMobilePrint:{addEventListener(t,cb){listeners['print-'+t]=cb}},
  fleInstall:{addEventListener(t,cb){listeners['install-'+t]=cb}},
  topPrint:{click(){clicks.print++}},
  search:{scrollIntoView(){},focus(){clicks.search++}},
  fleInstallDialog:{addEventListener(){},showModal(){clicks.install++},close(){}},
  fleInstallClose:{addEventListener(){}},
  fleInstallInstructions:{textContent:''}
 };
 const document={
  readyState:'complete',
  getElementById(id){return elements[id]},
  querySelector(){return null},
  querySelectorAll(){return []}
 };
 const window={matchMedia:()=>({matches:true}),addEventListener(){}};
 const ctx={document,window,navigator:{userAgent:'Mozilla/5.0'},location:{protocol:'http:'},
  requestAnimationFrame(f){f()}};
 runInNewContext(read('freshdesk-mobile.js'),ctx);
 listeners['search-click']();
 listeners['print-click']();
 assert.equal(clicks.search,1);
 assert.equal(clicks.print,1);
 listeners['install-click']();
 assert.equal(clicks.install,1);
});
