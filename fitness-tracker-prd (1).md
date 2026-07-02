# Vitalis — Personalized Health & Fitness Tracker
### Product Requirements Document (PRD)
**Version:** 1.0 · **Author:** Vaibhav Sharma · **Status:** Draft for build

---

## 1. Overview

Vitalis is a full-stack fitness and vitals tracking application that lets users log workouts, monitor health metrics (heart rate, sleep, weight, blood pressure, SpO2), and sync data from wearable devices (Apple Health, Google Fit, Fitbit). The app is built around a **reusable custom-hooks architecture** on the frontend so that data-fetching, device sync, and derived-metrics logic can be shared across screens without duplication.

**One-line pitch:** A workout + vitals tracker with real wearable integration and a clean, reusable frontend architecture, not another static logging form.

---

## 2. Goals & Non-Goals

### Goals
- [ ] Let users log strength, cardio, and custom workouts with sets/reps/weight/duration/distance
- [ ] Track vitals over time: heart rate, weight, sleep, blood pressure, SpO2, steps
- [ ] Sync automatically with at least one wearable/health data source (Apple HealthKit or Google Fit to start)
- [ ] Visualize trends (weekly/monthly) with charts
- [ ] Reusable custom hooks so new metrics/devices can be added without rewriting UI logic
- [ ] Works well on mobile web (PWA-ready) since most logging happens on-the-go

### Non-Goals (v1)
- No social/friends feed
- No AI-generated workout plans (future phase)
- No native app, no companion app, no Shortcuts/export workarounds — **webapp only**, using providers with real server-side REST APIs
- No payment/subscription system
- No high-fidelity design pass — functional, clean UI over polish/animation

---

## 3. Tech Stack

Matches your existing stack for consistency across projects (Avora, ScholarSync):

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| State/data | Custom hooks + React Query (TanStack Query) for server state |
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas |
| Auth | JWT (access + refresh token pattern) |
| Charts | Recharts |
| Wearable Integration | Apple HealthKit (via companion Swift bridge or HealthKit Web) / Google Fit REST API / Fitbit Web API |
| Hosting | Vercel (frontend) + Railway/Render (FastAPI backend) |
| Deployment target IDE workflow | Antigravity / OpenCode, phase-by-phase |

---

## 4. User Personas

1. **The Lifter** — logs strength workouts daily, cares about progressive overload tracking (weight × reps over time).
2. **The Runner/Cardio user** — cares about heart rate zones, distance, pace, synced from wearable.
3. **The Health-conscious tracker** — mainly logs vitals (BP, weight, sleep) without heavy workout logging, e.g. managing a health condition.

---

## 5. Core Features (v1 scope)

### 5.1 Auth & Onboarding
- [ ] Email/password signup + login (JWT)
- [ ] Onboarding: collect age, height, weight, goal (strength/cardio/general health)
- [ ] Connect wearable device (optional at onboarding, can be done later)

### 5.2 Workout Logging
- [ ] Create workout session (date, type: strength/cardio/custom)
- [ ] Add exercises to session (name, sets, reps, weight OR duration, distance)
- [ ] Exercise library (searchable, with custom exercise creation)
- [ ] Edit/delete past workouts
- [ ] Rest timer between sets (client-side only)
- [ ] Workout history list view + calendar view

### 5.3 Vitals Tracking
- [ ] Manual entry: weight, blood pressure (systolic/diastolic), resting heart rate, sleep hours, SpO2
- [ ] Auto-populated entries from wearable sync (flagged as "synced" vs "manual")
- [ ] Vitals history table + trend charts (7-day, 30-day, 90-day views)
- [ ] Configurable healthy-range indicators (e.g. BP flagged if outside normal range) — informational only, not medical advice

### 5.4 Wearable Integration
- [ ] Google Fit REST API integration (OAuth2, pull steps/heart rate/sleep)
- [ ] Fitbit Web API integration (OAuth2, pull activity + heart rate)
- [ ] Background sync job (backend cron) to pull latest data periodically
- [ ] Manual "sync now" button per device

> Apple Health is dropped from scope — HealthKit has no server-side REST API, so any integration would need a native/companion piece, which is off the table for a webapp-only build. Google Fit + Fitbit cover the same ground (steps, heart rate, sleep, activity) purely over REST.

### 5.5 Dashboard
- [ ] Today's summary card (steps, active calories, last workout, latest vitals)
- [ ] Weekly trend charts (workout volume, weight trend, avg heart rate)
- [ ] Streak tracker (consecutive days logged)

### 5.6 Settings
- [ ] Manage connected devices (connect/disconnect)
- [ ] Units preference (metric/imperial)
- [ ] Data export (CSV/JSON download of workouts + vitals)

---

## 6. Custom Hooks Architecture (Frontend)

This is the core "advanced frontend" requirement — reusable logic, not scattered `useEffect` calls.

```
/hooks
  useAuth.ts              -> auth state, login/logout, token refresh
  useWorkouts.ts           -> CRUD for workout sessions (wraps React Query)
  useExerciseLibrary.ts    -> search/select exercises, custom exercise creation
  useVitals.ts              -> CRUD for vitals entries + derived stats (avg, trend %)
  useWearableSync.ts        -> generic device sync interface (see below)
  useHealthMetric.ts        -> generic hook for any single metric's history + chart data
  useStreak.ts               -> computes logging streak from workout/vitals dates
  useUnitPreference.ts       -> converts values based on metric/imperial setting
  useDebounced.ts             -> generic debounce utility (search, inputs)
  useLocalDraft.ts             -> autosave in-progress workout entries (draft persistence)
```

