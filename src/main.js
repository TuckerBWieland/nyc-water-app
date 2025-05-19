import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './index.css';

// Pages
import IndexPage from './pages/index.vue';
import DatePage from './pages/[date].vue';

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/:date', component: DatePage },
  ],
});

// Create and mount the app
const app = createApp(App);
app.use(router);
app.mount('#app');
