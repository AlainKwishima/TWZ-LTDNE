/** Unified fire extinguisher asset model (API-aligned). */
export interface FireExtinguisherAsset {
  id: string;
  assetCode?: string;
  serialNumber: string;
  customerId?: string;
  location?: string | null;
  type: string;
  size: string;
  installationDate: string;
  expirationDate: string;
  status?: string;
  nextServiceDate?: string | null;
  serviceDate?: string | null;
  refillBookedAt?: string | null;
  notes?: string | null;
}

export const ASSET_STATUS_OPTIONS = [
  'Active',
  'ExpiringSoon',
  'Expired',
  'Serviced',
  'NeedsReplacement',
  'HighRisk',
] as const;

export type AssetStatus = (typeof ASSET_STATUS_OPTIONS)[number];

export const ASSET_TYPE_SUGGESTIONS = [
  'Dry Powder ABC',
  'CO2',
  'Water',
  'Foam',
  'Wet Chemical',
] as const;

export const ASSET_SIZE_SUGGESTIONS = ['2kg', '5kg', '6kg', '9kg', '12kg'] as const;
