"use client";

import { useState, useEffect } from "react";
import { GoogleFitAdapter } from "@/lib/wearables/google_fit";
import { AppleHealthAdapter } from "@/lib/wearables/apple_health";
import { WearableAdapter, WearableMetricData } from "@/lib/wearables/types";
import { useVitals } from "./useVitals";

export type ProviderType = "google_fit" | "apple_health";

export function useWearableSync() {
  const { addVital } = useVitals();
  const [connectedProviders, setConnectedProviders] = useState<ProviderType[]>([]);
  const [syncing, setSyncing] = useState<Record<ProviderType, boolean>>({
    google_fit: false,
    apple_health: false,
  });
  const [lastSynced, setLastSynced] = useState<Record<ProviderType, string | null>>({
    google_fit: null,
    apple_health: null,
  });

  const adapters: Record<ProviderType, WearableAdapter> = {
    google_fit: new GoogleFitAdapter(),
    apple_health: new AppleHealthAdapter(),
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConns = localStorage.getItem("vitalis_connections");
      if (savedConns) setConnectedProviders(JSON.parse(savedConns));

      const savedSyncs = localStorage.getItem("vitalis_last_synced");
      if (savedSyncs) setLastSynced(JSON.parse(savedSyncs));
    }
  }, []);

  const connect = async (provider: ProviderType) => {
    try {
      const success = await adapters[provider].connect();
      if (success) {
        const nextConns = [...connectedProviders, provider];
        setConnectedProviders(nextConns);
        localStorage.setItem("vitalis_connections", JSON.stringify(nextConns));
        await syncNow(provider);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const disconnect = async (provider: ProviderType) => {
    try {
      const success = await adapters[provider].disconnect();
      if (success) {
        const nextConns = connectedProviders.filter((p) => p !== provider);
        setConnectedProviders(nextConns);
        localStorage.setItem("vitalis_connections", JSON.stringify(nextConns));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const syncNow = async (provider: ProviderType) => {
    if (!connectedProviders.includes(provider) && provider !== "google_fit" && provider !== "apple_health") return;

    setSyncing((prev) => ({ ...prev, [provider]: true }));
    try {
      const data: WearableMetricData = await adapters[provider].fetchData();
      const nowStr = new Date().toISOString();

      // Push metrics to vitals store
      if (data.heartRateAverage !== undefined) {
        await addVital({
          type: "hr",
          value: data.heartRateAverage,
          source: provider,
          recordedAt: nowStr,
        });
      }

      if (data.sleepHours !== undefined) {
        await addVital({
          type: "sleep",
          value: data.sleepHours,
          source: provider,
          recordedAt: nowStr,
        });
      }

      const nextSyncs = { ...lastSynced, [provider]: nowStr };
      setLastSynced(nextSyncs);
      localStorage.setItem("vitalis_last_synced", JSON.stringify(nextSyncs));
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing((prev) => ({ ...prev, [provider]: false }));
    }
  };

  return {
    connectedProviders,
    syncing,
    lastSynced,
    connect,
    disconnect,
    syncNow,
    isSyncing: Object.values(syncing).some(Boolean),
  };
}
