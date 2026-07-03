"use client";

import { useState, useEffect } from "react";

export interface SetDraft {
  reps: number;
  weightKg: number;
}

export interface ExerciseEntryDraft {
  id: string;
  name: string;
  category: "strength" | "cardio" | "custom";
  sets?: SetDraft[];
  durationSec?: number;
  distanceKm?: number;
}

export interface WorkoutDraft {
  type: "strength" | "cardio" | "custom";
  notes: string;
  exercises: ExerciseEntryDraft[];
}

const DRAFT_KEY = "vitalis_workout_draft";

export function useLocalDraft() {
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setDraft(JSON.parse(saved));
      }
    }
  }, []);

  const saveDraft = (newDraft: WorkoutDraft | null) => {
    setDraft(newDraft);
    if (newDraft) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(newDraft));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  };

  const clearDraft = () => {
    saveDraft(null);
  };

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft: !!draft,
  };
}
