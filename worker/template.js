const SEED = /*SEED*/;
const HTML = /*HTML*/;
const TTL=15*60*1000;
const KEY='history/draws.json';
let pending;
export function parseDraw(row){
 const m=/^\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s+C\((\d+)\)\s+R\((\d+)\)\s*$/.exec(row.combinacion||'');
 if(!m||row.game_id!=='LAPR')throw Error('Formato SELAE inesperado');
 const v=m.slice(1).map(Number),numbers=v.slice(0,6).sort((a,b)=>a-b),date=row.fecha_sorteo.slice(0,10);
 if(new Set(numbers).size!==6||numbers.some(n=>n<1||n>49)||v[6]<1||v[6]>49||numbers.includes(v[6])||v[7]<0||v[7]>9||date<'2026-01-01'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('Resultado inválido');
 return {id:String(row.id_sorteo),date,numbers,complementary:v[6],refund:v[7],source:'https://www.loteriasyapuestas.es/f/loterias/resultados/primitiva.html?game_id=LAPR&fecha_sorteo='+date.replaceAll('-','')};
}
export function validateHistory(draws){
 if(!draws.length)throw Error('Histórico vacío');
 if(new Set(draws.map(d=>d.date)).size!==draws.length||new Set(draws.map(d=>d.id)).size!==draws.length)throw Error('Duplicados');
 const dates=new Set(draws.map(d=>d.date)),end=draws[0].date;
 for(let d=new Date('2026-01-01T12:00:00Z');d.toISOString().slice(0,10)<=end;d.setUTCDate(d.getUTCDate()+1))if([1,4,6].includes(d.getUTCDay())&&!dates.has(d.toISOString().slice(0,10)))throw Error('Cobertura incompleta');
}
async function refresh(env,current){
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
 const merged=new Map(current.draws.map(d=>[d.date,d]));
 // Reconsultar el mes del último sorteo y los posteriores para incorporar correcciones y novedades.
 const start=current.latestDate.slice(0,7)+'-01',cursor=new Date(start+'T12:00:00Z'),raw=[];
 while(cursor.toISOString().slice(0,10)<=today){
  const begin=cursor.toISOString().slice(0,10),last=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0,12)).toISOString().slice(0,10),end=last<today?last:today;
  const url='https://www.loteriasyapuestas.es/servicios/buscadorSorteos?game_id=LAPR&celebrados=true&fechaInicioInclusiva='+begin.replaceAll('-','')+'&fechaFinInclusiva='+end.replaceAll('-','');
  const res=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw Error('SELAE HTTP '+res.status);
  const rows=await res.json();if(!Array.isArray(rows)||rows.length===0)throw Error('Respuesta SELAE vacía o inesperada');
  for(const row of rows){const d=parseDraw(row);if(d.date<begin||d.date>end)throw Error('Fecha fuera del intervalo');merged.set(d.date,d);}
  raw.push([begin.slice(0,7),rows]);cursor.setUTCMonth(cursor.getUTCMonth()+1);
 }
 const draws=[...merged.values()].sort((a,b)=>b.date.localeCompare(a.date));validateHistory(draws);
 const next={schemaVersion:1,startDate:'2026-01-01',source:'SELAE',checkedAt:new Date().toISOString(),latestDate:draws[0].date,draws};
 for(const [month,rows]of raw)await env.BUCKET.put('raw/'+month+'.json',JSON.stringify(rows),{httpMetadata:{contentType:'application/json'}});
 // Guardar un registro por sorteo evita perder la consulta histórica.
 for(const d of draws.filter(d=>d.date>=start))await env.BUCKET.put('draws/'+d.date+'.json',JSON.stringify(d),{httpMetadata:{contentType:'application/json'}});
 await env.BUCKET.put(KEY,JSON.stringify(next),{httpMetadata:{contentType:'application/json'}});
 return next;
}
export async function getData(env){
 let current=SEED;
 if(!env.BUCKET)return {...SEED,warning:'Almacenamiento no disponible. Se muestra la copia incluida en el proyecto.'};
 try{const obj=await env.BUCKET.get(KEY);if(obj)current=await obj.json();else await env.BUCKET.put(KEY,JSON.stringify(SEED));}
 catch{return {...SEED,warning:'No se pudo leer el archivo del servidor. Se muestra la última copia incluida en el proyecto.'};}
 if(Date.now()-Date.parse(current.checkedAt)<TTL)return current;
 try{if(!pending)pending=refresh(env,current).finally(()=>{pending=undefined;});return await pending;}
 catch{return {...current,warning:'SELAE no ha podido actualizarse ahora. Se conservan los resultados guardados; la fecha de última consulta indica su antigüedad.'};}
}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method!=='GET')return new Response('Método no permitido',{status:405,headers:{Allow:'GET'}});
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
 if(url.pathname==='/api/draws'){const data=await getData(env);return Response.json(data,{headers:{...headers,'Cache-Control':'no-store',...(url.searchParams.has('download')?{'Content-Disposition':'attachment; filename="primitiva-historico.json"'}:{})}});}
 if(url.pathname==='/')return new Response(HTML,{headers:{...headers,'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"}});
 return new Response('No encontrado',{status:404,headers});
}};
