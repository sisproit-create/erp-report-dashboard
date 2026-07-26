export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendStatus = 'optimal' | 'attention' | 'critical' | 'neutral';

export type Comparison = {
  direction: TrendDirection;
  delta: number;
  percent: number;
  reference: number | null;
  favorable: boolean;
  status: TrendStatus;
  statusLabel: string;
};

function finite(values: number[]): number[] {
  return values.map(Number).filter(Number.isFinite);
}

/** Compare the last valid value with the immediately previous valid value. */
export function compareWithPrevious(values: number[], positiveWhenHigher = true): Comparison {
  const valid = finite(values);
  if (valid.length < 2) return neutralComparison();
  return buildComparison(valid[valid.length - 1], valid[valid.length - 2], positiveWhenHigher);
}

/** Compare the last valid value with the average of all prior valid values. */
export function compareWithPriorAverage(values: number[], positiveWhenHigher = true): Comparison {
  const valid = finite(values);
  if (valid.length < 2) return neutralComparison();
  const current = valid[valid.length - 1];
  const previousValues = valid.slice(0, -1);
  const reference = previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length;
  return buildComparison(current, reference, positiveWhenHigher);
}

function buildComparison(current: number, reference: number, positiveWhenHigher: boolean): Comparison {
  const delta = current - reference;
  const percent = reference === 0 ? 0 : (delta / Math.abs(reference)) * 100;
  const tolerance = Math.max(Math.abs(reference) * 0.005, 0.0001);
  const direction: TrendDirection = Math.abs(delta) <= tolerance ? 'flat' : delta > 0 ? 'up' : 'down';
  const favorable = direction === 'flat' || (positiveWhenHigher ? delta > 0 : delta < 0);
  const absolutePercent = Math.abs(percent);

  let status: TrendStatus = 'neutral';
  let statusLabel = 'Estable';
  if (direction !== 'flat') {
    if (favorable) {
      status = 'optimal';
      statusLabel = 'Óptimo';
    } else if (absolutePercent >= 10) {
      status = 'critical';
      statusLabel = 'Revisar';
    } else {
      status = 'attention';
      statusLabel = 'Atención';
    }
  }

  return { direction, delta, percent: absolutePercent, reference, favorable, status, statusLabel };
}

function neutralComparison(): Comparison {
  return {
    direction: 'flat',
    delta: 0,
    percent: 0,
    reference: null,
    favorable: true,
    status: 'neutral',
    statusLabel: 'Sin referencia',
  };
}
