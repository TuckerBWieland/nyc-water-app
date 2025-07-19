// Core data types for NYC Water Quality App
import type { Ref } from 'vue';

export interface WaterQualityFeatureProperties {
  siteName: string;
  mpn: number | null;
  timestamp?: string;
  tide?: string;
  rainfall_mm_7day?: number | null;
  rainByDay?: (number | null)[];
  goodCount?: number;
  cautionCount?: number;
  poorCount?: number;
}

export interface WaterQualityFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: WaterQualityFeatureProperties;
}

export interface WaterQualityGeoJSON {
  type: 'FeatureCollection';
  features: WaterQualityFeature[];
}

export interface DataMetadata {
  date: string;
  totalSites: number;
  goodSites: number;
  cautionSites: number;
  poorSites: number;
  lastUpdated: string;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

// Theme types
export interface ThemeState {
  isDarkMode: boolean;
}

// Component prop types
export interface MapViewerProps {
  selectedDate: string;
  isDarkMode: boolean;
  geojson: WaterQualityGeoJSON | null;
}

export interface DateScrollerProps {
  availableDates: string[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// Composable return types
export interface StaticDataReturn {
  data: Ref<WaterQualityGeoJSON | null>;
  metadata: Ref<DataMetadata | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  load: (date?: string) => Promise<void>;
}

export interface ScreenSizeReturn {
  isMobile: Ref<boolean>;
  screenWidth: Ref<number>;
}

// Popup management types
export interface PopupState {
  isOpen: boolean;
  type: 'info' | 'donate' | 'data-info' | null;
}

// Map utilities types
export interface MapInstance {
  value: L.Map | null;
}

export interface MarkerInstance {
  value: L.Marker[];
}

// Utility types
export type DateString = string; // Format: YYYY-MM-DD
export type MPNValue = number | null;
export type ColorString = string; // Hex color

// Constants
export const MPN_THRESHOLDS = {
  LOW: 35,
  MEDIUM: 104,
  DETECTION_LIMIT: 24196,
} as const;

export const COLORS = {
  GREEN: '#22c55e',
  YELLOW: '#facc15',
  RED: '#ef4444',
} as const; 