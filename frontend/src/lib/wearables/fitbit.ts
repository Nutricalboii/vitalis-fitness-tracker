import { WearableAdapter, WearableMetricData } from "./types";

export class FitbitAdapter implements WearableAdapter {
  providerId = "fitbit";
  providerName = "Fitbit";

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
    // Simulating REST API payload for Fitbit
    return {
      steps: 9150 + Math.floor(Math.random() * 1200),
      heartRateAverage: 68 + Math.floor(Math.random() * 5),
      sleepHours: 7.8,
      activeCalories: 420,
    };
  }
}
