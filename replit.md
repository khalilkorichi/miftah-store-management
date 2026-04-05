# Miftah Digital Store Management Dashboard

## Overview
A web-based admin dashboard for managing a digital products store. Features include:
- **Dashboard home page** with key stats, alerts, quick actions, and product health overview
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
- `src/App.jsx` — Root component with state management and hash-based tab routing
- `src/components/Dashboard.jsx` — Dashboard home page with stats, alerts, product health, quick actions
- `src/components/ProductTable.jsx` — Card-based product grid with supplier manager panel
- `src/components/` — UI components (pricing, bundles, modals, icons)
- `src/data/initialData.js` — Default configuration values
- `src/index.css` — Global styles (card layout, responsive grid, numeral settings)
- `public/` — Static assets

## Tab Navigation
Hash-based routing: `#dashboard` (default), `#products`, `#pricing`, `#bundles`, `#reports`, `#settings`

## UI Architecture
### Dashboard (Home)
- **Stats Cards:** Total products, suppliers, bundles, average margin
- **Alerts:** Products needing attention (unpriced, low margin, etc.)
- **Product Health Bar:** Visual status bar with good/warning/danger segments
- **Products Table:** Top products with margin indicators
- **Quick Actions:** Direct links to add product, create bundle, export report, etc.
- **Sidebar Widgets:** Pricing summary, best supplier

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
