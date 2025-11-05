// src/config.ts
export interface WooRentalBridgeConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  timeout?: number; // In milliseconds
}