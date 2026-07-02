"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkoutDraft } from "./useLocalDraft";

export interface WorkoutSession extends WorkoutDraft {
  id: string;
  userId: string;
  date: string;
  createdAt: string;
}

const STORAGE_KEY = "vitalis_workout_history";

export function useWorkouts() {
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["workouts"],
    queryFn: async () => {
      // Mock network latency
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    },
  });

  const addWorkoutMutation = useMutation({
    mutationFn: async (newWorkout: Omit<WorkoutSession, "id" | "userId" | "createdAt">) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const session: WorkoutSession = {
        ...newWorkout,
        id: `wkt_${Date.now()}`,
        userId: "usr_mock_123",
        createdAt: new Date().toISOString(),
      };

      const existing = [...workouts];
      existing.unshift(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const filtered = workouts.filter((w) => w.id !== workoutId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return workoutId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  return {
    workouts,
    isLoading,
    addWorkout: addWorkoutMutation.mutateAsync,
    isAdding: addWorkoutMutation.isPending,
    deleteWorkout: deleteWorkoutMutation.mutateAsync,
    isDeleting: deleteWorkoutMutation.isPending,
  };
}
