"use client";

import { useMemo } from "react";
import { useWorkouts } from "./useWorkouts";
import { useVitals } from "./useVitals";

export function useStreak() {
  const { workouts } = useWorkouts();
  const { vitals } = useVitals();

  const streak = useMemo(() => {
    // Collect all dates when the user performed an activity or logged vitals
    const loggedDates = new Set<string>();

    workouts.forEach((w) => {
      const d = new Date(w.date || w.createdAt);
      loggedDates.add(d.toDateString());
    });

    vitals.forEach((v) => {
      const d = new Date(v.recordedAt);
      loggedDates.add(d.toDateString());
    });

    if (loggedDates.size === 0) return 0;

    let currentStreak = 0;
    const checkDate = new Date(); // Start checking from today

    // If they haven't logged today, check if they logged yesterday to keep streak active
    if (!loggedDates.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Trace backwards day by day to count consecutive logs
    while (loggedDates.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return currentStreak;
  }, [workouts, vitals]);

  return {
    streak,
    hasActiveStreak: streak > 0,
  };
}
