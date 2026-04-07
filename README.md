# Real-Time Trading Dashboard

A full-stack real-time trading dashboard with live ticker prices, interactive charts, and price alerting — built with Node.js/TypeScript (backend) and React/TypeScript (frontend).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Running Locally](#running-locally-step-by-step)
6. [Running with Docker](#running-with-docker-compose)
7. [Running Tests](#running-tests)
8. [Manual API Testing](#manual-api-testing)
9. [WebSocket Testing](#websocket-testing)
10. [UI Testing Checklist](#ui-testing-checklist)
11. [Troubleshooting](#troubleshooting)
12. [Assumptions & Trade-offs](#assumptions--trade-offs)
13. [Bonus Features](#bonus-features-implemented)
14. [API Reference](#api-reference)

---

## Project Overview

The dashboard simulates a live trading terminal. A Node.js backend generates realistic price movements for 10 financial instruments every second and streams them to connected browsers via WebSocket. The React frontend renders a live-updating ticker sidebar, an interactive area chart with multiple time ranges, and a price alert panel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js 20 + TypeScript |
| Backend framework | Express 4 |
| Real-time transport | WebSocket (`ws` library) |
| Frontend framework | React 18 + TypeScript |
| Frontend build tool | Vite 5 |
| Charting | Recharts 2 |
| Testing | Jest + ts-jest + Supertest |
| Containerisation | Docker + Docker Compose |
| Production web server | nginx (reverse proxy + SPA host) |

---

## Architecture

```
real-time-trading/
├── backend/                        # Node.js microservice
│   ├── src/
│   │   ├── index.ts                # Entry point — HTTP + WebSocket on port 3001
│   │   ├── types/index.ts          # Shared TypeScript interfaces
│   │   ├── services/
│   │   │   ├── MarketDataService.ts     # Mean-reverting price simulation, EventEmitter
│   │   │   └── HistoricalDataService.ts # Mock OHLCV candles + 60s in-memory cache
│   │   ├── routes/index.ts         # Express REST router
│   │   └── websocket/
│   │       └── WebSocketHandler.ts # Per-client subscriptions, alert triggers
│   └── tests/
│       ├── MarketDataService.test.ts
│       ├── HistoricalDataService.test.ts
│       └── routes.test.ts
│
├── frontend/                       # React SPA
│   ├── index.html                  # Vite entry point (must be at project root)
│   ├── src/
│   │   ├── index.tsx               # ReactDOM.createRoot
│   │   ├── App.tsx                 # Root — state orchestration, WS message handling
│   │   ├── types/index.ts          # Shared TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Header.tsx          # WS connection status pill, instrument count
│   │   │   ├── TickerList.tsx      # Scrollable left sidebar
│   │   │   ├── TickerCard.tsx      # Individual ticker with live price + badge
│   │   │   ├── PriceChart.tsx      # Recharts AreaChart, time-range switcher, live feed
│   │   │   └── AlertPanel.tsx      # Add/remove above-below alerts, triggered history
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts     # Auto-reconnecting WS client hook
│   │   │   └── usePriceAlerts.ts   # Alert state machine + threshold checker
│   │   └── styles/index.css        # Dark terminal theme (CSS custom properties)
│   ├── nginx.conf                  # Production: proxies /api and /ws to backend
│   ├── vite.config.ts              # Dev proxy + host binding
│   └── Dockerfile                  # Multi-stage: Vite build → nginx serve
│
├── docker-compose.yml              # Wires backend + frontend with health check
├── .dockerignore
└── README.md
```

### Data Flow

```
MarketDataService
  └─ random-walk tick every 1 000 ms
        │  EventEmitter 'update'
        ▼
WebSocketHandler
  ├─ filters updates per client subscription
  ├─ checks server-side price alerts
  └─ broadcasts JSON to all open WS connections
        │
        ▼  ws://host/ws
useWebSocket hook (React)
  ├─ on 'snapshot'      → seed all ticker prices
  └─ on 'price_update'  → update Map<symbol, PriceUpdate>
        │
        ├─► TickerCard    (live price + change badge)
        ├─► PriceChart    (appends live point in 1D mode)
        └─► usePriceAlerts (checks thresholds client-side)

REST API (Express — port 3001)
  GET /api/health
  GET /api/tickers
  GET /api/tickers/:symbol
  GET /api/tickers/:symbol/history?range=1D|1W|1M|3M
  GET /api/snapshot
```

### Instruments Tracked

| Symbol   | Name                | Exchange | Base Price |
|----------|---------------------|----------|-----------|
| AAPL     | Apple Inc.          | NASDAQ   | $178.50   |
| TSLA     | Tesla Inc.          | NASDAQ   | $245.00   |
| GOOGL    | Alphabet Inc.       | NASDAQ   | $141.80   |
| MSFT     | Microsoft Corp.     | NASDAQ   | $415.20   |
| AMZN     | Amazon.com Inc.     | NASDAQ   | $185.60   |
| BTC-USD  | Bitcoin / USD       | CRYPTO   | $67,500   |
| ETH-USD  | Ethereum / USD      | CRYPTO   | $3,540    |
| NVDA     | NVIDIA Corp.        | NASDAQ   | $875.00   |
| META     | Meta Platforms Inc. | NASDAQ   | $505.00   |
| SPY      | SPDR S&P 500 ETF   | NYSE     | $520.00   |

---

## Prerequisites

### Local development

- **Node.js 20+** — verify with `node -v`
- **npm 9+** — verify with `npm -v`

### Docker

- **Docker Desktop** (includes Docker Compose v2)
- Verify with `docker compose version`

---

## Running Locally (Step-by-Step)

> **Important:** Start the backend first, then the frontend. Use **two separate terminal windows** — do not run them as background processes or they may conflict.

### Step 1 — Install and start the backend

Open **Terminal 1**:

```bash
cd real-time-trading/backend
npm install
npm run dev
```

You should see:

```
[server] HTTP  → http://localhost:3001/api
[server] WS    → ws://localhost:3001/ws
```

Leave this terminal running.

### Step 2 — Install and start the frontend

Open **Terminal 2**:

```bash
cd real-time-trading/frontend
npm install
npm run dev
```

You should see:

```
VITE v5.x  ready in 400ms

➜  Local:   http://localhost:3000/
➜  Network: http://10.x.x.x:3000/
```

Leave this terminal running.

### Step 3 — Open the dashboard

Open your browser and go to:

```
http://127.0.0.1:3000
```

> **Windows note:** Use `http://127.0.0.1:3000` instead of `http://localhost:3000`.
> On Windows, `localhost` may resolve to IPv6 (`::1`) while Vite binds to IPv4 (`0.0.0.0`), causing a connection failure. Using the explicit IPv4 address `127.0.0.1` bypasses this.

---

## Running with Docker Compose

```bash
cd real-time-trading
docker compose up --build
```

Once built and started:

| URL | Description |
|-----|-------------|
| `http://localhost` | Dashboard UI |
| `http://localhost/api/health` | Backend health check |
| `http://localhost/api/tickers` | Ticker list |

To stop:

```bash
docker compose down
```

---

## Running Tests

From the `backend` directory:

```bash
cd backend
npm test
```

Expected output:

```
PASS tests/HistoricalDataService.test.ts
PASS tests/routes.test.ts
PASS tests/MarketDataService.test.ts

Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total
```

With coverage report:

```bash
npm run test:coverage
```

### What is tested

| Test file | Coverage |
|-----------|----------|
| `MarketDataService.test.ts` | Ticker list integrity, snapshot shape (price > 0, high ≥ price ≥ low), event emission on `start()`, `stop()` halts events, double `start()` does not double-fire |
| `HistoricalDataService.test.ts` | Returns `null` for unknown symbol, correct candle count per range, valid OHLCV shape, ascending timestamps, crypto tickers, cache hit returns same reference, `clearCache()` per symbol and global |
| `routes.test.ts` | `GET /health` → 200, `GET /tickers` → array, `GET /tickers/:symbol` → price object + case-insensitive, 404 for unknown symbol, history with all valid ranges, 400 for invalid range, 404 for unknown symbol history, `/snapshot` → array |

---

## Manual API Testing

With both servers running, test endpoints directly from a terminal:

```bash
# Health check
curl http://localhost:3001/api/health

# List all tickers
curl http://localhost:3001/api/tickers

# Live price for one ticker
curl http://localhost:3001/api/tickers/AAPL
curl http://localhost:3001/api/tickers/BTC-USD

# Case-insensitive — also works
curl http://localhost:3001/api/tickers/aapl

# Historical data — range options: 1D, 1W, 1M, 3M
curl "http://localhost:3001/api/tickers/TSLA/history?range=1W"

# Current prices for all tickers at once
curl http://localhost:3001/api/snapshot

# Error cases
curl http://localhost:3001/api/tickers/INVALID          # → 404
curl "http://localhost:3001/api/tickers/AAPL/history?range=BAD"  # → 400
```

---

## WebSocket Testing

Install `wscat` (one-time):

```bash
npm install -g wscat
```

Connect to the live feed:

```bash
wscat -c ws://localhost:3001/ws
```

On connection you immediately receive a `snapshot` message with all current prices. Then send:

**Subscribe to specific tickers** (receive updates only for these):
```json
{"type":"subscribe","symbols":["AAPL","BTC-USD"]}
```

**Unsubscribe:**
```json
{"type":"unsubscribe","symbols":["AAPL"]}
```

**Invalid symbol** (server ignores unknown symbols silently):
```json
{"type":"subscribe","symbols":["FAKE"]}
```

**Malformed JSON** (server responds with error):
```
not-valid-json
```

You will see `price_update` messages streaming every ~1 second containing an array of price objects for your subscribed symbols.

---

## UI Testing Checklist

After opening `http://127.0.0.1:3000`:

- [ ] **Connection status** — Header shows a green "Live" pill within 1–2 seconds
- [ ] **Ticker sidebar** — Left panel lists all 10 instruments with live prices updating every second (green = up, red = down)
- [ ] **Chart loads** — AAPL chart is selected by default; area chart renders with historical data
- [ ] **Switch tickers** — Click any ticker card; chart title and price update to that instrument
- [ ] **Time ranges** — Click `1W`, `1M`, `3M` on the chart; chart data reloads each time
- [ ] **Live chart feed** — In `1D` mode, new data points are appended in real time as prices tick
- [ ] **Price stats row** — Open / High / Low / Volume shown below the chart and update live
- [ ] **Set an alert** — In the Alert Panel (right), select `BTC-USD`, type `Above`, enter a price just below the current BTC price, click `+ Set` — it should trigger within seconds
- [ ] **Triggered alert** — Appears in yellow "Triggered" section; click ✕ to dismiss
- [ ] **Responsiveness** — Resize the browser window to mobile width; layout stacks vertically

---

## Troubleshooting

### `http://localhost:3000` shows "page not found"

**Cause:** On Windows, `localhost` resolves to IPv6 (`::1`) but Vite binds to IPv4 (`0.0.0.0`).

**Fix:** Use the explicit IPv4 address instead:
```
http://127.0.0.1:3000
```

---

### `Error: listen EADDRINUSE: address already in use :::3001`

**Cause:** A previous Node process is still holding the port.

**Fix — find and kill the process:**

```bash
# Find the PID
netstat -ano | grep ":3001"

# Kill it (replace 12345 with the actual PID)
# Mac/Linux:
kill -9 12345

# Windows (run in cmd or PowerShell):
taskkill /PID 12345 /F
```

Or kill all Node processes at once (Windows):

```bash
cmd //c "taskkill /IM node.exe /F"
```

---

### Frontend starts on port 3001 instead of 3000

**Cause:** Port 3000 is occupied so Vite picks the next free port — which may collide with the backend.

**Fix:** Ensure nothing is using port 3000 before starting the frontend:

```bash
netstat -ano | grep ":3000"
# Kill the PID shown, then restart the frontend
```

---

### Chart shows "Failed to load historical data"

**Cause:** The frontend cannot reach the backend REST API.

**Fix:**
1. Confirm the backend is running: `curl http://localhost:3001/api/health`
2. If the backend is on a different port, update the proxy in [frontend/vite.config.ts](frontend/vite.config.ts)

---

### WebSocket status stays "Connecting…" forever

**Cause:** The backend is not running or the WebSocket path is wrong.

**Fix:**
1. Start the backend (`npm run dev` in the `backend` directory)
2. Confirm it is listening: `curl http://localhost:3001/api/health`
3. The WS endpoint is `ws://localhost:3001/ws` — the Vite proxy forwards `/ws` automatically in dev mode

---

### `index.html` not found / blank page in Vite

**Cause:** Vite requires `index.html` at the **project root** (`frontend/index.html`), not inside `public/`.

**Fix:** Ensure `index.html` exists at `frontend/index.html`. The `public/` folder in Vite is for static assets only (images, fonts, etc.).

---

## Assumptions & Trade-offs

- **Mock data only** — prices are simulated using a mean-reverting random walk with momentum. The algorithm keeps prices from drifting too far from their configured base price while still producing realistic-looking chart movement. No real market data feed is used.
- **No persistence** — historical OHLCV data is generated in-memory on first request and cached for 60 seconds per `symbol:range` pair. Restarting the backend regenerates all data. A production system would use a time-series database (e.g. TimescaleDB, InfluxDB).
- **Single WebSocket connection per browser tab** — the frontend opens one WS connection that receives updates for all tickers. Subscription filtering happens server-side so only subscribed symbols are forwarded per client. With no subscriptions set, all symbols are sent.
- **Client-side alerts** — price thresholds are evaluated in the browser (`usePriceAlerts` hook) on every incoming price tick. The backend `WebSocketHandler` also includes server-side alert infrastructure (the `alerts` map per client) that is ready to be wired up to a client message.
- **No authentication** — JWT auth was omitted to stay within scope. The Express CORS config and a middleware slot in `index.ts` are in place to add it without restructuring.
- **TypeScript strict mode** — both backend and frontend run with `strict: true`. All types are explicit; no `any` casts in business logic.

---

## Bonus Features Implemented

| Feature | Implementation |
|---------|----------------|
| **In-memory caching** | `HistoricalDataService` — 60s TTL cache keyed by `symbol:range`. Cache hit returns same object reference. `clearCache(symbol?)` for targeted or full invalidation. |
| **Price threshold alerting** | `AlertPanel` UI + `usePriceAlerts` hook — users set above/below thresholds; triggered alerts move to a separate list with the hit price and time. |
| **WebSocket auto-reconnect** | `useWebSocket` hook — automatically reconnects after 2 seconds on any close/error event. Status badge in header shows `Connecting…` → `Live`. |
| **Server-side alert infrastructure** | `WebSocketHandler` — each client state holds an `alerts` Map; when a price crosses a threshold the server pushes an `alert_triggered` message. |
| **Responsive layout** | CSS Grid with `@media` breakpoints — at ≤768px the layout stacks to a single column with a horizontal scrolling ticker strip. |
| **Live chart append** | `PriceChart` — in `1D` mode each incoming WS price update is appended as a new chart point, so the right edge of the chart moves in real time. |

---

## API Reference

### REST Endpoints

| Method | Path | Query params | Response |
|--------|------|-------------|----------|
| `GET` | `/api/health` | — | `{ status: "ok", timestamp: number }` |
| `GET` | `/api/tickers` | — | `{ tickers: Ticker[] }` |
| `GET` | `/api/tickers/:symbol` | — | `PriceUpdate` or 404 |
| `GET` | `/api/tickers/:symbol/history` | `range=1D\|1W\|1M\|3M` | `{ symbol, range, data: HistoricalDataPoint[] }` or 400/404 |
| `GET` | `/api/snapshot` | — | `{ prices: PriceUpdate[] }` |

#### PriceUpdate shape

```json
{
  "symbol": "AAPL",
  "price": 179.42,
  "open": 178.50,
  "change": 0.92,
  "changePercent": 0.515,
  "high": 180.11,
  "low": 177.83,
  "volume": 3241500,
  "timestamp": 1712345678901
}
```

#### HistoricalDataPoint shape

```json
{
  "timestamp": 1712345678901,
  "open": 178.10,
  "high": 179.55,
  "low": 177.60,
  "close": 179.20,
  "volume": 1023400
}
```

### WebSocket (`ws://host/ws`)

**Client → Server messages**

```json
{ "type": "subscribe",   "symbols": ["AAPL", "BTC-USD"] }
{ "type": "unsubscribe", "symbols": ["AAPL"] }
```

**Server → Client messages**

```json
{ "type": "snapshot",     "data": [ ...PriceUpdate ] }
{ "type": "price_update", "data": [ ...PriceUpdate ] }
{ "type": "alert_triggered", "symbol": "AAPL", "threshold": 180, "message": "AAPL crossed above 180", "data": PriceUpdate }
{ "type": "error", "message": "Invalid JSON message" }
```

**Connection lifecycle:**
1. Client connects → server immediately sends `snapshot` with all current prices
2. Client sends `subscribe` → server filters subsequent `price_update` batches to only include subscribed symbols
3. Client sends `unsubscribe` → symbol removed from filter
4. No subscriptions set → client receives all symbols in every `price_update`
5. Connection drops → `useWebSocket` hook reconnects after 2 seconds automatically
