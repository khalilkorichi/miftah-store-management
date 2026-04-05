# Miftah Digital Store Management Dashboard

## Overview
A web-based admin dashboard for managing a digital products store. Features include:
- Product and supplier management with card-based UI
- Pricing strategies and bundle management
- Exchange rate tracking (USD/SAR)
- Reports with PDF/Excel export
- Arabic-language UI (RTL layout)
- Western Arabic numerals (0-9) enforced throughout

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
- `src/components/ProductTable.jsx` — Card-based product grid with supplier manager panel
- `src/components/` — UI components (pricing, bundles, modals, icons)
- `src/data/initialData.js` — Default configuration values
- `src/index.css` — Global styles (card layout, responsive grid, numeral settings)
- `public/` — Static assets

## UI Architecture
### Products & Prices Page
- **Card Grid Layout:** Products displayed as responsive cards (1 col mobile, 2 tablet, 3+ desktop)
- **Product Cards:** Show product name, account type, activation methods, plan summaries with best prices
- **Expandable Plans:** Click "عرض التفاصيل" to see full supplier price breakdowns per plan
- **Supplier Manager Panel:** Collapsible panel at top for managing suppliers and their contact info
- **All numbers use Western Arabic numerals (0-9)** via CSS font-feature-settings and `toLocaleString('en-US')`

## Development
```bash
npm install
npm run dev   # Runs on http://localhost:5000
```

## Deployment
Configured as a static site:
- Build: `npm run build`
- Output directory: `dist`
