import { generateSessionTitle } from '@/src/lib/chat';

describe('generateSessionTitle', () => {
  it('falls back to a safe default', () => {
    expect(generateSessionTitle('')).toBe('New chat');
  });

  it('truncates long messages without cutting everything off', () => {
    expect(generateSessionTitle('This is a very long first message that should become a shorter title').endsWith('...')).toBe(true);
  });
});

