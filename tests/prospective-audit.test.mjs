import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {analyze} from '../engine/model.js';
import {reconcileProspectiveAudit} from '../scripts/prospective-audit.mjs';

const archive=JSON.parse(await readFile(new URL('../data/draws.json',import.meta.url),'utf8'));

test('La auditoría prospectiva guarda una predicción y un control aleatorio antes del sorteo',()=>{
  const report=analyze(archive.draws,{window:7});
  const audit=reconcileProspectiveAudit([],report,archive.draws,new Date('2026-10-22T10:00:00.000Z'));
  assert.equal(audit.summary.protocol,'prospective-v1');
  assert.equal(audit.summary.window,7);
  assert.equal(audit.records.length,1);
  const record=audit.records[0];
  assert.equal(record.targetDate,'2026-10-24');
  assert.equal(record.status,'pending');
  assert.equal(record.trainedThrough,'2026-10-22');
  assert.equal(record.numbers.length,6);
  assert.equal(new Set(record.numbers).size,6);
  assert.equal(record.randomNumbers.length,6);
  assert.equal(new Set(record.randomNumbers).size,6);
  assert.equal(audit.summary.settled,0);
  assert.equal(audit.summary.modelAtLeastFourRate,null);
});

test('La predicción guardada no cambia al publicarse el resultado y se evalúa frente al control',()=>{
  const firstReport=analyze(archive.draws,{window:7});
  const first=reconcileProspectiveAudit([],firstReport,archive.draws,new Date('2026-10-20T10:00:00.000Z'));
  const saved=first.records.find(r=>r.targetDate==='2026-10-24');
  const actual={...archive.draws[0],id:'test-20261022',date:'2026-10-24',numbers:[1,2,3,4,5,6],refund:8,complementary:7};
  const updatedDraws=[actual,...archive.draws];
  const nextReport=analyze(updatedDraws,{window:7});
  const next=reconcileProspectiveAudit(first.records,nextReport,updatedDraws,new Date('2026-10-25T10:00:00.000Z'));
  const evaluated=next.records.find(r=>r.targetDate==='2026-10-24');
  assert.deepEqual(evaluated.numbers,saved.numbers);
  assert.deepEqual(evaluated.randomNumbers,saved.randomNumbers);
  assert.equal(evaluated.status,'published');
  assert.equal(evaluated.hits,saved.numbers.filter(n=>actual.numbers.includes(n)).length);
  assert.equal(evaluated.randomHits,saved.randomNumbers.filter(n=>actual.numbers.includes(n)).length);
  assert.equal(next.summary.settled,1);
  assert.equal(next.summary.comparable,1);
  assert.equal(next.summary.modelAtLeastFour,Number(evaluated.hits>=4));
  assert.equal(next.summary.randomAtLeastFour,Number(evaluated.randomHits>=4));
  assert.equal(next.records.filter(r=>r.targetDate==='2026-10-26').length,1);
});

test('No crea predicciones retroactivas después de la hora de corte',()=>{
  const draws=archive.draws.filter(draw=>draw.date<='2026-10-19');
  const report=analyze(draws,{window:7});
  const audit=reconcileProspectiveAudit([],report,draws,new Date('2026-10-22T19:00:00.000Z'));
  assert.equal(audit.records.length,0);
});

test('Rechaza fechas duplicadas o combinaciones guardadas inválidas',()=>{
  const report=analyze(archive.draws,{window:7});
  const record=reconcileProspectiveAudit([],report,archive.draws,new Date('2026-10-20T10:00:00.000Z')).records[0];
  assert.throws(()=>reconcileProspectiveAudit([record,record],report,archive.draws,new Date('2026-10-20T10:00:00.000Z')),/duplicada/);
  assert.throws(()=>reconcileProspectiveAudit([{...record,numbers:[1,1,2,3,4,5]}],report,archive.draws,new Date('2026-10-20T10:00:00.000Z')),/inválida/);
});
