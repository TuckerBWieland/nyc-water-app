import { mount } from '@vue/test-utils';
import MapViewer from '../src/components/MapViewer.vue';
import { featurePopupOpen } from '../src/stores/featurePopupState';

jest.mock('leaflet', () => {
  const mapInstance = {
    setView: jest.fn().mockReturnThis(),
    removeControl: jest.fn(),
    removeLayer: jest.fn(),
    addLayer: jest.fn(),
    getCenter: jest.fn(() => ({ lat: 0, lng: 0 })),
    getZoom: jest.fn(() => 12),
    fitBounds: jest.fn(),
    remove: jest.fn(),
  };

  return {
    map: jest.fn(() => mapInstance),
    tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
    divIcon: jest.fn(() => ({ options: {} })),
    marker: jest.fn(() => {
      let popupContent = '';
      const marker = {
        options: {},
        bindPopup: jest.fn((content, options) => {
          popupContent = content;
          marker.popupOptions = options;
          return marker;
        }),
        getPopup: jest.fn(() => ({ getContent: () => popupContent })),
        closePopup: jest.fn(() => marker),
        unbindPopup: jest.fn(() => marker),
        addTo: jest.fn(() => marker),
        on: jest.fn(),
        remove: jest.fn(),
      };
      return marker;
    }),
    featureGroup: jest.fn(markers => ({ getBounds: jest.fn(() => ({})) })),
  };
});

const sampleData = {
  features: [
    {
      geometry: { type: 'Point', coordinates: [-74, 40] },
      properties: { siteName: 'Site A', mpn: 10 },
    },
    {
      geometry: { type: 'Point', coordinates: [-73, 41] },
      properties: { siteName: 'Site B', mpn: 200 },
    },
  ],
};

describe('MapViewer', () => {
  beforeEach(() => {
    featurePopupOpen.value = false;
  });

  test('creates markers for GeoJSON features', async () => {
    const wrapper = mount(MapViewer, {
      props: { selectedDate: '2024-01-01', isDarkMode: false, geojson: sampleData },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.markers.length).toBe(2);
  });

  test('updates popup styles when called', async () => {
    const wrapper = mount(MapViewer, {
      props: { selectedDate: '2024-01-01', isDarkMode: false, geojson: sampleData },
    });

    await wrapper.vm.$nextTick();
    wrapper.setProps({ isDarkMode: true });
    wrapper.vm.updatePopupStyles();

    for (const marker of wrapper.vm.markers) {
      expect(marker.bindPopup).toHaveBeenCalledWith(expect.any(String), {
        className: 'dark-mode-popup',
      });
    }
  });
});
