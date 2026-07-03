"use client";

import { useState, useEffect } from "react";

export type UnitPreference = "metric" | "imperial";

export function useUnitPreference() {
  const [unitPref, setUnitPref] = useState<UnitPreference>("metric");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vitalis_unit_pref") as UnitPreference;
      if (saved) setUnitPref(saved);
    }
  }, []);

  const toggleUnits = () => {
    const next = unitPref === "metric" ? "imperial" : "metric";
    setUnitPref(next);
    localStorage.setItem("vitalis_unit_pref", next);
  };

  // Convert weight (kg) to display unit (kg or lbs)
  const formatWeight = (kg: number) => {
    if (unitPref === "imperial") {
      return { value: Math.round(kg * 2.20462), label: "lbs" };
    }
    return { value: Math.round(kg), label: "kg" };
  };

  // Convert distance (km) to display unit (km or miles)
  const formatDistance = (km: number) => {
    if (unitPref === "imperial") {
      return { value: Number((km * 0.621371).toFixed(2)), label: "mi" };
    }
    return { value: Number(km.toFixed(2)), label: "km" };
  };

  // Convert height (cm) to display unit (cm or ft/in)
  const formatHeight = (cm: number) => {
    if (unitPref === "imperial") {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return { value: `${feet}ft ${inches}in`, label: "ft/in", feet, inches };
    }
    return { value: `${Math.round(cm)} cm`, label: "cm", cm: Math.round(cm) };
  };

  // Convert display value back to database standard (kg, km, cm)
  const toDbWeight = (val: number) => {
    return unitPref === "imperial" ? val / 2.20462 : val;
  };

  const toDbDistance = (val: number) => {
    return unitPref === "imperial" ? val / 0.621371 : val;
  };

  return {
    unitPref,
    setUnitPref: (pref: UnitPreference) => {
      setUnitPref(pref);
      localStorage.setItem("vitalis_unit_pref", pref);
    },
    toggleUnits,
    formatWeight,
    formatDistance,
    formatHeight,
    toDbWeight,
    toDbDistance,
  };
}
