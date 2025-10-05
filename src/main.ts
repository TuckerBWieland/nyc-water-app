import { createApp } from 'vue'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import App from './App.vue'
import './index.css'
import { initAnalytics, track } from './services/analytics'
import { basePath } from './utils/basePath'
import latestDate from './generated/latest-date.ts'

// Pages
import WelcomePage from './pages/welcome.vue'
import IndexPage from './pages/index.vue'
import DatePage from './pages/[date].vue'
import TrendsPage from './pages/trends.vue'

// Create router with correct base path for GitHub Pages
const base: string = `${basePath}/`

const router: Router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: '/', component: WelcomePage },
    { path: '/index', component: IndexPage },
    { path: '/map', redirect: `/${latestDate}` },
    { path: '/:date', component: DatePage },
    { path: '/trends', component: TrendsPage },
  ],
})

// Track page views
router.afterEach((): void => {
  track('$pageview')
})

// Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app')

// Prefetch the latest date's data in the background for instant map loading
// This happens after the app mounts so it doesn't block initial render
setTimeout(() => {
  const dataUrl = `${basePath}/data/${latestDate}/enriched.geojson`
  const metadataUrl = `${basePath}/data/${latestDate}/metadata.json`
  
  // Prefetch in parallel
  Promise.all([
    fetch(dataUrl).then(r => r.ok ? r.json() : null),
    fetch(metadataUrl).then(r => r.ok ? r.json() : null)
  ]).then(([geojson, metadata]) => {
    // Store in sessionStorage for instant retrieval
    if (geojson && metadata) {
      try {
        sessionStorage.setItem(
          `staticData-${latestDate}`,
          JSON.stringify({ geojson, metadata })
        )
      } catch (err) {
        console.warn('Failed to cache prefetched data:', err)
      }
    }
  }).catch(err => {
    console.warn('Failed to prefetch latest data:', err)
  })
}, 100)

// Defer analytics initialization until after the app is mounted
// This reduces initial bundle size and speeds up initial page load
setTimeout(() => {
  initAnalytics()
}, 1000) 