import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('the static shop portal links to FreshDesk and a private draft editor',()=>{
 const html=read('hub/index.html');
 assert.match(html,/<img src="\.\/logo-city\.svg"/);
 assert.match(html,/href="\.\.\/"/);
 assert.match(html,/href="\.\/preparation\.html"/);
 assert.match(html,/city-ornano\.fr/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|supabase\.createClient|\/api\//);
});
test('the weekly editor is deliberately a draft, not a live planning client',()=>{
 const html=read('hub/preparation.html');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new Script(scripts[0][1]));
 assert.match(html,/city-equipe-draft\/v1/);
 assert.match(html,/id="exportDraft"/);
 assert.match(html,/id="draftInput"/);
 assert.match(html,/Les cases « — » ne seront pas modifiées/);
 assert.match(html,/Aucun horaire n'est publié/);
 assert.doesNotMatch(scripts[0][1],/localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket/);
});
test('FreshDesk keeps its main catalogue while linking to its own portal',()=>{
 const html=read('index.html');
 assert.ok(html.includes('id="productRows"'));
 assert.ok(html.includes('id="printSheet"'));
 assert.equal((html.match(/href="\/hub\/"/g)||[]).length,2);
 const sw=read('freshdesk-sw.js');
 assert.match(sw,/\.\/hub\/index\.html/);
 assert.match(sw,/\.\/hub\/preparation\.html/);
 assert.match(sw,/\.\/hub\/logo-city\.svg/);
 assert.match(sw,/isPortal/);
});
