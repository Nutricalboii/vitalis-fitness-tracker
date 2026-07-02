"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type VitalType = "weight" | "bp" | "hr" | "sleep" | "spo2";

export interface VitalEntry {
  id: string;
  userId: string;
  type: VitalType;
  value: number; // primary value (weight Kg, systolic BP, HR bpm, sleep hours, SpO2 %)
  secondaryValue?: number; // secondary value (e.g., diastolic for BP)
  source: "manual" | "google_fit" | "fitbit";
  recordedAt: string;
}

const STORAGE_KEY = "vitalis_vitals_history";

// Prepopulate 14 days of realistic mock health records
const generateMockVitals = (): VitalEntry[] => {
  const list: VitalEntry[] = [];
  const now = new Date();
  const userId = "usr_mock_123";

  for (let i = 14; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayString = d.toISOString();

    // Weight: around 80kg down to 78.5kg
    list.push({
      id: `vit_wt_${i}`,
      userId,
      type: "weight",
      value: 80 - (14 - i) * 0.11 + Math.sin(i) * 0.25,
      source: i % 3 === 0 ? "manual" : "google_fit",
      recordedAt: dayString,
    });

    // BP: around 120/80
    list.push({
      id: `vit_bp_${i}`,
      userId,
      type: "bp",
      value: Math.round(118 + Math.cos(i) * 6),
      secondaryValue: Math.round(78 + Math.sin(i) * 4),
      source: "manual",
      recordedAt: dayString,
    });

    // Heart Rate: around 65-75 bpm
    list.push({
      id: `vit_hr_${i}`,
      userId,
      type: "hr",
      value: Math.round(68 + Math.sin(i) * 5),
      source: "fitbit",
      recordedAt: dayString,
    });

    // Sleep: around 6.5 to 8.2 hours
    list.push({
      id: `vit_sl_${i}`,
      userId,
      type: "sleep",
      value: Number((7.2 + Math.cos(i) * 0.9).toFixed(1)),
      source: "fitbit",
      recordedAt: dayString,
    });

    // SpO2: around 97-99%
    list.push({
      id: `vit_spo2_${i}`,
      userId,
      type: "spo2",
      value: Math.round(98 + Math.sin(i) * 1),
      source: "google_fit",
      recordedAt: dayString,
    });
  }

  return list;
};

export function useVitals() {
  const queryClient = useQueryClient();

  const { data: vitals = [], isLoading } = useQuery<VitalEntry[]>({
    queryKey: ["vitals"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);

        const initial = generateMockVitals();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return [];
    },
  });

  const addVitalMutation = useMutation({
    mutationFn: async (newVital: Omit<VitalEntry, "id" | "userId" | "recordedAt"> & { recordedAt?: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const entry: VitalEntry = {
        ...newVital,
        id: `vit_${Date.now()}`,
        userId: "usr_mock_123",
        recordedAt: newVital.recordedAt || new Date().toISOString(),
      };

      const existing = [...vitals];
      existing.unshift(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vitals"] });
    },
  });

  return {
    vitals,
    isLoading,
    addVital: addVitalMutation.mutateAsync,
    isAdding: addVitalMutation.isPending,
  };
}
