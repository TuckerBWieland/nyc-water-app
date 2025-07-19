// Utility functions for the MapViewer component
import L from 'leaflet';
import type { Ref } from 'vue';
import { isMobile } from './useScreenSize';
import { featurePopupOpen } from '../stores/featurePopupState';
import { track, EVENT_CLICK_SITE_MARKER } from '../services/analytics';
import type { WaterQualityGeoJSON, MPNValue, ColorString } from '../types';
import { MPN_THRESHOLDS, COLORS } from '../types';

// Use constants from types
const MPN_THRESHOLD_LOW = MPN_THRESHOLDS.LOW;
const MPN_THRESHOLD_MEDIUM = MPN_THRESHOLDS.MEDIUM;
const MPN_DETECTION_LIMIT = MPN_THRESHOLDS.DETECTION_LIMIT;

const COLOR_GREEN = COLORS.GREEN;
const COLOR_YELLOW = COLORS.YELLOW;
const COLOR_RED = COLORS.RED;

const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// Type definitions for function parameters
interface UpdateTileLayerParams {
  map: Ref<any>;
  tileLayer: Ref<any>;
  markers: Ref<any>;
  isDarkMode: boolean;
}

interface UpdateMapParams {
  map: Ref<any>;
  markers: Ref<any>;
  hasAutoFitted: Ref<boolean>;
  isDarkMode: boolean;
  data: WaterQualityGeoJSON;
}

interface UpdatePopupStylesParams {
  map: Ref<any>;
  markers: Ref<any>;
  isDarkMode: boolean;
}

function getColorForMPN(mpn: MPNValue): ColorString {
  if (mpn === null) return COLOR_YELLOW;
  const mpnValue = Number(mpn);
  if (Number.isNaN(mpnValue)) return COLOR_YELLOW;
  if (mpnValue < MPN_THRESHOLD_LOW) return COLOR_GREEN;
  if (mpnValue <= MPN_THRESHOLD_MEDIUM) return COLOR_YELLOW;
  return COLOR_RED;
}

export function createWaterBottleIcon(mpn: MPNValue): L.DivIcon {
  const color = getColorForMPN(mpn);
  return L.divIcon({
    html: `
      <div style="width: 16px; height: 32px; color: ${color}">
        <svg viewBox="0 0 32 64" xmlns="http://www.w3.org/2000/svg" width="16" height="32">
          <rect x="8" y="2" width="16" height="6" rx="2" fill="#ccc" stroke="black" stroke-width="0.5"/>
          <rect x="10" y="8" width="12" height="4" rx="2" fill="#eee" stroke="black" stroke-width="0.5"/>
          <rect x="6" y="12" width="20" height="44" rx="6" fill="currentColor" stroke="white" stroke-width="1"/>
          <ellipse cx="16" cy="58" rx="8" ry="2" fill="white" opacity="0.2"/>
        </svg>
      </div>
    `,
    className: 'water-bottle-icon',
    iconSize: [16, 32],
    iconAnchor: [8, 32],
    popupAnchor: [0, -34],
  });
}

export function generateRainChart(data: (number | null)[], isDarkMode: boolean): string {
  const dayLabels = ['F', 'S', 'S', 'M', 'T', 'W', 'Th'];
  const numeric = (data || []).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  const max = numeric.length ? Math.max(...numeric) : 0;
  const getColor = (value: number | null): string => {
    if (value === null || value === undefined)
      return isDarkMode ? 'bg-gray-500' : 'bg-gray-300';
    if (value < 0.5) return isDarkMode ? 'bg-green-600' : 'bg-green-500';
    if (value < 3.0) return isDarkMode ? 'bg-yellow-500' : 'bg-yellow-400';
    return isDarkMode ? 'bg-red-600' : 'bg-red-500';
  };
  return `
    <div class="flex items-end justify-between h-16 mb-1">
      ${data
        .map((val, idx) => {
          const height = max === 0 || val === null ? 0 : (val / max) * 100;
          const valDisplay = val && val > 0 ? Number(val).toFixed(1) : '';
          return `
            <div class="flex flex-col items-center group h-full justify-end">
              <div class="text-xs opacity-70 mb-1 font-medium" style="${valDisplay ? '' : 'visibility:hidden'}">${valDisplay}</div>
              <div class="w-4 rounded-t transition-all duration-300 shadow-md border border-black/10 min-h-[1px] ${getColor(val)}" style="height:${height}%"></div>
              <span class="text-xs mt-1 font-medium">${dayLabels[idx % 7]}</span>
            </div>`;
        })
        .join('')}
    </div>`;
}

