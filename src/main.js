import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './index.css';
import { initAnalytics, track } from './services/analytics';
import { basePath } from './utils/basePath';

// Pages
import IndexPage from './pages/index.vue';
import DatePage from './pages/[date].vue';
import TrendsPage from './pages/trends.vue';

// Create router with correct base path for GitHub Pages
const base = `${basePath}/`;
const router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/:date', component: DatePage },
    { path: '/trends', component: TrendsPage },
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
