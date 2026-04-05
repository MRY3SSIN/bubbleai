import { buildSparklinePath } from '@/src/lib/chart-data';

describe('buildSparklinePath', () => {
  it('builds an svg path for chart rendering', () => {
    const path = buildSparklinePath([
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
      { label: 'C', value: 3 },
    ]);

    expect(path.startsWith('M')).toBe(true);
    expect(path.includes('L')).toBe(true);
  });
});

