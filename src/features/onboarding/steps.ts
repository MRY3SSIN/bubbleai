import { z } from 'zod';

export const onboardingSchema = z.object({
  fullName: z.string().min(2),
  displayName: z.string().min(2),
  pronouns: z.string().optional(),
  birthYear: z.number().min(new Date().getFullYear() - 100).max(new Date().getFullYear() - 13),
  genderIdentity: z.string().min(1),
  preferredVoice: z.enum(['feminine', 'masculine', 'neutral_calm']),
  medicationsEnabled: z.boolean(),
  medicationsText: z.string(),
  symptomsText: z.string(),
  smokingHabits: z.string().min(1),
  drinkingHabits: z.string().min(1),
  feelingToday: z.number().min(1).max(5),
  stressLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(12),
  notificationsEnabled: z.boolean(),
  menstrualSupportEnabled: z.boolean(),
  privacyAccepted: z.literal(true),
  aiDisclaimerAccepted: z.literal(true),
  crisisDisclaimerAccepted: z.literal(true),
});

export const onboardingDefaults = {
  fullName: '',
  displayName: '',
  pronouns: '',
  birthYear: new Date().getFullYear() - 22,
  genderIdentity: 'Female',
  preferredVoice: 'neutral_calm' as const,
  medicationsEnabled: false,
  medicationsText: '',
  symptomsText: '',
  smokingHabits: 'None',
  drinkingHabits: 'Rarely',
  feelingToday: 4 as const,
  stressLevel: 4,
  sleepHours: 7,
  notificationsEnabled: true,
  menstrualSupportEnabled: false,
  privacyAccepted: false,
  aiDisclaimerAccepted: false,
  crisisDisclaimerAccepted: false,
};

export const smokingHabitOptions = [
  { label: 'None', value: 'None' },
  { label: 'Occasionally', value: 'Occasionally' },
  { label: 'Most days', value: 'Most days' },
  { label: 'Daily', value: 'Daily' },
  { label: 'Trying to quit', value: 'Trying to quit' },
];

export const drinkingHabitOptions = [
  { label: 'Never', value: 'Never' },
  { label: 'Rarely', value: 'Rarely' },
  { label: 'Socially', value: 'Socially' },
  { label: 'Most weeks', value: 'Most weeks' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
];
