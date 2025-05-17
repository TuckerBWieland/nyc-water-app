/**
 * Simple declaration file for Leaflet to bypass TypeScript errors
 * This declares the entire module as 'any' type
 */
declare module 'leaflet' {
  const _default: any;
  export default _default;
  
  // Export all properties as any
  export const map: any;
  export const tileLayer: any;
  export const marker: any;
  export const icon: any;
  export const divIcon: any;
  export const featureGroup: any;
  export const latLng: any;
  export const latLngBounds: any;
  export const control: any;
  
  // Simplified interfaces
  export type Map = any;
  export type Marker = any;
  export type TileLayer = any;
  export type Layer = any;
  export type FeatureGroup = any;
  export type Control = any;
  export type LatLng = any;
  export type Popup = any;
}