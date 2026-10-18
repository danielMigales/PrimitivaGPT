import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
const logic=await readFile(new URL('../web/logic.js',import.meta.url),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace('/*LOGIC*/',logic.replaceAll('export ',''));
const seed=JSON.parse(await readFile(new URL('../data/draws.json',import.meta.url),'utf8'));
async function renderData(data){
 const elements=new Map();
 const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,{value:id==='from'?'2026-01-01':'',innerHTML:'',textContent:'',hidden:true,setAttribute(){},setCustomValidity(){},reportValidity(){}});return elements.get(id);}};
 vm.runInNewContext(script,{document,fetch:async()=>({ok:true,json:async()=>data}),setInterval(){},Date,Map,Error,console});
 await new Promise(resolve=>setImmediate(resolve));
 return elements;
}
for(const [name,refunds] of [['únicos',[0,1,2,3,4]],['mixtos',[0,0,2,3,4]],['iguales',[0,0,0,0,0]]]){
 test('Muestra cinco sorteos con reintegros '+name,async()=>{
  const data={...seed,draws:seed.draws.slice(0,5).map((d,i)=>({...d,refund:refunds[i]}))};
  const els=await renderData(data);
  assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
  assert.equal(els.get('notice').hidden,true);
  assert.doesNotMatch(els.get('draws').innerHTML,/undefined|Cargando/);
  els.get('history').onclick();
  assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
 });
}
test('Muestra datos reales y permite paginar el histórico',async()=>{
 const els=await renderData(seed);
 assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
 assert.equal(els.get('notice').hidden,true);
 els.get('history').onclick();const first=els.get('draws').innerHTML;
 els.get('next').onclick();assert.notEqual(els.get('draws').innerHTML,first);
 assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,5);
});
