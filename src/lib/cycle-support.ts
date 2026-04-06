import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { CyclePhase, CycleProfile, Recommendation } from '@/src/types/domain';

const wrapCycleDay = (day: number, cycleLengthDays: number) => {
  const normalized = ((day % cycleLengthDays) + cycleLengthDays) % cycleLengthDays;
  return normalized === 0 ? cycleLengthDays : normalized;
};

export const getCycleInsight = (cycleProfile?: CycleProfile | null) => {
  if (!cycleProfile?.enabled || !cycleProfile.lastPeriodStart) {
    return null;
  }

  const cycleLengthDays = Math.max(cycleProfile.cycleLengthDays || 28, 21);
  const periodLengthDays = Math.max(cycleProfile.periodLengthDays || 5, 1);
  const daysSinceStart = differenceInCalendarDays(new Date(), parseISO(cycleProfile.lastPeriodStart));
  const cycleDay = wrapCycleDay(daysSinceStart + 1, cycleLengthDays);
  const ovulationStart = Math.max(Math.round(cycleLengthDays / 2) - 2, periodLengthDays + 1);
  const ovulationEnd = Math.min(ovulationStart + 3, cycleLengthDays);

  let phase: CyclePhase = 'follicular';
  if (cycleDay <= periodLengthDays) {
    phase = 'menstrual';
  } else if (cycleDay >= ovulationStart && cycleDay <= ovulationEnd) {
    phase = 'ovulation';
  } else if (cycleDay > ovulationEnd) {
    phase = 'luteal';
  }

  const nextPeriodInDays = cycleLengthDays - cycleDay;

  switch (phase) {
    case 'menstrual':
      return {
        ...cycleProfile,
        currentPhase: phase,
        cycleDay,
        nextPeriodInDays,
        title: 'Cycle support for lower-energy days',
        body: 'Your period may be active right now. A softer pace, warmth, hydration, and fewer decisions can help your nervous system settle.',
        recommendation: {
          id: 'cycle-menstrual-support',
          kind: 'sleep',
          title: 'Protect a gentler rhythm today',
          description: 'Try warmth, more water, and one low-pressure task while your body does heavier work.',
        } satisfies Recommendation,
      };
    case 'ovulation':
      return {
        ...cycleProfile,
        currentPhase: phase,
        cycleDay,
        nextPeriodInDays,
        title: 'Cycle support for busier energy',
        body: 'You may have a little more outward energy around ovulation. Keep food, water, and boundaries steady so it does not tip into overwhelm.',
        recommendation: {
          id: 'cycle-ovulation-support',
          kind: 'meal',
          title: 'Keep energy steady',
          description: 'Anchor today with a meal, hydration, and one clear boundary so extra energy still feels calm.',
        } satisfies Recommendation,
      };
    case 'luteal':
      return {
        ...cycleProfile,
        currentPhase: phase,
        cycleDay,
        nextPeriodInDays,
        title: 'Cycle support for a more sensitive week',
        body: 'The days before a period can make stress, mood shifts, and tenderness feel sharper. Smaller tasks and more recovery can help a lot.',
        recommendation: {
          id: 'cycle-luteal-support',
          kind: 'journal',
          title: 'Lower the pressure this week',
          description: 'Try a shorter to-do list, extra snacks and rest, and a one-line journal note when emotions feel louder.',
        } satisfies Recommendation,
      };
    default:
      return {
        ...cycleProfile,
        currentPhase: phase,
        cycleDay,
        nextPeriodInDays,
        title: 'Cycle support for a steadier stretch',
        body: 'This part of the cycle can feel a little clearer for planning and rebuilding rhythm. It can be a good time for light structure and movement.',
        recommendation: {
          id: 'cycle-follicular-support',
          kind: 'walk',
          title: 'Use the steadier window gently',
          description: 'A short walk, one focused task, and a simple routine can help build momentum without overloading you.',
        } satisfies Recommendation,
      };
  }
};
