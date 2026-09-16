# Angular Bank - Datadog RUM Sample App

A full-stack banking sample application demonstrating Datadog Real User Monitoring (RUM) with iframe session stitching, user context tracking, and trace header injection.

## Architecture

| Component | Tech Stack | Port |
|-----------|-----------|------|
| **Frontend** | Angular 21, Angular Material, TypeScript | 4200 |
| **Backend** | Spring Boot 3.4, Java 17, H2 (in-memory) | 8080 |
| **Embedded App** | Vanilla JS, Vite, `@datadog/browser-rum` (npm) | 4201 |

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- Java 17+

### 1. Clone the repo

```bash
git clone <repo-url>
cd angular-bank-sample-app
```

### 2. Configure Datadog RUM

Replace the placeholders with your Datadog RUM application ID and client token in these three files:

| File | Used by |
|------|---------|
| `frontend/src/environments/environment.ts` | Angular app (dev) |
| `frontend/src/environments/environment.production.ts` | Angular app (prod) |
| `embedded-app/main.js` | Cross-origin iframe app |

```
applicationId: '<YOUR_APPLICATION_ID>'
clientToken: '<YOUR_CLIENT_TOKEN>'
```

You can find these values in **Datadog > Digital Experience > Add an Application**.

### 3. Start the app

```bash
./start.sh
```

This will install npm dependencies, start all three services, and wait for the backend before launching the frontend. Press `Ctrl+C` to stop everything.

### 4. Open the app

- **URL**: http://localhost:4200
- **Seed user**: `demo@angularbank.com` / `password123` (has 5 pre-loaded accounts)
- **New users**: Register via the app (start with 0 accounts)

### Running services individually

If you prefer to run each service in its own terminal:

```bash
# Terminal 1: Backend
cd backend && ./gradlew bootRun

# Terminal 2: Frontend
cd frontend && npm install && npm start

# Terminal 3: Embedded App
cd embedded-app && npm install && npm run dev
```

## Features

### Banking App
- **Dashboard** with account summary and recent transactions
- **Accounts** CRUD with transaction management
- **User authentication** (JWT) with login/register
- **Per-user data isolation** — each user only sees their own accounts and transactions

### Order Ticket Flow (modals + overlays, no route change)
A persistent trade rail on the right edge of every page opens a non-modal slide-in panel. The
page underneath stays interactive, the URL never changes, and a half-filled ticket survives
collapsing the panel and navigating between pages.

- **Trade rail** — `Stocks & ETFs`, `Positions` and `Watchlists` launchers; click to toggle, `Esc` to collapse
- **Order ticket** — account picker with buying power, Buy/Sell, symbol search with live quote
  (last, bid/ask with sizes, volume, open, day and 52-week ranges), order price type
  (Market / Limit / Stop / Trailing stop limit), linked shares ⇄ dollar quantity fields with
  fractional support, `Buy max`, and Day / Custom date expiry
- **Review modal** — full order breakdown (estimated value, commission, estimated total, buying
  power after) and a confirmation state with a confirmation number
- **Positions panel** — holdings grouped by funding account (name + number + subtotal), since
  the same symbol can be held in more than one account. Each holding is marked to market off
  the live feed: quantity, average cost, market value and unrealized gain/loss, with
  per-holding `Buy more` / `Sell` hand-off back into the ticket. The ticket shows the holding for the selected account and offers
  `Sell max`; overselling is blocked in the UI and rejected by the API.
- **Settlement** — `POST /api/orders` settles in a single transaction: it moves cash on the
  funding account (buy debits, sell credits), records the settlement transaction and updates
  the holding, blending the average cost on a buy and closing the position when it is sold to
  zero. The dashboard, accounts list, account detail page and positions panel all update live
  behind the overlay via `AccountApiService.dataVersion`.
- **Watchlist hand-off** — picking a symbol from the watchlist loads it into the ticket in place
- **Market data** — `MarketDataService` is a simulated feed: prices random-walk every 2s so the
  quote board, spreads and volume tick like a live tape. No external provider is required.
- **RUM custom actions** — `trade_panel_opened`, `trade_symbol_selected`, `trade_order_reviewed`
  and `trade_order_placed` are sent via `datadogRum.addAction()`

The seed user starts with three holdings (NVDA, AAPL, VOO) so the panel has content before the
first trade. Settlement transactions carry a `symbol` and cannot be deleted from the account
detail page — reverse them by placing an offsetting order.

### Quotes & Research Overlay (Q&R widget)
A page-level overlay that opens over whatever you were looking at, with its own scrim and no
route change. Two views are implemented for demonstration: **Analyst ratings** and **News**.

- **Entry points** — the `Search name or symbol` field in the toolbar, the research icon on any
  watchlist row, and the research icon on the trade ticket's quote card
- **Header** — ticker monogram, symbol, company name, `Fractional` badge, its own symbol search
  for switching securities in place, live price with change chip and `As of` time
- **Analyst ratings** — consensus recommendation with mean score on the 1-5 scale, rating
  distribution bars, third-party star rating, 12-month price target low/average/high with a
  scale showing the last trade against the average target, and a recent analyst actions table
- **News** — `7 days` / `30 days` / `All` filtering over a two-column story grid with source and
  timestamp. Category tiles stand in for wire-service thumbnails, which are not fetched offline.
