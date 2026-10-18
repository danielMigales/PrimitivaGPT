import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {analyze} from '../engine/model.js';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const engine=await readFile('engine/model.js','utf8');
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
const template=await readFile('worker/template.js','utf8');
await writeFile('worker/index.js',template.replace('/*SEED*/',()=>JSON.stringify(seed)).replace('/*HTML*/',()=>JSON.stringify(html)).replace('/*AI_ENGINE*/',()=>engine.replaceAll('export ','')));
await mkdir('public',{recursive:true});
// GitHub Pages usa el mismo diseño con el JSON versionado; no depende del servidor Sites.
const staticHtml=html.replaceAll("'/api/draws'","'./data/draws.json'").replace("'/api/ai?window='+window","'./data/ai-analysis-'+window+'.json'").replaceAll('/api/draws?download=1','./data/draws.json').replace('SELAE se consulta cada hora y los resultados se guardan en el servidor. Este listado se recarga al abrir la aplicación y mientras está abierta.','El archivo está versionado en GitHub. La tarea programada consulta SELAE cada hora.');
await writeFile('public/index.html',staticHtml);await mkdir('public/data',{recursive:true});await cp('data/draws.json','public/data/draws.json');
for(const window of [5,10,15]){const analysis=analyze(seed.draws,{window});await writeFile('public/data/ai-analysis-'+window+'.json',JSON.stringify(analysis));if(window===30){await writeFile('data/ai-analysis.json',JSON.stringify(analysis,null,2)+'\n');await writeFile('data/ai-model.json',JSON.stringify(analysis.modelState,null,2)+'\n');}}
console.log(`Generados Worker y página estática: ${seed.draws.length} sorteos`);
