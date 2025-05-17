/**
 * Type definitions for Leaflet integration
 * This is a simplified version to avoid compatibility issues with TypeScript
 */

declare module 'leaflet' {
  // Export all as any to avoid TypeScript errors
  export class Map {
    [key: string]: any;
    _layers: any[];
    options: {
      layers?: Layer[];
      [key: string]: any;
    };
    _container: HTMLElement;
    _mapPane: HTMLElement;
    _panes: Record<string, HTMLElement>;
    getCenter(): LatLng;
    getZoom(): number;
    remove(): void;
    setView(center: [number, number], zoom: number): Map;
    fitBounds(bounds: any, options?: any): Map;
    addControl(control: any): Map;
    removeControl(control: any): Map;
    getRenderer(layer: Path): Renderer;
    removeLayer(layer: Layer): this;
    addLayer(layer: Layer): this;
  }

  export class TileLayer extends Layer {
    [key: string]: any;
    _tileOnLoad: any;
    _tileOnError: any;
    _abortLoading: any;
    _getZoomForUrl: any;
    setUrl(url: string, noRedraw?: boolean): TileLayer;
    getTileUrl(coords: Coords): string;
    options: {
      id?: string;
      subdomains?: string | string[];
      attribution?: string;
      [key: string]: any;
    };
  }

  export class Marker<T = any> extends Layer {
    [key: string]: any;
    _shadow: any; // Required for type compatibility
    addTo(map: Map): Marker<T>;
    remove(): void;
    bindPopup(content: string | HTMLElement, options?: any): Marker<T>;
    getPopup(): Popup;
    closePopup(): Marker<T>;
    unbindPopup(): Marker<T>;
    on(event: string, callback: (...args: any[]) => void): Marker<T>;
    getLatLng(): LatLng;
    setLatLng(latlng: LatLngExpression): Marker<T>;
    toGeoJSON(precision?: number | false): any;
  }

  export class Layer {
    [key: string]: any;
    _map: any; // Required for type compatibility
    addTo(map: Map | LayerGroup): this;
    remove(): this;
    removeFrom(map: Map): this;
    getPane(name?: string): HTMLElement | undefined;
  }

  export class FeatureGroup extends Layer {
    [key: string]: any;
    getBounds(): any;
  }

  export interface LatLng {
    lat: number;
    lng: number;
    [key: string]: any;
  }

  export interface Popup {
    [key: string]: any;
    getContent(): string;
  }

  export interface DivIcon {
    [key: string]: any;
  }

  // Additional types
  export type LatLngExpression = LatLng | [number, number] | { lat: number; lng: number };
  export type Coords = { x: number; y: number; z: number };
  export interface LayerGroup<T = any> extends Layer {
    addLayer(layer: Layer): LayerGroup<T>;
    removeLayer(layer: Layer): LayerGroup<T>;
  }
  export interface Control<T = any> {
    options: T;
  }
  export interface ControlOptions {
    [key: string]: any;
  }
  export interface Path extends Layer {
    [key: string]: any;
  }
  export interface Renderer {
    [key: string]: any;
  }

  // Function signatures
  export function map(id: string): Map;
  export function tileLayer(url: string, options?: any): TileLayer;
  export function marker(latLng: LatLngExpression, options?: any): Marker;
  export function featureGroup(layers?: Layer[]): FeatureGroup;
  export function divIcon(options?: any): DivIcon;

  // Default export
  const L: any;
  export default L;
}