- **Article detail** — clicking a story replaces the list in place with the article: an
  `All company news` back link, headline, hero tile, publication line and body copy. Tickers
  mentioned in the copy are links that load that symbol's research in the same overlay. Body
  text is generated per article id, so a story always reads the same.
- **Trade button** — opens the `Trade Stocks & ETFs` ticket over the page with the symbol
  already loaded. The research overlay slides aside instead of closing, so both stay usable.
- **Data** — `ResearchDataService` is a simulated research feed. Figures are derived from a
  per-symbol seed, so they stay stable across renders while differing between symbols.
- **RUM custom actions** — `research_widget_opened`, `research_view_selected`,
  `research_article_opened` and `research_trade_clicked`

### Datadog RUM
- **RUM SDK** integrated in both parent app and iframes via npm (`@datadog/browser-rum`)
- **Iframe Demo** (Case A) — Same-origin iframe loading an Angular route. RUM initializes automatically since both parent and iframe run the same Angular app.
- **Cross-Origin Iframe** (Case B) — Separate app on a different port. Both apps use `trackSessionAcrossSubdomains: true` to share the RUM session cookie across the origin boundary.
- **RUM + Traces** — `allowedTracingUrls` configured to inject `tracecontext` and `datadog` trace headers into API requests
- **Session Replay** — `defaultPrivacyLevel: 'mask-user-input'` masks form inputs in replays
- **User context** — `datadogRum.setUser()` called on login with `id`, `name`, `email`, and custom `user_type` attribute. `clearUser()` called on logout.
- **Dynamic `user_type`** — Set to `'high_net_worth'` when total balance >= $100K, otherwise `'low_net_worth'`. Updates automatically as balance changes.

## Project Structure

```
.
├── backend/                        # Spring Boot REST API
│   └── src/main/java/com/angularbank/api/
│       ├── config/                 # Security, JWT, error handling
│       ├── controller/             # Auth, Account, Transaction endpoints
│       ├── dto/                    # Request/response DTOs with validation
│       ├── model/                  # JPA entities (User, Account, Transaction, Position)
│       ├── repository/             # Spring Data JPA repositories
│       └── service/                # Business logic with per-user scoping
├── frontend/                       # Angular SPA
│   └── src/
│       ├── main.ts                 # RUM initialization
│       ├── environments/           # Dev/prod Datadog config
│       └── app/
│           ├── components/         # Shared components (dialogs, account summary, trade rail /
│           │                       #   ticket / positions / watchlist / review modal,
│           │                       #   Q&R research overlay + analyst ratings / news views)
│           ├── guards/             # Auth guard
│           ├── interceptors/       # Auth token + error handling interceptors
│           ├── layouts/            # Main layout (sidebar) + embedded layout
│           ├── models/             # TypeScript interfaces
│           ├── pages/              # Dashboard, Accounts, Login, Register, Iframe pages
│           ├── pipes/              # SafeUrl pipe
│           ├── services/           # Account API + Auth services
│           └── utils/              # Shared utilities
├── embedded-app/                   # Standalone app for cross-origin iframe demo
│   ├── index.html                  # UI with filter, sort, and RUM action buttons
│   ├── main.js                     # RUM init via npm + app logic
│   └── package.json
├── start.sh                        # Installs deps + starts all 3 services
└── README.md
```

## Datadog RUM Configuration

Both apps initialize RUM with matching configuration:

```javascript
datadogRum.init({
  applicationId: '...',
  clientToken: '...',
  trackSessionAcrossSubdomains: true,
  defaultPrivacyLevel: 'mask-user-input',
  allowedTracingUrls: [
    { match: '...', propagatorTypes: ['tracecontext', 'datadog'] }
  ],
});
```

### User Context

On login, the app sets user info on the RUM session:

```javascript
datadogRum.setUser({
  id: '1',
  name: 'Demo User',
  email: 'demo@angularbank.com',
  user_type: 'low_net_worth'  // or 'high_net_worth' when balance >= $100K
});
```

The `user_type` attribute updates dynamically as the user's total account balance changes.

### Iframe Session Stitching

- **Case A (Same Origin)**: The "Iframe Demo" tab loads `/embedded/account-summary` from the same Angular app. `main.ts` runs again inside the iframe, so RUM initializes identically. Cookies are shared automatically.

- **Case B (Cross-Origin)**: The "Cross-Origin Iframe" tab embeds a separate app from `http://localhost:4201`. Both apps use `trackSessionAcrossSubdomains: true` to share the session cookie across the origin boundary. The JWT token is passed via URL query parameter for API authentication.

## API Endpoints

All endpoints except `/api/auth/**` require a JWT token in the `Authorization: Bearer` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/accounts` | List current user's accounts |
| GET | `/api/accounts/summary` | Current user's total balance + count |
| GET | `/api/accounts/:id` | Single account (must be owned by user) |
| POST | `/api/accounts` | Create account for current user |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account + its transactions |
| GET | `/api/transactions` | Current user's recent transactions |
| GET | `/api/transactions/account/:id` | Transactions by account (ownership verified) |
| POST | `/api/transactions` | Create transaction |
| DELETE | `/api/transactions/:id` | Delete transaction (rejects trade settlements) |
| GET | `/api/positions` | Current user's holdings across all accounts |
| GET | `/api/positions/account/:id` | Holdings for one account (ownership verified) |
| POST | `/api/orders` | Place an equity order: settles cash + updates the holding |
