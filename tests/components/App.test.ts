/**
 * Tests for App.vue component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from '../../src/App.vue';
import { nextTick } from 'vue';

// Mock child components to simplify testing
vi.mock('../../src/components/MapViewer.vue', () => ({
  default: {
    name: 'MapViewer',
    props: ['selectedDate', 'isDarkMode'],
    template: '<div data-testid="map-viewer"></div>',
    emits: ['update:siteCount', 'update:sampleData'],
  },
}));

vi.mock('../../src/components/HeaderOverlay.vue', () => ({
  default: {
    name: 'HeaderOverlay',
    props: ['isExpanded', 'latestDate', 'siteCount', 'isDarkMode'],
    template: '<div data-testid="header-overlay"></div>',
    emits: ['update:isExpanded', 'toggleMapMode'],
  },
}));

vi.mock('../../src/components/DateScroller.vue', () => ({
  default: {
    name: 'DateScroller',
    props: ['modelValue', 'dates', 'isDarkMode'],
    template: '<div data-testid="date-scroller"></div>',
    emits: ['update:modelValue'],
  },
}));

vi.mock('../../src/components/InfoPopup.vue', () => ({
  default: {
    name: 'InfoPopup',
    props: ['isDarkMode'],
    template: '<div data-testid="info-popup"></div>',
  },
}));

vi.mock('../../src/components/SampleBarLegend.vue', () => ({
  default: {
    name: 'SampleBarLegend',
    props: ['samples', 'isDarkMode'],
    template: '<div data-testid="sample-bar-legend"></div>',
  },
}));

vi.mock('../../src/components/RainDropLegend.vue', () => ({
  default: {
    name: 'RainDropLegend',
    props: ['rainfall', 'isDarkMode'],
    template: '<div data-testid="rain-drop-legend"></div>',
  },
}));

describe('App.vue', () => {
  beforeEach(() => {
    // Mock fetch API for index.json
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        dates: ['2025-05-01', '2025-05-02', '2025-05-09'],
        latest: '2025-05-09',
      }),
    } as unknown as Response);
  });

  it('should mount successfully', async () => {
    const wrapper = mount(App);

    // Wait for component to finish mounting and async operations
    await flushPromises();

    // Verify child components are present
    expect(wrapper.find('[data-testid="map-viewer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="header-overlay"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="date-scroller"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="info-popup"]').exists()).toBe(true);
  });

  it('should fetch dates on mount', async () => {
    mount(App);

    // Wait for component to finish mounting and async operations
    await flushPromises();

    // Verify fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('/data/index.json');
  });

  it('should update siteCount when MapViewer emits update:siteCount', async () => {
    const wrapper = mount(App);

    // Wait for component to finish mounting
    await flushPromises();

    // Find the MapViewer component
    const mapViewer = wrapper.findComponent({ name: 'MapViewer' });

    // Emit the update:siteCount event
    await mapViewer.vm.$emit('update:siteCount', 10);

    // Verify the siteCount prop is passed to HeaderOverlay
    const headerOverlay = wrapper.findComponent({ name: 'HeaderOverlay' });
    expect(headerOverlay.props('siteCount')).toBe(10);
  });

  it('should toggle dark mode when button is clicked', async () => {
    const wrapper = mount(App);

    // Wait for component to finish mounting
    await flushPromises();

    // Find the dark mode toggle button
    const toggleButton = wrapper.find('button[aria-label="Toggle dark mode"]');

    // Get initial dark mode state
    const initialIsDarkMode = wrapper.vm.isDarkMode;

    // Click the toggle button
    await toggleButton.trigger('click');

    // Verify the dark mode state is toggled
    expect(wrapper.vm.isDarkMode).toBe(!initialIsDarkMode);

    // Verify the dark mode prop is passed to child components
    const mapViewer = wrapper.findComponent({ name: 'MapViewer' });
    expect(mapViewer.props('isDarkMode')).toBe(!initialIsDarkMode);
  });

  it('should handle failed fetch gracefully', async () => {
    // Mock a failed fetch
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as unknown as Response);

    // Mock console.error to prevent test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(App);

    // Wait for component to finish mounting and async operations
    await flushPromises();

    // Verify the component mounted successfully despite the fetch error
    expect(wrapper.find('[data-testid="map-viewer"]').exists()).toBe(true);

    // Verify dates is an empty array
    expect(wrapper.vm.dates).toEqual([]);
  });
});
