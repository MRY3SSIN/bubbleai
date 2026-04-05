import { onboardingSchema } from '@/src/features/onboarding/steps';

describe('onboardingSchema', () => {
  it('blocks under 13 birth years', () => {
    const currentYear = new Date().getFullYear();

    const result = onboardingSchema.safeParse({
      fullName: 'Test User',
      displayName: 'Test',
      pronouns: '',
      birthYear: currentYear - 12,
      genderIdentity: 'Female',
      preferredVoice: 'neutral_calm',
      medicationsEnabled: false,
      medicationsText: '',
      symptomsText: '',
      smokingHabits: 'None',
      drinkingHabits: 'None',
      feelingToday: 4,
      stressLevel: 4,
      sleepHours: 7,
      notificationsEnabled: true,
      menstrualSupportEnabled: false,
      privacyAccepted: true,
      aiDisclaimerAccepted: true,
      crisisDisclaimerAccepted: true,
    });

    expect(result.success).toBe(false);
  });
});

