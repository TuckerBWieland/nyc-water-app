# Application Overview

This document mirrors the repository structure so new contributors can quickly understand where things live.

## Directories

- **public/** – Static assets and processed water-quality datasets.
- **scripts/** – Node utilities for data enrichment, tide lookups and deployment helpers.
- **src/** – Vue application source code
  - **components/** – UI components and map features
  - **composables/** – Reusable Composition API logic
  - **pages/** – Route components, including the dynamic `[date].vue`
  - **services/** – External integrations such as analytics
  - **stores/** – Small reactive state modules
- **tests/** – Jest unit tests covering components and composables.

## Commands

Use the standard npm scripts:

```bash
npm run dev      # start development server
npm run build    # production build
npm run preview  # serve built files locally
npm run test     # execute Jest test suite
npm run enrich   # convert CSV data to enriched GeoJSON
```

Deployment to GitHub Pages is handled by `npm run predeploy && npm run deploy`.
