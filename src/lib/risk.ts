import type { CrisisResource, RiskLevel } from '@/src/types/domain';

import { crisisResources } from '@/src/lib/demo-data';

const redKeywords = [
  'kill myself',
  'suicide plan',
  'end my life',
  'want to die',
  'hurt myself tonight',
  'i have a plan',
];

const yellowKeywords = [
  'hopeless',
  'self harm',
  'don’t want to be here',
  'cant do this',
  'i am not safe',
  'numb',
];

export const detectRiskLevel = (text: string): RiskLevel => {
  const normalized = text.toLowerCase();

  if (redKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'red';
  }

  if (yellowKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'yellow';
  }

  return 'green';
};

export const getCrisisResource = (countryCode?: string): CrisisResource => {
  const match = crisisResources.find((resource) => resource.countryCode === countryCode?.toUpperCase());
  return match ?? crisisResources.find((resource) => resource.countryCode === 'DEFAULT')!;
};

export const riskCopy = {
  green: 'You are in a normal support flow.',
  yellow: 'BubbleAI is shifting into a more direct support mode and will encourage human support.',
  red: 'BubbleAI will pause normal coaching and show immediate human help options.',
};

