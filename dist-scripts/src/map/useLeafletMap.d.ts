/**
 * Composable for Leaflet map functionality with TypeScript support
 */
import { Ref } from 'vue';
import { MapOptions } from './types';
/**
 * Map reference object returned by the composable
 */
export interface MapRef {
    /** The Leaflet map instance */
    instance: Ref<L.Map | null>;
    /** The current tile layer */
    tileLayer: Ref<L.TileLayer | null>;
    /** The markers on the map */
    markers: Ref<L.Marker[]>;
    /** Whether the map has been fitted to bounds */
    hasAutoFitted: Ref<boolean>;
    /** Function to update the tile layer based on theme */
    updateTheme: (isDark: boolean) => void;
    /** Function to clear all markers */
    clearMarkers: () => void;
    /** Function to fit to all markers */
    fitToMarkers: () => void;
    /** Function to get the current center */
    getCenter: () => L.LatLng | undefined;
    /** Function to get the current zoom level */
    getZoom: () => number | undefined;
}
/**
 * Composable function for managing a Leaflet map
 * @param options - Configuration options for map
 * @returns Object with map instance and utility functions
 */
export declare function useLeafletMap(options: MapOptions): MapRef;