### Key design pattern: `useWearableSync`
A single hook interface that abstracts over multiple providers so the UI never needs to know which device is connected:

```ts
type Provider = "google_fit" | "apple_health" | "fitbit";

function useWearableSync(provider: Provider) {
  // returns: { status, lastSyncedAt, data, connect(), disconnect(), syncNow() }
}
```

Each provider has its own adapter under `/lib/wearables/{provider}.ts` implementing a shared `WearableAdapter` interface (`connect`, `fetchSteps`, `fetchHeartRate`, `fetchSleep`). The hook just calls whichever adapter is active — this is what makes adding a 4th device later a matter of writing one adapter file, not touching UI components.

### Key design pattern: `useHealthMetric`
One generic hook powers every vitals chart (weight, BP, HR, sleep) instead of writing 4 separate chart-data hooks:

```ts
function useHealthMetric(metricType: MetricType, range: "7d" | "30d" | "90d") {
  // returns: { data, average, trendPercent, isLoading }
}
```

---

## 7. Data Models (MongoDB)

```
users
  _id, email, passwordHash, name, age, heightCm, weightKg, goal, unitPref, createdAt

workouts
  _id, userId, date, type (strength|cardio|custom), notes, createdAt

exercises (subdoc array inside workout, or separate collection with workoutId ref)
  _id, workoutId, name, sets: [{ reps, weightKg }], durationSec, distanceKm

vitals
  _id, userId, type (weight|bp|hr|sleep|spo2), value, secondaryValue (for BP diastolic),
  source (manual|google_fit|apple_health|fitbit), recordedAt

device_connections
  _id, userId, provider, accessToken (encrypted), refreshToken (encrypted),
  connectedAt, lastSyncedAt
```

---

## 8. Wearable API Notes & Constraints

- **Google Fit**: Standard OAuth2 REST API, easiest to integrate first, works from any backend (no native app required). Start here.
- **Fitbit**: Also REST + OAuth2, similar effort to Google Fit. Good second integration.
- **Apple HealthKit**: Out of scope — no server-side REST API exists, only native SDK access. Not pursued, per webapp-only requirement.
- Store all tokens encrypted at rest; refresh tokens server-side on a schedule (cron every few hours).

---

## 9. API Endpoints (FastAPI)

```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh

GET    /workouts
POST   /workouts
PUT    /workouts/{id}
DELETE /workouts/{id}

GET    /vitals?type=&range=
POST   /vitals
DELETE /vitals/{id}

GET    /devices
POST   /devices/{provider}/connect      (OAuth redirect flow)
POST   /devices/{provider}/sync
DELETE /devices/{provider}

GET    /dashboard/summary
GET    /export?format=csv|json
```

---

## 10. Build Roadmap (Phase-by-Phase, for Antigravity/OpenCode)

### Phase 0 — Project Setup
- [ ] Init Next.js 14 + TypeScript + Tailwind frontend
- [ ] Init FastAPI backend with project structure (routers, models, services)
- [ ] Set up MongoDB Atlas connection
- [ ] Set up JWT auth middleware
- [ ] Configure environment variables (.env for both frontend/backend)

### Phase 1 — Auth & Core Data Models
- [ ] Signup/login endpoints + frontend forms
- [ ] `useAuth` hook + protected route wrapper
- [ ] User onboarding flow (goal, height, weight, unit pref)
- [ ] MongoDB schemas for users, workouts, vitals

### Phase 2 — Workout Logging
- [ ] Workout CRUD endpoints
- [ ] `useWorkouts` hook (React Query wrapped)
- [ ] Workout creation UI (add exercises, sets/reps)
- [ ] Exercise library with search (`useExerciseLibrary`)
- [ ] Workout history list + calendar view

### Phase 3 — Vitals Tracking
- [ ] Vitals CRUD endpoints
- [ ] `useVitals` + `useHealthMetric` hooks
- [ ] Manual entry forms per vitals type
- [ ] Trend charts (Recharts) for each metric

### Phase 4 — Wearable Integration (Google Fit first)
- [ ] Google Fit OAuth2 flow (backend)
- [ ] `device_connections` model + endpoints
- [ ] `useWearableSync` hook + `WearableAdapter` interface
- [ ] Google Fit adapter implementation
- [ ] Manual + scheduled sync jobs

### Phase 5 — Fitbit Integration
- [ ] Fitbit OAuth2 flow
- [ ] Fitbit adapter implementing shared interface
- [ ] Test dual-provider sync (Google Fit + Fitbit both connected)

### Phase 6 — Dashboard & Wrap-up
- [ ] Today's summary dashboard
- [ ] Streak tracker (`useStreak`)
- [ ] Data export (CSV/JSON)
- [ ] PWA manifest + offline draft support (`useLocalDraft`)
- [ ] Light UI cleanup pass — functional and clean, no dedicated animation/polish phase

---

## 11. Success Metrics (v1)

- User can log a full workout in under 60 seconds
- Vitals sync from at least one wearable within 5 minutes of connecting
- Dashboard loads in under 1.5s on 4G
- Zero duplicate-logic across metric charts (validated by hook reuse, not per-metric components)

---

## 12. Open Questions

- Should workouts support supersets/circuits in v1, or is that Phase 2 polish?
- Do you want a single combined FastAPI backend, or split wearable-sync into its own microservice given it'll run background jobs? (Given Vaultflow's Go-microservices pattern in your other projects, you may prefer to keep this simple/monolithic for v1 and split later if needed.)
- Preferred chart library confirmed as Recharts — flag if you'd rather use something else given ADYA/other projects' conventions.
