import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
const template=await readFile('worker/template.js','utf8');
await writeFile('worker/index.js',template.replace('/*SEED*/',()=>JSON.stringify(seed)).replace('/*HTML*/',()=>JSON.stringify(html)));
await mkdir('public',{recursive:true});
// GitHub Pages usa el mismo diseño con el JSON versionado; no depende del servidor Sites.
const staticHtml=html.replaceAll("'/api/draws'","'./data/draws.json'").replaceAll('/api/draws?download=1','./data/draws.json').replace('SELAE se consulta cada hora y los resultados se guardan en el servidor. Este listado se recarga al abrir la aplicación y mientras está abierta.','El archivo está versionado en GitHub. La tarea programada consulta SELAE cada hora.');
await writeFile('public/index.html',staticHtml);await mkdir('public/data',{recursive:true});await cp('data/draws.json','public/data/draws.json');
console.log(`Generados Worker y página estática: ${seed.draws.length} sorteos`);
