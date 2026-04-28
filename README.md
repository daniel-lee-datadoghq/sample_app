# Angular Bank - Datadog RUM Sample App

A full-stack banking sample application demonstrating Datadog Real User Monitoring (RUM) with iframe session stitching, user context tracking, and trace header injection.

## Architecture

| Component | Tech Stack | Port |
|-----------|-----------|------|
| **Frontend** | Angular 21, Angular Material, TypeScript | 4200 |
| **Backend** | Spring Boot 3.4, Java 17, H2 (in-memory) | 8080 |
| **Embedded App** | Vanilla JS, Vite, `@datadog/browser-rum` (npm) | 4201 |

## Features

### Banking App
- **Dashboard** with account summary and recent transactions
- **Accounts** CRUD with transaction management
- **User authentication** (JWT) with login/register
- **Per-user data isolation** — each user only sees their own accounts and transactions

### Datadog RUM
- **RUM SDK** integrated in both parent app and iframes via npm (`@datadog/browser-rum`)
- **Iframe Demo** (Case A) — Same-origin iframe loading an Angular route. RUM initializes automatically since both parent and iframe run the same Angular app.
- **Cross-Origin Iframe** (Case B) — Separate app on a different port. Both apps use `trackSessionAcrossSubdomains: true` to share the RUM session cookie across the origin boundary.
- **RUM + Traces** — `allowedTracingUrls` configured to inject `tracecontext` and `datadog` trace headers into API requests
- **Session Replay** — `defaultPrivacyLevel: 'mask-user-input'` masks form inputs in replays
- **User context** — `datadogRum.setUser()` called on login with `id`, `name`, `email`, and custom `user_type` attribute. `clearUser()` called on logout.
- **Dynamic `user_type`** — Set to `'high_net_worth'` when total balance >= $100K, otherwise `'low_net_worth'`. Updates automatically as balance changes.

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- Java 17+

### Install Dependencies

```bash
cd frontend && npm install
cd ../embedded-app && npm install
```

### Run All Services

```bash
./start.sh
```

This starts all three services. Press `Ctrl+C` to stop.

Or run individually:

```bash
# Terminal 1: Backend
cd backend && ./gradlew bootRun

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: Embedded App
cd embedded-app && npm run dev
```

### Access the App

- **App**: http://localhost:4200
- **Seed user**: `demo@angularbank.com` / `password123` (has 5 pre-loaded accounts)
- **New users**: Register via the app (start with 0 accounts)

## Project Structure

```
.
├── backend/                        # Spring Boot REST API
│   └── src/main/java/com/angularbank/api/
│       ├── config/                 # Security, JWT, error handling
│       ├── controller/             # Auth, Account, Transaction endpoints
│       ├── dto/                    # Request/response DTOs with validation
│       ├── model/                  # JPA entities (User, Account, Transaction)
│       ├── repository/             # Spring Data JPA repositories
│       └── service/                # Business logic with per-user scoping
├── frontend/                       # Angular SPA
│   └── src/
│       ├── main.ts                 # RUM initialization
│       ├── environments/           # Dev/prod Datadog config
│       └── app/
│           ├── components/         # Shared components (dialogs, account summary)
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
├── start.sh                        # Starts all 3 services
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
| DELETE | `/api/transactions/:id` | Delete transaction |
