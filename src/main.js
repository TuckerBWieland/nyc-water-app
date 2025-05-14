import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
import { posthogClient } from './posthog';

// Initialize Vue app
const app = createApp(App);

// Mount the app
app.mount('#app');

// In development, this won't actually send events to PostHog
// In production, it will capture the page view
posthogClient.capture('page_view', {
  page: 'home'
});
