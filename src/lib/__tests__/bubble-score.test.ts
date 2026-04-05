import { calculateBubbleScore } from '@/src/lib/bubble-score';
import { demoCheckins, demoJournalEntries } from '@/src/lib/demo-data';

describe('calculateBubbleScore', () => {
  it('returns a bounded transparent score breakdown', () => {
    const result = calculateBubbleScore(demoCheckins, [...demoJournalEntries]);

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(300);
    expect(result.mood + result.stress + result.sleep + result.consistency + result.reflection).toBe(result.total);
  });
});

