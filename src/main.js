import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './index.css';
import { initAnalytics, track } from './services/analytics';

// Pages
import IndexPage from './pages/index.vue';
import DatePage from './pages/[date].vue';

// Create router with correct base path for GitHub Pages
const base = import.meta.env.MODE === 'production' ? '/nyc-water-app/' : '/';
const router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/:date', component: DatePage },
  ],
});

initAnalytics();
router.afterEach(() => {
  track('$pageview');
});

// Create and mount the app
const app = createApp(App);
app.use(router);
app.mount('#app');
