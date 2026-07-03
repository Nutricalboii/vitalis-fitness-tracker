import { WearableAdapter, WearableMetricData } from "./types";

export class GoogleFitAdapter implements WearableAdapter {
  providerId = "google_fit";
  providerName = "Google Fit";

  async connect(): Promise<boolean> {
    // Simulate OAuth2 redirect / handshake
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  }

  async disconnect(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  async fetchData(): Promise<WearableMetricData> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Simulating REST API payload for Google Fit
    return {
      steps: 8420 + Math.floor(Math.random() * 1500),
      heartRateAverage: 72 + Math.floor(Math.random() * 6),
      sleepHours: 7.4,
      activeCalories: 380,
    };
  }
}
