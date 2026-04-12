# NMIVA MVP (PWA Vehicle Maintenance Tracker)

Mobile-first PWA for personal vehicle maintenance and expense tracking with offline-first IndexedDB storage, sync to PostgreSQL, and VAPID push notifications.

## Stack

- Backend: Spring Boot 4, Java 21, Spring Security (JWT), Flyway, PostgreSQL
- Frontend: React + Vite + TypeScript, React Router
- Offline: IndexedDB + sync queue
- PWA: Service Worker (Workbox via `vite-plugin-pwa`)
- Background processing: Web Worker (sync queue processing)
- Push: Web Push protocol with VAPID authentication

## Project Structure

- `backend/` Spring Boot API
- `frontend/` React PWA app
- `db.yml` PostgreSQL container definition

## Quick Start

1. Start PostgreSQL:

```bash
docker compose -f db.yml up -d
```

2. Backend env:

```bash
cp backend/.env.example backend/.env
```

3. Frontend env:

```bash
cp frontend/.env.example frontend/.env
```

4. Run backend:

```bash
./mvnw -pl backend spring-boot:run
```

5. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8080`.

## Demo Seed Data

Flyway migration `V2__seed_demo_data.sql` inserts:

- user: `demo@nmiva.local`
- password: `password`
- two vehicles
- entries for refuel/service/expense/reminder
- one upcoming + one overdue reminder

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

JWT bearer token required for all protected endpoints.

## Main APIs

- Vehicles: `GET/POST /api/vehicles`, `PUT/DELETE /api/vehicles/{id}`
- Entries: `GET/POST /api/vehicles/{vehicleId}/entries`, `PUT/DELETE /api/entries/{id}`
- Dashboard: `GET /api/vehicles/{vehicleId}/dashboard`
- Reminders: `GET /api/reminders/upcoming`, `GET /api/reminders/overdue`
- Push: `POST /api/push/subscribe`, `POST /api/push/unsubscribe`, `POST /api/push/test`
- Settings: `GET/PUT /api/settings`
- Sync: `POST /api/sync`

## Offline Sync Model

- UI reads from IndexedDB (`vehicles`, `entries` stores)
- Writes always go to IndexedDB first
- Mutations are queued in `queue` store (`create/update/delete`)
- Web Worker processes queue and calls `POST /api/sync`
- On sync success:
  - queue items are acknowledged/removed
  - server IDs are mapped back to local records
  - server delta (`vehicles`, `entries`) is merged into IndexedDB
- Conflict strategy: **last write wins by `lastModifiedAt`**
  - if server has newer data: ack is `conflict`, client then applies returned server state

## Web Worker Usage

- Worker file: `frontend/src/workers/syncWorker.ts`
- Responsibility: process sync queue and apply sync responses without blocking main UI thread
- Communication:
  - Main thread sends `{ type: 'SYNC', token, apiBaseUrl }`
  - Worker returns `{ type: 'SYNC_RESULT', result }`

## Service Worker / PWA

- `vite-plugin-pwa` with `injectManifest`
- Service worker file: `frontend/src/sw.ts`
- Includes:
  - app-shell precache
  - runtime caching for assets/API
  - offline fallback (`/offline.html`)
  - push `notificationclick` handling

Install prompt works on supported browsers.

## Push Notifications (VAPID)

### 1. Generate keys

Using Node web-push CLI:

```bash
npx web-push generate-vapid-keys
```

### 2. Configure backend

Set in `backend/.env`:

- `APP_PUSH_PUBLIC_KEY`
- `APP_PUSH_PRIVATE_KEY`
- `APP_PUSH_SUBJECT` (e.g. `mailto:admin@example.com`)

### 3. Configure frontend

Set in `frontend/.env`:

- `VITE_VAPID_PUBLIC_KEY` (must match backend public key)

### 4. Subscribe flow

1. Login
2. Open Settings
3. Click Subscribe
4. Browser permission granted
5. Subscription is stored via `POST /api/push/subscribe`

### 5. Test push

In Settings click **Send test push**, backend sends VAPID-authenticated push via `/api/push/test`.

### Reminder push scheduling

- Scheduled backend job (`ReminderNotificationScheduler`) finds due reminders and sends push notifications.
- Cron is configurable with `APP_REMINDER_CRON`.

## Fuel Consumption Logic

Implemented in `FuelConsumptionService`:

- Requires at least two full-tank refuels with odometer values
- Interval formula:
  - `L/100km = current_refuel_liters / (current_odometer - previous_odometer) * 100`
- Outputs:
  - latest interval consumption
  - average of all valid intervals

## Tests

Backend tests included:

- fuel consumption calculation
- reminder due logic
- sync conflict handling
- push subscription update flow

Run:

```bash
./mvnw -pl backend test
```

Frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```

## Notes / MVP Simplifications

- Single `entries` table with nullable type-specific fields
- Vehicle delete is soft delete for sync safety
- Entry delete is soft delete
- No OAuth/social login
- No non-MVP modules (VIN/OCR/maps/AI/etc.)