function formatSampleDate(timestamp: string): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `Sampled on ${date.getMonth() + 1}/${date.getDate()} at ${time}`;
}

export function updatePopupStyles({ map, markers, isDarkMode }: UpdatePopupStylesParams): void {
  if (!map.value) return;
  markers.value.forEach((marker: any) => {
    const popup = marker.getPopup();
    if (popup) {
      const content = popup.getContent();
      marker.closePopup().unbindPopup();
      marker.bindPopup(content || '', { className: isDarkMode ? 'dark-mode-popup' : '' });
    }
  });
}

export function updateTileLayer({ map, tileLayer, markers, isDarkMode }: UpdateTileLayerParams): void {
  if (!map.value) return;
  if (tileLayer.value) {
    map.value.removeLayer(tileLayer.value);
  }
  const url = isDarkMode ? DARK_TILE_URL : LIGHT_TILE_URL;
  tileLayer.value = L.tileLayer(url, {
    attribution: '',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map.value);
  updatePopupStyles({ map, markers, isDarkMode });
}

export function updateMap({ map, markers, hasAutoFitted, isDarkMode, data }: UpdateMapParams): void {
  if (!map.value) {
    console.error('Map instance is not available');
    return;
  }
  const previousCenter = map.value.getCenter();
  const previousZoom = map.value.getZoom();

  for (const marker of markers.value) {
    marker.remove();
  }
  markers.value = [];

  if (!data.features || data.features.length === 0) {
    console.warn('No features found in data');
    return;
  }

  for (const feature of data.features) {
    try {
      if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length < 2) {
        console.warn('Invalid feature geometry or coordinates');
        continue;
      }
      if (!feature.properties) {
        console.warn('Missing properties in feature');
        continue;
      }
      const siteName = feature.properties.siteName || '';
      const mpnValue = feature.properties.mpn;
      const timestampValue = feature.properties.timestamp || '';
      if (mpnValue === undefined) {
        console.warn('Feature is missing MPN property:', feature);
        continue;
      }
      const [lng, lat] = feature.geometry.coordinates;
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinates (NaN values)');
        continue;
      }
      const bottleIcon = createWaterBottleIcon(mpnValue);
      bottleIcon.options.popupAnchor = [0, -40];

      let qualityColor: string, qualityMessage: string;
      const mpnNumber = Number(mpnValue);
      if (mpnNumber < 35) {
        qualityColor = 'text-green-500';
        qualityMessage = 'Acceptable for swimming';
      } else if (mpnNumber <= 104) {
        qualityColor = 'text-yellow-400';
        qualityMessage = 'Unacceptable if levels persist';
      } else {
        qualityColor = 'text-red-500';
        qualityMessage = 'Unacceptable for swimming';
      }

      const sanitize = (str: unknown): string => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      const sanitizedSite = sanitize(siteName);
      const sanitizedMpn = sanitize(mpnValue === null ? 'N/A' : mpnValue.toString());
      const isDetectionLimit = Number(mpnValue) === MPN_DETECTION_LIMIT;
      const sanitizedMpnDisplay = `${sanitizedMpn}${isDetectionLimit ? '*' : ''}`;

      let popupContent = `
        <div class="site-popup">
          <div class="font-semibold text-lg site-name">${sanitizedSite}</div>
          <div class="mt-2 ${qualityColor} font-medium text-base">
            ${sanitizedMpnDisplay} MPN/100mL
          </div>
          <div class="mt-1 text-sm opacity-75">
            ${qualityMessage}
          </div>
      `;
      if (isDetectionLimit) {
        popupContent += `<div class="text-xs opacity-75 mt-1">*Sample reached the instrument detection limit.</div>`;
      }
      if (timestampValue) {
        const formatted = formatSampleDate(timestampValue);
        popupContent += `<div class="text-xs opacity-75 mt-1">${sanitize(formatted)}</div>`;
      }

      if (feature.properties.tide || feature.properties.rainfall_mm_7day !== undefined) {
        popupContent += `<div class="text-xs font-medium mt-3 pt-2 border-t border-gray-200">Environmental Conditions:</div>`;
      }
      if (feature.properties.tide) {
        popupContent += `<div class="text-xs opacity-75 mt-1"><span title="Tidal data is taken from nearest NOAA station and is only approximate">${sanitize(feature.properties.tide)}</span></div>`;
      }
      if (feature.properties.rainfall_mm_7day !== undefined && feature.properties.rainfall_mm_7day !== null) {
        const mm = feature.properties.rainfall_mm_7day || 0;
        const inches = Number((mm * 0.0393701).toFixed(2));
        const sanitizedInches = sanitize(inches.toFixed(2));
        if (isMobile.value) {
          const rainData = feature.properties.rainByDay || [];
          popupContent += `<div class="text-xs opacity-75 mt-1">Total rainfall (7-day): ${sanitizedInches} in</div>`;
          popupContent += `<button class="rain-toggle text-xs underline mt-1">Rain details</button>`;
          popupContent += `<div class="rain-details hidden mt-1">${generateRainChart(rainData, isDarkMode)}</div>`;
        } else {
          popupContent += `<div class="text-xs opacity-75 mt-1"><span title="Rainfall data for the 7 days prior to sample date">Rainfall: ${sanitizedInches} in (7-day)</span></div>`;
        }
      }
      if (feature.properties.goodCount !== undefined && feature.properties.cautionCount !== undefined && feature.properties.poorCount !== undefined) {
        const good = sanitize(feature.properties.goodCount);
        const caution = sanitize(feature.properties.cautionCount);
        const poor = sanitize(feature.properties.poorCount);
        popupContent += `<div class="text-xs font-medium mt-3 pt-2 border-t border-gray-200">This season:</div>`;
        popupContent += `<div class="text-xs opacity-75 mt-1">${good} good, ${caution} caution, ${poor} poor</div>`;
      }
      popupContent += `</div>`;

      const marker = L.marker([lat, lng], { icon: bottleIcon })
        .bindPopup(popupContent, { className: isDarkMode ? 'dark-mode-popup' : '' })
        .addTo(map.value);

      marker.on('click', () => {
        track(EVENT_CLICK_SITE_MARKER, { site_name: siteName });
      });

      marker.on('popupopen', (e: L.PopupEvent) => {
        featurePopupOpen.value = true;
        const container = e.popup.getElement();
        const toggle = container?.querySelector('.rain-toggle');
        if (toggle) {
          toggle.addEventListener('click', () => {
            const details = container?.querySelector('.rain-details');
            if (details) details.classList.toggle('hidden');
          });
        }
      });

      marker.on('popupclose', () => {
        featurePopupOpen.value = false;
      });

      markers.value.push(marker);
    } catch (err) {
      console.error('Error processing feature:', err);
    }
  }

  if (markers.value.length > 0) {
    if (!hasAutoFitted.value) {
      const group = L.featureGroup(markers.value);
      map.value.fitBounds(group.getBounds(), { padding: [30, 30] });
      hasAutoFitted.value = true;
    } else {
      map.value.setView(previousCenter, previousZoom);
    }
  }
}


