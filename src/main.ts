import { createApp } from 'vue'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import App from './App.vue'
import './index.css'
import { initAnalytics, track } from './services/analytics'
import { basePath } from './utils/basePath'
import latestDate from './generated/latest-date.ts'

// Pages
import IndexPage from './pages/index.vue'
import DatePage from './pages/[date].vue'
import TrendsPage from './pages/trends.vue'

// Create router with correct base path for GitHub Pages
const base: string = `${basePath}/`

const router: Router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: '/', redirect: `/${latestDate}` },
    { path: '/index', component: IndexPage },
    { path: '/:date', component: DatePage },
    { path: '/trends', component: TrendsPage },
  ],
})

// Initialize analytics
initAnalytics()

// Track page views
router.afterEach((): void => {
  track('$pageview')
})

// Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app') 