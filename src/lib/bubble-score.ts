import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { BubbleScoreBreakdown, DailyCheckin, JournalEntry } from '@/src/types/domain';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calculateBubbleScore = (
  checkins: DailyCheckin[],
  journalEntries: JournalEntry[],
): BubbleScoreBreakdown => {
  if (checkins.length === 0) {
    return {
      total: 0,
      mood: 0,
      stress: 0,
      sleep: 0,
      consistency: 0,
      reflection: 0,
      explanation: 'Your Bubble Score builds as you add check-ins and journal moments.',
    };
  }

  const recentCheckins = [...checkins]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 14);

  const weightedCheckins = recentCheckins.map((checkin, index) => ({
    ...checkin,
    weight: index < 7 ? 1.4 : 1,
  }));

  const totalWeight = weightedCheckins.reduce((sum, item) => sum + item.weight, 0);

  const averageMood =
    weightedCheckins.reduce((sum, item) => sum + item.mood * item.weight, 0) / totalWeight;
  const averageStress =
    weightedCheckins.reduce((sum, item) => sum + item.stress * item.weight, 0) / totalWeight;
  const averageSleep =
    weightedCheckins.reduce((sum, item) => sum + item.sleep * item.weight, 0) / totalWeight;

  const mood = Math.round(clamp((averageMood / 5) * 80, 0, 80));
  const stress = Math.round(clamp(((10 - averageStress) / 10) * 80, 0, 80));
  const sleep = Math.round(clamp((averageSleep / 8) * 60, 0, 60));

  const uniqueDays = new Set(recentCheckins.map((checkin) => checkin.createdAt.slice(0, 10)));
  const consistency = Math.round(clamp((uniqueDays.size / 14) * 40, 0, 40));
  const reflection = Math.round(clamp((journalEntries.slice(0, 14).length / 7) * 40, 0, 40));

  const total = clamp(mood + stress + sleep + consistency + reflection, 0, 300);

  return {
    total,
    mood,
    stress,
    sleep,
    consistency,
    reflection,
    explanation:
      'This score blends mood, stress, sleep, and how regularly you check in or journal. The most recent week counts a little more so progress feels current and honest.',
  };
};

export const calculateStreak = (checkins: DailyCheckin[]) => {
  const dates = [...new Set(checkins.map((item) => item.createdAt.slice(0, 10)))]
    .map((value) => parseISO(value))
    .sort((a, b) => (a > b ? -1 : 1));

  if (dates.length === 0) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const diff = differenceInCalendarDays(dates[index - 1], dates[index]);
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

