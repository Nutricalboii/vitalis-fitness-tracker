"use client";

import { useMemo } from "react";
import { useVitals, VitalType, VitalEntry } from "./useVitals";

export type TimeRange = "7d" | "30d" | "90d";

export function useHealthMetric(metricType: VitalType, range: TimeRange = "7d") {
  const { vitals, isLoading } = useVitals();

  const metricStats = useMemo(() => {
    // Filter and sort by date ascending
    const filtered = vitals
      .filter((v) => v.type === metricType)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    // Filter based on selected time range
    const now = new Date();
    const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const thresholdDate = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    const rangeData = filtered.filter((v) => new Date(v.recordedAt) >= thresholdDate);

    if (rangeData.length === 0) {
      return {
        chartData: [],
        average: 0,
        averageSecondary: 0,
        trendPercent: 0,
        latest: null,
        isWarning: false,
      };
    }

    // Calculations
    const sum = rangeData.reduce((acc, curr) => acc + curr.value, 0);
    const average = Number((sum / rangeData.length).toFixed(1));

    const sumSec = rangeData.reduce((acc, curr) => acc + (curr.secondaryValue || 0), 0);
    const averageSecondary = Number((sumSec / rangeData.length).toFixed(1));

    const latest = rangeData[rangeData.length - 1];

    // Compute trend (compare first and last entry of the range)
    let trendPercent = 0;
    if (rangeData.length > 1) {
      const firstVal = rangeData[0].value;
      const lastVal = rangeData[rangeData.length - 1].value;
      if (firstVal !== 0) {
        trendPercent = Number((((lastVal - firstVal) / firstVal) * 100).toFixed(1));
      }
    }

    // Informational healthy range indicator/warnings
    let isWarning = false;
    if (latest) {
      if (metricType === "bp") {
        // High Blood Pressure warning: Systolic > 130 or Diastolic > 80
        const sys = latest.value;
        const dia = latest.secondaryValue || 0;
        if (sys >= 130 || dia >= 80) isWarning = true;
      } else if (metricType === "hr") {
        // Resting Heart Rate alert: outside 50 - 100
        if (latest.value < 50 || latest.value > 100) isWarning = true;
      } else if (metricType === "spo2") {
        // Low SpO2: < 95%
        if (latest.value < 95) isWarning = true;
      }
    }

    // Format chart coordinates
    const chartData = rangeData.map((v) => {
      const dateObj = new Date(v.recordedAt);
      const label = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        date: label,
        value: v.value,
        secondaryValue: v.secondaryValue,
        source: v.source,
      };
    });

    return {
      chartData,
      average,
      averageSecondary,
      trendPercent,
      latest,
      isWarning,
    };
  }, [vitals, metricType, range]);

  return {
    ...metricStats,
    isLoading,
  };
}
