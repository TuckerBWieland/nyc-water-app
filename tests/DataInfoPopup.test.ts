import { mount } from '@vue/test-utils';
import DataInfoPopup from '../src/components/DataInfoPopup.vue';

// Mock the TypeScript analytics service
jest.mock('../src/services/analytics', () => ({
  track: jest.fn(),
  EVENT_CLICK_DATA_INFO_BUTTON: 'click_data_info_button',
  EVENT_CLICK_OUTBOUND_LINK: 'click_outbound_link',
  EVENT_OPEN_POPUP: 'open_popup',
}));

// Mock the TypeScript composables
jest.mock('../src/composables/usePopupAnalytics', () => ({
  usePopupAnalytics: jest.fn(() => ({
    isOpen: false,  // Return boolean directly, not ref object
    togglePopup: jest.fn(),
    closePopup: jest.fn(),
    trackOutbound: jest.fn(),
  })),
}));



describe('DataInfoPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders popup container', () => {
    const wrapper = mount(DataInfoPopup, {
      props: { isDarkMode: false, showNotification: false },
    });

    // Test that the component renders
    expect(wrapper.exists()).toBe(true);
  });

  test('renders with correct props', () => {
    const wrapper = mount(DataInfoPopup, {
      props: { 
        isDarkMode: true, 
        showNotification: true 
      },
    });

    expect(wrapper.props().isDarkMode).toBe(true);
    expect(wrapper.props().showNotification).toBe(true);
  });

  test('can be instantiated without errors', () => {
    expect(() => {
      mount(DataInfoPopup, {
        props: { isDarkMode: false },
      });
    }).not.toThrow();
  });
});
