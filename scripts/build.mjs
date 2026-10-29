import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {analyze} from '../engine/model.js';
import {reconcileProspectiveAudit} from './prospective-audit.mjs';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const engine=await readFile('engine/model.js','utf8');
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
const template=await readFile('worker/template.js','utf8');
const icon=await readFile('web/icon.svg','utf8');
await writeFile('worker/index.js',template.replace('/*SEED*/',()=>JSON.stringify(seed)).replace('/*HTML*/',()=>JSON.stringify(html)).replace('/*ICON*/',()=>JSON.stringify(icon)).replace('/*AI_ENGINE*/',()=>engine.replaceAll('export ','')));
await mkdir('public',{recursive:true});
// GitHub Pages usa el mismo diseño con el JSON versionado; no depende del servidor Sites.
const staticHtml=html.replaceAll("'/api/draws'","'./data/draws.json'").replaceAll('/api/draws?download=1','./data/draws.json').replace(
 "async function loadAi(){ $('ai-state').textContent='Analizando los sorteos seleccionados…';$('ai-error').hidden=true;try{const window=7;const res=await fetch('/api/ai?window='+window,{cache:'no-store'});if(!res.ok)throw Error('No se pudo calcular el análisis. Puedes reintentarlo.');const report=await res.json();if(report.status!=='ready')throw Error(`Se necesitan al menos ${report.required||8} sorteos para esta ventana.`);renderAi(report);$('ai-state').textContent=`Análisis completado · ${report.metrics.simulations} predicciones evaluadas · Modelo ${report.version}`;if(report.warning){$('ai-error').hidden=false;$('ai-error').textContent=report.warning;}}catch(error){$('ai-error').hidden=false;$('ai-error').textContent=error.message;$('ai-state').textContent='El histórico de resultados sigue disponible.';}}",
 "async function loadAi(){$('ai-state').textContent='Calculando el análisis con el histórico publicado…';$('ai-error').hidden=true;try{const [engine,archiveResponse]=await Promise.all([import('./engine/model.js'),fetch('./data/draws.json',{cache:'no-store'})]);if(!archiveResponse.ok)throw Error('No se pudo cargar el histórico actualizado.');const archive=await archiveResponse.json();doc=archive;const report=engine.analyze(archive.draws,{window:7});if(report.status!=='ready')throw Error(`Se necesitan al menos ${report.required||8} sorteos para esta ventana.`);renderAi(report);$('ai-state').textContent=`Análisis completado · ${report.metrics.simulations} predicciones evaluadas · Histórico hasta ${report.sourceLastDate} · Modelo ${report.version}`;if(report.warning){$('ai-error').hidden=false;$('ai-error').textContent=report.warning;}}catch(error){$('ai-error').hidden=false;$('ai-error').textContent=error.message;$('ai-state').textContent='No se pudo cargar el análisis; los resultados siguen disponibles.';}}"
await writeFile('public/index.html',staticHtml);
await cp('web/icon.svg','public/icon.svg');
await mkdir('public/engine',{recursive:true});
await cp('engine/model.js','public/engine/model.js');
await mkdir('public/data',{recursive:true});
await cp('data/draws.json','public/data/draws.json');
// La interfaz usa una única ventana fija: 7 sorteos.
for(const obsoleteWindow of [5,10,15,20,30,50]){
 await rm(`public/data/ai-analysis-${obsoleteWindow}.json`,{force:true});
}
const fixedWindow=7;
const defaultAnalysis=analyze(seed.draws,{window:fixedWindow});
if(defaultAnalysis.status!=='ready')throw new Error('No se pudo generar el análisis de 7 sorteos');
await writeFile(`public/data/ai-analysis-${fixedWindow}.json`,JSON.stringify(defaultAnalysis));
// El registro prospectivo solo se inicia desde esta versión; nunca se rellenan sorteos pasados.
const existingAudit=JSON.parse(await readFile('data/prospective-audit.json','utf8'));
const prospectiveAudit=reconcileProspectiveAudit(existingAudit.records,defaultAnalysis,seed.draws);
await writeFile('data/prospective-audit.json',JSON.stringify(prospectiveAudit,null,2)+'\n');
await writeFile('public/data/prospective-audit.json',JSON.stringify(prospectiveAudit));
const pct=value=>value===null?'—':(value*100).toFixed(2).replace('.',',')+'%';
const s=prospectiveAudit.summary;
const auditPanel=`<article class="ai-card prospective-audit-card"><h3>Evaluación prospectiva real</h3><p>Solo se incluyen combinaciones guardadas antes de su sorteo. Las predicciones y el control aleatorio se conservan; los aciertos se calculan al llegar el resultado oficial.</p><p><b>Sorteos evaluados:</b> ${s.settled} · <b>Pendientes:</b> ${s.pending}</p><p><b>4+ aciertos:</b> motor ${s.modelAtLeastFour} (${pct(s.modelAtLeastFourRate)}) · azar ${s.randomAtLeastFour} (${pct(s.randomAtLeastFourRate)}).</p><p><b>4+ esperados por azar:</b> ${s.expectedRandomAtLeastFour} en ${s.comparable} comparaciones.</p><p><b>Último resultado evaluado:</b> ${s.lastSettledDate||'—'}</p><a href="./data/prospective-audit.json" download="primitiva-auditoria-prospectiva.json">Descargar registro completo</a></article>`;
await writeFile('public/index.html',staticHtml.replace('<!--PROSPECTIVE_AUDIT_PANEL-->',auditPanel));
// El informe principal y el estado guardado del modelo quedan alineados a la ventana fija de 7 sorteos.
await writeFile('data/ai-analysis.json',JSON.stringify(defaultAnalysis,null,2)+'\n');
await writeFile('data/ai-model.json',JSON.stringify(defaultAnalysis.modelState,null,2)+'\n');
console.log(`Generados Worker y página estática: ${seed.draws.length} sorteos`);
