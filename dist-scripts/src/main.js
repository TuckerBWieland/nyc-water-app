import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import { track, EVENTS } from './lib/analytics';
// Initialize Vue app
const app = createApp(App);
// Mount the app
app.mount('#app');
// Track page view using standardized analytics
track(EVENTS.VIEWED_PAGE, {
  page: 'home',
  referrer: document.referrer,
});
