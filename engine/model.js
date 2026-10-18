// Aprendizaje secuencial: ninguna predicción recibe el resultado que evalúa.
export const MODEL_VERSION='1.1.0';
const EXPERTS=['Azar uniforme','Frecuencia acumulada','Frecuencia reciente','Recencia ponderada','Parejas y estructura'];
const range=n=>Array.from({length:n},(_,i)=>i);
const normalize=v=>{const total=v.reduce((a,b)=>a+b,0);return v.map(x=>x/total);};
const softmax=v=>{const max=Math.max(...v);return normalize(v.map(x=>Math.exp(x-max)));};
const round=v=>Math.round(v*10000)/10000;
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function ticket(p,random){const rest=p.slice(),out=[];for(let k=0;k<6;k++){let u=random()*rest.reduce((a,b)=>a+b,0),pick=rest.length-1;for(let i=0;i<rest.length;i++){u-=rest[i];if(u<=0){pick=i;break;}}out.push(pick+1);rest[pick]=0;}return out.sort((a,b)=>a-b);}
const best=p=>p.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,6).map(x=>x[1]+1).sort((a,b)=>a-b);
const digit=p=>p.indexOf(Math.max(...p));
const hits=(a,b)=>a.filter(x=>b.includes(x)).length;
export function patterns(draws){
 const frequency=Array(49).fill(0),refunds=Array(10).fill(0),parity=Array(7).fill(0),pairs=new Map(),gaps=Array(48).fill(0);let gapSum=0,gapCount=0,sum=0;
 for(const d of draws){const ns=d.numbers.slice().sort((a,b)=>a-b);refunds[d.refund]++;parity[ns.filter(x=>x%2===0).length]++;for(const n of ns){frequency[n-1]++;sum+=n;}for(let i=0;i<6;i++){for(let j=i+1;j<6;j++){const key=ns[i]+'-'+ns[j];pairs.set(key,(pairs.get(key)||0)+1);}if(i){const g=ns[i]-ns[i-1];gaps[g-1]++;gapSum+=g;gapCount++;}}}
 return {drawCount:draws.length,frequency:frequency.map((count,i)=>({number:i+1,count})),refunds:refunds.map((count,i)=>({number:i,count})),parity:parity.map((count,even)=>({even,odd:6-even,count})),pairs:[...pairs].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,12).map(([key,count])=>({numbers:key.split('-').map(Number),count})),gaps:gaps.map((count,i)=>({gap:i+1,count})),meanGap:round(gapCount?gapSum/gapCount:0),meanSum:round(draws.length?sum/draws.length:0)};
}
function distributions(history,window){
 const recent=history.slice(-window),nums=Array.from({length:5},()=>Array(49).fill(1)),refs=Array.from({length:5},()=>Array(10).fill(1));
 nums[0].fill(1);refs[0].fill(1);
 history.forEach((d,i)=>{for(const n of d.numbers){nums[1][n-1]++;nums[3][n-1]+=Math.pow(.5,(history.length-1-i)/12);}refs[1][d.refund]++;refs[3][d.refund]+=Math.pow(.5,(history.length-1-i)/12);});
 for(const d of recent){for(const n of d.numbers)nums[2][n-1]++;refs[2][d.refund]++;}
 const anchors=best(normalize(nums[2])).slice(0,3);
 for(const d of recent){for(const n of d.numbers)nums[4][n-1]+=1+d.numbers.filter(x=>x!==n&&anchors.includes(x)).length/3;refs[4][d.refund]++;}
 return {numbers:nums.map(normalize),refunds:refs.map(normalize),recent};
}
function structure(history){
 const parity=Array(7).fill(1),gap=Array(48).fill(1),pairs=new Map();
 for(const d of history){parity[d.numbers.filter(n=>n%2===0).length]++;const ns=d.numbers.slice().sort((a,b)=>a-b);for(let i=0;i<6;i++){if(i)gap[ns[i]-ns[i-1]-1]++;for(let j=i+1;j<6;j++){const key=ns[i]+'-'+ns[j];pairs.set(key,(pairs.get(key)||0)+1);}}}
 return {parity:normalize(parity),gap:normalize(gap),pairs,n:history.length};
}
function propose(p,shape,random,candidates=[]){
 let winner=best(p),score=-Infinity;
 for(const ns of [winner,...candidates,...range(24).map(()=>ticket(p,random))]){
  let value=ns.reduce((sum,n)=>sum+Math.log(p[n-1]),0);
  value+=.15*Math.log(shape.parity[ns.filter(n=>n%2===0).length]);
  for(let i=1;i<6;i++)value+=.06*Math.log(shape.gap[ns[i]-ns[i-1]-1]);
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)value+=.015*Math.log(1+(shape.pairs.get(ns[i]+'-'+ns[j])||0));
  if(value>score){score=value;winner=ns;}
 }
 return winner;
}
function predict(history,window,numberWeights,refundWeights,step){
 const data=distributions(history,window),random=rng(73471+step*101),shape=structure(data.recent);
 const experts=data.numbers.map((p,i)=>i===0?ticket(p,random):i===4?propose(p,shape,random):best(p));
 const expertRefunds=data.refunds.map((p,i)=>i===0?Math.floor(random()*10):digit(p));
 const mixed=range(49).map(i=>data.numbers.reduce((s,p,j)=>s+numberWeights[j]*p[i],0));
 const refs=range(10).map(i=>data.refunds.reduce((s,p,j)=>s+refundWeights[j]*p[i],0));
 return {numbers:propose(mixed,shape,random,experts),refund:digit(refs),experts,expertRefunds,numberScores:mixed.map((score,i)=>({number:i+1,score:round(score)})).sort((a,b)=>b.score-a.score),refundScores:refs.map((score,i)=>({number:i,score:round(score)}))};
}
function choose(n,k){if(k<0||k>n)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;}
export function randomBaseline(){return {expectedHits:36/49,refundProbability:.1,atLeastThreeProbability:[3,4,5,6].reduce((s,k)=>s+choose(6,k)*choose(43,6-k),0)/choose(49,6),threeAndRefundProbability:.1*[3,4,5,6].reduce((s,k)=>s+choose(6,k)*choose(43,6-k),0)/choose(49,6),atLeastFourProbability:[4,5,6].reduce((s,k)=>s+choose(6,k)*choose(43,6-k),0)/choose(49,6),hitProbabilities:range(7).map(k=>choose(6,k)*choose(43,6-k)/choose(49,6))};}
export function analyze(draws,{window=30}={}){
 if(![20,30,50].includes(window))throw Error('Ventana permitida: 20, 30 o 50');
 const ordered=draws.map(d=>({...d,numbers:d.numbers.slice().sort((a,b)=>a-b)})).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(ordered.map(d=>d.date)).size!==ordered.length)throw Error('Fechas duplicadas');
 for(const d of ordered)if(d.numbers.length!==6||new Set(d.numbers).size!==6||d.numbers.some(n=>!Number.isInteger(n)||n<1||n>49)||!Number.isInteger(d.refund)||d.refund<0||d.refund>9)throw Error('Sorteo inválido');
 if(ordered.length<=window)return {version:MODEL_VERSION,status:'insufficient',window,required:window+1,available:ordered.length};
 const numberLog=Array(5).fill(0),refundLog=Array(5).fill(0),rows=[],histogram=Array(7).fill(0),randomHistogram=Array(7).fill(0);let totalHits=0,totalRefunds=0,totalRandom=0,randomRefunds=0;
 for(let i=window;i<ordered.length;i++){
  const past=ordered.slice(0,i),nw=softmax(numberLog),rw=softmax(refundLog),prediction=predict(past,window,nw,rw,i),actual=ordered[i],count=hits(prediction.numbers,actual.numbers),refundHit=prediction.refund===actual.refund;
  const random=rng(92003+i*313),randomNumbers=ticket(Array(49).fill(1/49),random),randomRefund=Math.floor(random()*10),randomHits=hits(randomNumbers,actual.numbers);
  const expertHits=prediction.experts.map(p=>hits(p,actual.numbers));
  rows.push({date:actual.date,trainingCount:i,trainingStart:past[0].date,trainingEnd:past.at(-1).date,windowStart:past.slice(-window)[0].date,predicted:prediction.numbers,refund:prediction.refund,actual:actual.numbers,actualRefund:actual.refund,hits:count,refundHit,randomNumbers,randomRefund,randomHits,randomRefundHit:randomRefund===actual.refund,expertHits,weightsBefore:nw.map(round),refundWeightsBefore:rw.map(round)});
  histogram[count]++;totalHits+=count;totalRefunds+=Number(refundHit);totalRandom+=randomHits;randomHistogram[randomHits]++;randomRefunds+=Number(randomRefund===actual.refund);
  for(let j=0;j<5;j++){numberLog[j]=.99*numberLog[j]+.2*(expertHits[j]-36/49)+.1*Number(expertHits[j]>=3);refundLog[j]=.99*refundLog[j]+.3*(Number(prediction.expertRefunds[j]===actual.refund)-.1);}
 }
 const nw=softmax(numberLog),rw=softmax(refundLog),next=predict(ordered,window,nw,rw,ordered.length),n=rows.length,baseline=randomBaseline();
 return {version:MODEL_VERSION,status:'ready',window,sourceLastDate:ordered.at(-1).date,drawCount:ordered.length,objective:{primary:'refund',secondary:'atLeastThree',joint:'atLeastThreeAndRefund'},method:'Aprendizaje secuencial sin acceso al resultado futuro; una combinación y un reintegro por sorteo.',forecast:{afterDate:ordered.at(-1).date,numbers:next.numbers,refund:next.refund,numberScores:next.numberScores,refundScores:next.refundScores},metrics:{simulations:n,meanHits:round(totalHits/n),atLeastThree:histogram.slice(3).reduce((a,b)=>a+b,0),atLeastThreeAndRefund:rows.filter(r=>r.hits>=3&&r.refundHit).length,atLeastFour:histogram.slice(4).reduce((a,b)=>a+b,0),maxHits:Math.max(...rows.map(r=>r.hits)),refundHits:totalRefunds,refundRate:round(totalRefunds/n),histogram,randomMeanHits:round(totalRandom/n),randomAtLeastThree:randomHistogram.slice(3).reduce((a,b)=>a+b,0),randomAtLeastThreeAndRefund:rows.filter(r=>r.randomHits>=3&&r.randomRefundHit).length,randomAtLeastFour:randomHistogram.slice(4).reduce((a,b)=>a+b,0),randomRefundHits:randomRefunds,randomHistogram},baseline,experts:EXPERTS.map((name,i)=>({name,numberWeight:round(nw[i]),refundWeight:round(rw[i])})),patterns:patterns(ordered),rows,modelState:{version:MODEL_VERSION,window,trainedThrough:ordered.at(-1).date,numberLogWeights:numberLog,refundLogWeights:refundLog,numberWeights:nw,refundWeights:rw}};
}
