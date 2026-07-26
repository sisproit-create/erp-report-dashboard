export type Trend = { direction: 'up' | 'down' | 'flat'; percent: number; favorable: boolean };

export function calculateTrend(values: number[], positiveWhenHigher = true): Trend {
  const valid = values.filter(Number.isFinite);
  if (valid.length < 2) return { direction: 'flat', percent: 0, favorable: true };
  const current = valid[valid.length - 1];
  const previous = valid[valid.length - 2];
  if (previous === 0) return { direction: 'flat', percent: 0, favorable: true };
  const raw = ((current - previous) / Math.abs(previous)) * 100;
  return {
    direction: Math.abs(raw) < 0.05 ? 'flat' : raw > 0 ? 'up' : 'down',
    percent: Math.abs(raw),
    favorable: positiveWhenHigher ? raw >= 0 : raw <= 0,
  };
}
