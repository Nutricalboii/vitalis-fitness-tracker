"use client";

import { useState, useEffect } from "react";

export interface ExercisePreset {
  id: string;
  name: string;
  category: "strength" | "cardio" | "custom";
  defaultUnit?: string;
}

const DEFAULT_EXERCISES: ExercisePreset[] = [
  { id: "1", name: "Bench Press", category: "strength" },
  { id: "2", name: "Barbell Squat", category: "strength" },
  { id: "3", name: "Deadlift", category: "strength" },
  { id: "4", name: "Overhead Press", category: "strength" },
  { id: "5", name: "Pull-ups", category: "strength" },
  { id: "6", name: "Bicep Curl", category: "strength" },
  { id: "7", name: "Running", category: "cardio" },
  { id: "8", name: "Cycling", category: "cardio" },
  { id: "9", name: "Swimming", category: "cardio" },
  { id: "10", name: "Elliptical", category: "cardio" },
];

export function useExerciseLibrary() {
  const [exercises, setExercises] = useState<ExercisePreset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const custom = localStorage.getItem("vitalis_custom_exercises");
      const customParsed: ExercisePreset[] = custom ? JSON.parse(custom) : [];
      setExercises([...DEFAULT_EXERCISES, ...customParsed]);
    }
  }, []);

  const addCustomExercise = (name: string, category: "strength" | "cardio") => {
    const newExercise: ExercisePreset = {
      id: `custom_${Date.now()}`,
      name,
      category,
    };
    const updated = [...exercises, newExercise];
    setExercises(updated);

    const customOnly = updated.filter((e) => e.id.startsWith("custom_"));
    localStorage.setItem("vitalis_custom_exercises", JSON.stringify(customOnly));
    return newExercise;
  };

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    exercises: filteredExercises,
    searchQuery,
    setSearchQuery,
    addCustomExercise,
  };
}
