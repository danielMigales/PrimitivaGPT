export function frequencies(draws, kind = 'numbers') {
  const result = new Map();
  for (const draw of draws) for (const n of (kind === 'refund' ? [draw.refund] : draw.numbers)) result.set(n, (result.get(n) || 0) + 1);
  return result;
}
export function repeated(draws, kind = 'numbers') {
  return [...frequencies(draws, kind)].filter(([, count]) => count > 1).sort((a,b) => a[0]-b[0]);
}
export function windowDraws(draws, end, size = 5) {
  return draws.filter(d => !end || d.date <= end).slice(0,size);
}
