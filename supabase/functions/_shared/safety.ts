export type RiskLevel = 'green' | 'yellow' | 'red';

const redKeywords = ['kill myself', 'suicide plan', 'end my life', 'want to die', 'hurt myself tonight'];
const yellowKeywords = ['hopeless', 'self harm', 'not safe', 'dont want to be here', "don't want to be here"];

export const detectRiskLevel = (content: string): RiskLevel => {
  const normalized = content.toLowerCase();

  if (redKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'red';
  }

  if (yellowKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'yellow';
  }

  return 'green';
};

const buildGreenFallback = (content?: string) => {
  const normalized = content?.toLowerCase() ?? '';

  if (normalized.includes('sleep') || normalized.includes('night') || normalized.includes('bed')) {
    return 'That sounds tiring. Let’s keep tonight simple, have a sip of water, dim one thing around you, and pick one small bedtime step you can actually do.';
  }

  if (normalized.includes('stress') || normalized.includes('overwhelm') || normalized.includes('overwhelmed')) {
    return 'That sounds like a lot to carry. Let’s make it smaller, take one slow breath, put one task aside for later, and choose just one next step for the next ten minutes.';
  }

  if (normalized.includes('sad') || normalized.includes('low') || normalized.includes('mood')) {
    return 'I hear that this feels heavy right now. Let’s keep it gentle, unclench your shoulders, take a few slow breaths, and do one kind thing for your body in the next five minutes.';
  }

  return 'I’m here with you. Let’s keep it simple, take one slow breath, have one sip of water, and choose one tiny next step together.';
};

export const fallbackSafetyResponse = (risk: RiskLevel, content?: string) => {
  if (risk === 'red') {
    return 'I’m concerned about your immediate safety. Please contact emergency services, a crisis line, or a trusted person right now. Stay with another person if you can.';
  }

  if (risk === 'yellow') {
    return 'I’m really glad you said that. Are you safe right now? Please reach out to a trusted person, your clinician, or a crisis line today.';
  }

  return buildGreenFallback(content);
};
