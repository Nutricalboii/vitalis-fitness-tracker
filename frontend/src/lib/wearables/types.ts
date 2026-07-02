export interface WearableMetricData {
  steps?: number;
  heartRateAverage?: number;
  sleepHours?: number;
  activeCalories?: number;
}

export interface WearableAdapter {
  providerId: string;
  providerName: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  fetchData(): Promise<WearableMetricData>;
}
