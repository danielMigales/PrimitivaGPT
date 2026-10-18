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
 for(const match of html.matchAll(/id="([^"]+)"/g))document.getElementById(match[1]);
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
test('Consultar confirma el intervalo amplio de la captura y permite ver los antiguos',async()=>{
 const els=await renderData(seed);els.get('history').onclick();
 els.get('from').value='2026-08-17';els.get('until').value='2026-10-18';els.get('order').value='desc';
 const submit=()=>els.get('filters').onsubmit({preventDefault(){}});submit();
 const count=seed.draws.filter(d=>d.date>='2026-08-17'&&d.date<='2026-10-18').length;
 assert.match(els.get('query-summary').textContent,new RegExp('Consulta aplicada · '+count+' sorteos'));
 assert.match(els.get('query-summary').textContent,/17\/08\/2026.*18\/10\/2026/);
 assert.match(els.get('page-label').textContent,new RegExp('1–5 de '+count));
 assert.equal(els.get('pager').hidden,false);
 els.get('order').value='asc';submit();
 assert.match(els.get('draws').innerHTML,/17 de agosto de 2026/);
 assert.match(els.get('query-summary').textContent,/Más antiguos primero/);
});
test('El filtro incluye los extremos y muestra una consulta vacía sin resultados antiguos',async()=>{
 const els=await renderData(seed);els.get('history').onclick();
 els.get('from').value='2026-01-01';els.get('until').value='2026-01-03';els.get('filters').onsubmit({preventDefault(){}});
 assert.equal((els.get('draws').innerHTML.match(/<article /g)||[]).length,2);
 assert.match(els.get('query-summary').textContent,/2 sorteos encontrados/);
 els.get('from').value='2026-01-02';els.get('until').value='2026-01-02';els.get('filters').onsubmit({preventDefault(){}});
 assert.match(els.get('draws').innerHTML,/No hay sorteos/);assert.match(els.get('query-summary').textContent,/0 sorteos encontrados/);assert.equal(els.get('pager').hidden,true);
});
test('Paginar respeta la consulta aplicada hasta pulsar Consultar de nuevo',async()=>{
 const els=await renderData(seed);els.get('history').onclick();
 els.get('from').value='2026-01-01';els.get('until').value='2026-01-31';els.get('filters').onsubmit({preventDefault(){}});
 els.get('until').value='2026-10-18';els.get('next').onclick();
 assert.match(els.get('page-label').textContent,/6–10 de 14/);
 assert.match(els.get('query-summary').textContent,/31\/01\/2026/);
});
test('Corregir cualquiera de las fechas permite repetir la consulta',async()=>{
 const els=await renderData(seed);els.get('history').onclick();let validity='';els.get('until').setCustomValidity=v=>{validity=v;};
 els.get('from').value='2026-10-18';els.get('until').value='2026-01-01';els.get('filters').onsubmit({preventDefault(){}});assert.ok(validity);
 els.get('from').value='2026-01-01';els.get('from').oninput();assert.equal(validity,'');els.get('filters').onsubmit({preventDefault(){}});
 assert.match(els.get('query-summary').textContent,/1 sorteo encontrado/);
});
