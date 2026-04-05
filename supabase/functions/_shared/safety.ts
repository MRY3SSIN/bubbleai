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

export const fallbackSafetyResponse = (risk: RiskLevel) => {
  if (risk === 'red') {
    return 'I’m concerned about your immediate safety. Please contact emergency services, a crisis line, or a trusted person right now. Stay with another person if you can.';
  }

  if (risk === 'yellow') {
    return 'I’m really glad you said that. Are you safe right now? Please reach out to a trusted person, your clinician, or a crisis line today.';
  }

  return 'That sounds heavy. Let’s keep it simple, try one slow breath, one sip of water, and one tiny next step.';
};

