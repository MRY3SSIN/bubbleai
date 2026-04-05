import { detectRiskLevel } from '@/src/lib/risk';

describe('detectRiskLevel', () => {
  it('flags imminent risk as red', () => {
    expect(detectRiskLevel('I want to die and I have a suicide plan')).toBe('red');
  });

  it('flags elevated distress as yellow', () => {
    expect(detectRiskLevel('I feel hopeless and I am not safe')).toBe('yellow');
  });

  it('defaults to green for standard wellness chat', () => {
    expect(detectRiskLevel('I feel overwhelmed after school')).toBe('green');
  });
});

