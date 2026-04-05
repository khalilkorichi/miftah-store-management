# Miftah Digital Store Management Dashboard

## Overview
A web-based admin dashboard for managing a digital products store. Features include:
- Product and supplier management
- Pricing strategies and bundle management
- Exchange rate tracking
- Reports with PDF/Excel export
- Arabic-language UI

## Tech Stack
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Package Manager:** npm
- **Charts:** Recharts
- **Excel:** SheetJS (xlsx)
- **PDF:** jsPDF + jspdf-autotable

## Data Persistence
All state is saved to browser `localStorage` under the key `miftah_store_data`. No backend or database required.

## Project Structure
- `src/App.jsx` — Root component with state management and tab routing
- `src/components/` — UI components (pricing, bundles, modals, icons)
- `src/data/initialData.js` — Default configuration values
- `src/index.css` — Global styles
- `public/` — Static assets

## Development
```bash
npm install
npm run dev   # Runs on http://localhost:5000
```

## Deployment
Configured as a static site:
- Build: `npm run build`
- Output directory: `dist`
