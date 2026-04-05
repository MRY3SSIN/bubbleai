import type { TrendPoint } from '@/src/types/domain';

export const normalizeTrend = (points: TrendPoint[]) => {
  const max = Math.max(...points.map((point) => point.value), 1);

  return points.map((point) => ({
    ...point,
    ratio: point.value / max,
  }));
};

export const buildSparklinePath = (points: TrendPoint[], width = 260, height = 80) => {
  const normalized = normalizeTrend(points);

  return normalized
    .map((point, index) => {
      const x = (index / Math.max(normalized.length - 1, 1)) * width;
      const y = height - point.ratio * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

