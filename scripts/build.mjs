import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {analyze} from '../engine/model.js';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const engine=await readFile('engine/model.js','utf8');
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
const template=await readFile('worker/template.js','utf8');
const icon=await readFile('web/icon.svg','utf8');
await writeFile('worker/index.js',template.replace('/*SEED*/',()=>JSON.stringify(seed)).replace('/*HTML*/',()=>JSON.stringify(html)).replace('/*ICON*/',()=>JSON.stringify(icon)).replace('/*AI_ENGINE*/',()=>engine.replaceAll('export ','')));
await mkdir('public',{recursive:true});
// GitHub Pages usa el mismo diseño con el JSON versionado; no depende del servidor Sites.
const staticHtml=html.replaceAll("'/api/draws'","'./data/draws.json'").replace("'/api/ai?window='+window","'./data/ai-analysis-'+window+'.json'").replaceAll('/api/draws?download=1','./data/draws.json').replace('SELAE se consulta cada hora y los resultados se guardan en el servidor. Este listado se recarga al abrir la aplicación y mientras está abierta.','El archivo está versionado en GitHub. La tarea programada consulta SELAE cada hora.');
await writeFile('public/index.html',staticHtml);
await cp('web/icon.svg','public/icon.svg');
await mkdir('public/data',{recursive:true});
await cp('data/draws.json','public/data/draws.json');
// Los informes estáticos deben coincidir con las tres opciones del selector HTML.
for(const window of [5,10,15]){
 const analysis=analyze(seed.draws,{window});
 if(analysis.status!=='ready')throw new Error(`No se pudo generar el análisis estático para la ventana ${window}`);
 await writeFile(`public/data/ai-analysis-${window}.json`,JSON.stringify(analysis));
}
// El modelo versionado por defecto y usado por la sincronización conserva su ventana 30.
const defaultAnalysis=analyze(seed.draws,{window:30});
if(defaultAnalysis.status!=='ready')throw new Error('No se pudo generar el análisis predeterminado de 30 sorteos');
await writeFile('data/ai-analysis.json',JSON.stringify(defaultAnalysis,null,2)+'\n');
await writeFile('data/ai-model.json',JSON.stringify(defaultAnalysis.modelState,null,2)+'\n');
console.log(`Generados Worker y página estática: ${seed.draws.length} sorteos`);
