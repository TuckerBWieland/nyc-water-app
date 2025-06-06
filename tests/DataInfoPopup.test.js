import { mount } from '@vue/test-utils';
import DataInfoPopup from '../src/components/DataInfoPopup.vue';

jest.mock('../src/services/analytics', () => ({
  track: jest.fn(),
  EVENT_CLICK_DATA_INFO_BUTTON: 'click_data_info_button',
  EVENT_CLICK_OUTBOUND_LINK: 'click_outbound_link',
  EVENT_OPEN_POPUP: 'open_popup',
}));

const analytics = require('../src/services/analytics');

describe('DataInfoPopup', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('toggles popup open state', async () => {
    const wrapper = mount(DataInfoPopup, {
      props: { isDarkMode: false, showNotification: false },
    });

    expect(wrapper.vm.isOpen.value).toBe(false);
    wrapper.vm.togglePopup();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isOpen.value).toBe(true);
    expect(analytics.track).toHaveBeenCalledWith('open_popup', { component: 'DataInfoPopup' });
    expect(analytics.track).toHaveBeenCalledWith('click_data_info_button');
  });

  test('tracks outbound links', () => {
    const wrapper = mount(DataInfoPopup, {
      props: { isDarkMode: false },
    });
    wrapper.vm.trackOutbound('https://example.com');
    expect(analytics.track).toHaveBeenCalledWith('click_outbound_link', { url: 'https://example.com' });
  });
});
