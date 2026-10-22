import {reconcileForecasts, randomBaseline} from '../engine/model.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randomTicket(targetDate) {
  const seed = Number(targetDate.replaceAll('-', '')) >>> 0;
  const random = seededRandom(seed);
  const pool = Array.from({length: 49}, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

const round = value => Math.round(value * 10000) / 10000;

/**
 * Reconciles only previously saved forecasts with official draws and adds at
 * most the next eligible forecast. Existing forecast numbers are never replaced.
 * The random comparator is generated and frozen at the same time as a new ticket.
 */
export function reconcileProspectiveAudit(existingRecords, report, draws, now = new Date()) {
  if (!Array.isArray(existingRecords)) throw new Error('El registro prospectivo debe ser una lista');
  const seen = new Set();
  for (const record of existingRecords) {
    if (!record || !/^\d{4}-\d{2}-\d{2}$/.test(record.targetDate) || seen.has(record.targetDate)) {
      throw new Error('Fecha objetivo inválida o duplicada en el registro prospectivo');
    }
    if (!Array.isArray(record.numbers) || record.numbers.length !== 6 ||
        new Set(record.numbers).size !== 6 ||
        record.numbers.some(n => !Number.isInteger(n) || n < 1 || n > 49) ||
        !Number.isInteger(record.refund) || record.refund < 0 || record.refund > 9) {
      throw new Error('Combinación guardada inválida en el registro prospectivo');
    }
    seen.add(record.targetDate);
  }

  const before = new Set(existingRecords.map(record => record.targetDate));
  const reconciled = reconcileForecasts(existingRecords, report, draws, now);
  const records = reconciled.records.map(record => {
    // No se fabrica un control aleatorio para propuestas históricas sin registro.
    const withControl = !before.has(record.targetDate) && !record.randomNumbers
      ? {...record, randomNumbers: randomTicket(record.targetDate)}
      : {...record};
    const actual = withControl.actual;
    const randomHits = actual && withControl.randomNumbers
      ? withControl.randomNumbers.filter(n => actual.numbers.includes(n)).length
      : null;
    return {...withControl, randomHits, randomAtLeastFour: randomHits === null ? null : randomHits >= 4};
  });

  const settled = records.filter(record => record.status === 'published' && Array.isArray(record.actual));
  const modelAtLeastFour = settled.filter(record => record.hits >= 4).length;
  const randomAtLeastFour = settled.filter(record => record.randomHits !== null && record.randomHits >= 4).length;
  const comparable = settled.filter(record => Array.isArray(record.randomNumbers));
  const baseline = randomBaseline();
  const count = settled.length;
  const summary = {
    protocol: 'prospective-v1',
    window: 7,
    settled: count,
    pending: records.filter(record => record.status === 'pending').length,
    comparable: comparable.length,
    modelAtLeastFour,
    modelAtLeastFourRate: count ? round(modelAtLeastFour / count) : null,
    randomAtLeastFour,
    randomAtLeastFourRate: comparable.length ? round(randomAtLeastFour / comparable.length) : null,
    expectedRandomAtLeastFour: round(comparable.length * baseline.atLeastFourProbability),
    meanHits: count ? round(settled.reduce((sum, record) => sum + record.hits, 0) / count) : null,
    randomMeanHits: comparable.length ? round(comparable.reduce((sum, record) => sum + record.randomHits, 0) / comparable.length) : null,
    lastSettledDate: settled.length ? settled.map(record => record.targetDate).sort().at(-1) : null,
  };
  return {schemaVersion: 1, summary, records};
}
