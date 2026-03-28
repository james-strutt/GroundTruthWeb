# GroundTruth: NSW-Focused Roadmap

Hyper-detailed action plan for making GroundTruth the definitive property field intelligence tool in New South Wales. Ordered chronologically by implementation phase — each phase builds on the last.

---

## Phase 1: Stop the Bleeding (Week 1-2)

Quick wins that fix real problems. No new dependencies, no architecture changes. Just patch what's broken and dangerous.

### 1.1 Security Headers

- [x] **1.1.1** Update `vercel.json` with headers
  - [x] **1.1.1.1** Add `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' blob: data: *.supabase.co *.mapbox.com; connect-src 'self' *.supabase.co *.mapbox.com api.mapbox.com events.mapbox.com`
  - [x] **1.1.1.2** Add `X-Frame-Options: DENY`
  - [x] **1.1.1.3** Add `X-Content-Type-Options: nosniff`
  - [x] **1.1.1.4** Add `Referrer-Policy: strict-origin-when-cross-origin`
  - [x] **1.1.1.5** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - [x] **1.1.1.6** Add `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - [ ] **1.1.1.7** Verify with securityheaders.com — target A+ rating (requires deployment)

### 1.2 Fix Edge Function Auth

- [x] **1.2.1** Use JWT instead of anon key
  - [x] **1.2.1.1** In `aiService.ts` `callVisionEdgeFunction`: get user JWT via `supabase.auth.getSession()` and pass it as the `Authorization: Bearer` header instead of the anon key
  - [x] **1.2.1.2** Same fix for `editImageWithAI` — replace anon key header with user JWT
  - [x] **1.2.1.3** Update both edge functions server-side to validate the JWT and extract `user_id` for rate-limit tracking
  - [x] **1.2.1.4** Add per-user rate limits on edge functions: `openai-vision` → 30 calls/user/hour, `gemini-image-edit` → 15 calls/user/hour

### 1.3 Input Sanitisation

- [x] **1.3.1** Guard against injection
  - [x] **1.3.1.1** Sanitise `editPrompt` before sending to Gemini — strip anything resembling system instructions ("ignore previous", "you are now", etc.)
  - [x] **1.3.1.2** Add max length to edit prompt input (500 chars)
  - [x] **1.3.1.3** Add max length to all `EditableText` fields (property notes: 2000 chars, narratives: 5000 chars)
  - [x] **1.3.1.4** Sanitise address inputs in `AddressSearch` — strip SQL-like patterns before Supabase `ilike`

### 1.4 Client-Side Rate Limiting

- [x] **1.4.1** Prevent AI abuse
  - [x] **1.4.1.1** Add cooldown timer to "Re-analyse" button — disable for 10s after click, show countdown
  - [x] **1.4.1.2** Add cooldown to AI image edit submit — disable for 15s after submission
  - [x] **1.4.1.3** Display remaining daily quota in the UI (blocked: requires web SubscriptionContext from Phase 7)

### 1.5 Code Splitting (Immediate Perf Win)

- [x] **1.5.1** Lazy-load all page components
  - [x] **1.5.1.1** In `main.tsx`, replace all 14 static imports with `React.lazy(() => import('./pages/...'))`
  - [x] **1.5.1.2** Add `<Suspense fallback={<LoadingSpinner size="lg" />}>` wrapping `<Routes>`
  - [x] **1.5.1.3** Verify chunk generation: `npx vite build` then check `dist/assets/` for separate page chunks
  - [x] **1.5.1.4** Test that navigating between routes loads chunks on demand (Network tab shows new .js requests)
- [x] **1.5.2** Lazy-load Mapbox GL
  - [x] **1.5.2.1** Create `src/pages/DashboardLazy.tsx` that dynamically imports Dashboard: `const Dashboard = React.lazy(() => import('./Dashboard'))`
  - [x] **1.5.2.2** Show a skeleton map placeholder (dark rectangle with subtle animation) while chunk loads
  - [x] **1.5.2.3** Verify `mapbox-gl` is in its own chunk, not in the entry bundle
  - [x] **1.5.2.4** Measure improvement: landing page initial bundle should drop by ~800KB-1MB

### 1.6 Error Boundaries & Toast Notifications

- [x] **1.6.1** Error handling
  - [x] **1.6.1.1** Create `ErrorBoundary` component: error message + "Try again" button + optional "Report issue" link
  - [x] **1.6.1.2** Add `ErrorBoundary` wrapper at app root in `main.tsx`
  - [x] **1.6.1.3** Add `ErrorBoundary` per route group (wrap each `<Route>` element)
  - [x] **1.6.1.4** Create `NotFoundPage` component: "Page not found" with link back to dashboard
  - [x] **1.6.1.5** Add catch-all route: `<Route path="*" element={<NotFoundPage />} />` in `main.tsx`
- [x] **1.6.2** Toast notifications
  - [x] **1.6.2.1** Create `Toast` component: success/error/info variants, auto-dismiss after 4s, close button
  - [x] **1.6.2.2** Create `ToastContext` + `useToast()` hook for triggering toasts from anywhere
  - [x] **1.6.2.3** Add `<ToastProvider>` in `main.tsx`
  - [x] **1.6.2.4** Replace `alert()` in `SnapDetail.tsx` (line ~58) with `toast.error(...)`
  - [x] **1.6.2.5** Add success toasts: "Snap deleted", "Analysis updated", "Photo removed", "Directory created", "Property saved"
  - [x] **1.6.2.6** Add error toasts: "Failed to save", "Re-analysis failed", "Upload failed"

### 1.7 Memoize Dashboard

- [x] **1.7.1** Fix unnecessary recomputation
  - [x] **1.7.1.1** Wrap `stationsGeoJson` construction (Dashboard ~line 120) in `useMemo(() => ..., [trainStations])`
  - [x] **1.7.1.2** Wrap `daGeoJson` construction (Dashboard ~line 129) in `useMemo(() => ..., [daPoints])`
  - [x] **1.7.1.3** Wrap `walkRoutes` FeatureCollection in the data-fetch effect, or `useMemo` on the route data
  - [ ] **1.7.1.4** Profile with React DevTools Profiler — verify Dashboard re-renders are reduced

### 1.8 iOS Quick Fixes

- [x] **1.8.1** Deduplicate Android permissions
  - [x] **1.8.1.1** In `app.json`, remove duplicate permission entries at lines 41-57 (every permission is listed twice)
- [x] **1.8.2** Fix OTA update policy
  - [x] **1.8.2.1** Change `runtimeVersion.policy` from `"appVersion"` to `"fingerprint"` in `app.json`
  - [ ] **1.8.2.2** Test OTA delivery: `eas update --branch preview --message "test update"` (requires EAS credentials)
  - [x] **1.8.2.3** Add foreground update check in `app/_layout.tsx` — prompt user to reload when update available

---

## Phase 2: Legal & Privacy (Week 2-3)

You cannot onboard paying users or submit to the App Store without these. Do this before any feature work.

### 2.1 Privacy Policy

- [x] **2.1.1** Draft and publish
  - [x] **2.1.1.1** Draft privacy policy: what data is collected (photos, location, property data), processing purpose (AI analysis, property assessment), storage (Supabase/AWS Sydney region), retention (until account deletion), third parties (OpenAI, Google Gemini, Mapbox)
  - [x] **2.1.1.2** Create `/privacy` route on web app with styled page
  - [x] **2.1.1.3** Add privacy policy screen to iOS Settings tab (links to web URL from about screen)
  - [x] **2.1.1.4** Link from: landing page footer, login page, iOS app store listing

### 2.2 Terms of Service

- [x] **2.2.1** Draft and publish
  - [x] **2.2.1.1** Draft ToS: AI disclaimer ("AI analysis is indicative only and does not constitute professional property advice"), acceptable use, data ownership (users own their data), subscription terms, limitation of liability
  - [x] **2.2.1.2** Create `/terms` route on web app
  - [x] **2.2.1.3** Add ToS screen to iOS settings (links to web URL from about screen)
  - [x] **2.2.1.4** Require acceptance on first login (checkbox + timestamp stored in `users` table)

### 2.3 Australian Privacy Act Compliance

- [x] **2.3.1** Data rights
  - [x] **2.3.1.1** Implement account deletion — purge all user data from Supabase tables + storage buckets (edge function created)
  - [x] **2.3.1.2** Add "Delete my account" button to iOS settings and web profile (web Settings page created)
  - [x] **2.3.1.3** Implement data export — download all user data as JSON (snaps, inspections, appraisals, walks, properties) (edge function created)
  - [x] **2.3.1.4** Add "Export my data" button to iOS settings and web profile (web Settings page created)

### 2.4 Location Data Consent

- [x] **2.4.1** Explicit GPS consent
  - [x] **2.4.1.1** Add explicit consent screen before first walk session: "We'll record your GPS route for this walk. You can delete routes anytime from your walk history."
  - [x] **2.4.1.2** Allow users to delete individual walk routes (GPS data) from their history (already existed)
  - [x] **2.4.1.3** Add option to disable background location tracking in iOS settings

### 2.5 iOS Security Audit

- [x] **2.5.1** Sensitive data
  - [x] **2.5.1.1** Audit all `AsyncStorage` usage — verify no auth tokens, API keys, or GPS coordinates stored unencrypted (audit passed: no credentials in AsyncStorage, Supabase SDK handles auth tokens internally)
  - [x] **2.5.1.2** Move any sensitive items found to `expo-secure-store` (none found — audit clean)
  - [x] **2.5.1.3** Add biometric app lock option (Face ID / Touch ID) — gate on app foreground, configurable in settings

---

## Phase 3: Crash Reporting & Analytics (Week 3-4)

You need visibility before you scale. Install these before onboarding users so you have data from day one.

### 3.1 Sentry (Crash Reporting)

- [ ] **3.1.1** Install on both platforms
  - [ ] **3.1.1.1** iOS: `npm install @sentry/react-native` — initialise in `app/_layout.tsx`
  - [x] **3.1.1.2** Web: `npm install @sentry/react` in GroundTruthWeb — initialise in `main.tsx`
  - [ ] **3.1.1.3** Configure source map uploads in EAS build hooks
  - [x] **3.1.1.4** Configure Vite source map upload via `@sentry/vite-plugin`
  - [x] **3.1.1.5** Add Sentry error boundary to web app root
  - [ ] **3.1.1.6** Test: throw a test error, verify it appears in Sentry dashboard

### 3.2 PostHog (Product Analytics)

- [x] **3.2.1** Install and instrument
  - [x] **3.2.1.1** Create PostHog project for GroundTruth
  - [x] **3.2.1.2** iOS: `npm install posthog-react-native` — initialise in `app/_layout.tsx`
  - [x] **3.2.1.3** Web: `npm install posthog-js` — initialise in `main.tsx`
  - [x] **3.2.1.4** Track key events: `snap_created`, `inspection_completed`, `appraisal_completed`, `walk_completed`, `property_monitored`
  - [x] **3.2.1.5** Track funnel: camera_opened → photo_captured → analysis_received → saved
  - [x] **3.2.1.6** Track subscription: `trial_started`, `upgrade_clicked`, `subscription_activated`, `subscription_cancelled`
  - [x] **3.2.1.7** Track feature adoption: which of the 5 modes users engage with, session frequency
  - [x] **3.2.1.8** Create PostHog dashboards: daily active users, feature usage, conversion funnel

---

## Phase 4: Architecture Cleanup (Week 4-6)

Now strengthen the codebase so you can iterate fast. These changes make everything after this phase easier.

### 4.1 Split the API Monolith

`api.ts` is 1,003 lines with 11 `eslint-disable` comments. It's the most critical file and has the weakest typing.

- [x] **4.1.1** Create per-feature service files
  - [x] **4.1.1.1** Create `src/services/shared/supabaseHelpers.ts` — move `ensureAuthSessionLoaded`, `updateRowById`, `deleteRowById`
  - [x] **4.1.1.2** Create `src/services/snapService.ts` — move `listSnaps`, `getSnap`, `deleteSnap`, `updateSnapAnalysisField`, `updateSnapField`, `mapSnap`
  - [x] **4.1.1.3** Create `src/services/inspectionService.ts` — move `listInspections`, `getInspection`, `deleteInspection`, `updateInspectionPhotoAnalysis`, `updateInspectionReportField`, `deleteInspectionPhoto`, `mapInspection`
  - [x] **4.1.1.4** Create `src/services/appraisalService.ts` — move `listAppraisals`, `getAppraisal`, `deleteAppraisal`, `updateAppraisalEstimateField`, `updateAppraisalCompSelections`, `mapAppraisal`
  - [x] **4.1.1.5** Create `src/services/monitorService.ts` — move `listWatched`, `getWatched`, `deleteWatched`, `mapWatched`
  - [x] **4.1.1.6** Create `src/services/walkService.ts` — move `listWalks`, `getWalk`, `deleteWalk`, `updateWalkField`, `getWalkRoutes`, `mapWalk`
  - [x] **4.1.1.7** Create `src/services/directoryService.ts` — move CRUD + `listPropertiesByDirectory`, `mapDirectory`, `mapDirectorySummary`
  - [x] **4.1.1.8** Create `src/services/propertyService.ts` — move CRUD + `getPropertyActivities`, `getPropertyRecords`, `listProperties`, `listAllProperties`, `mapProperty`, `mapPropertySummary`, `mapGroupedProperty`
  - [x] **4.1.1.9** Create `src/services/dashboardService.ts` — move `getAllPins`, `getRecentActivity`
  - [x] **4.1.1.10** Create `src/services/imageService.ts` — move `uploadEditedImage`
  - [x] **4.1.1.11** Update all imports across pages to use new service file paths
  - [x] **4.1.1.12** Delete `api.ts` once all references are migrated and tests pass

### 4.2 Fix Typing

- [x] **4.2.1** Generate and apply Supabase types
  - [x] **4.2.1.1** Generate Supabase types: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`
  - [x] **4.2.1.2** Type all mapper function parameters using generated `Database['public']['Tables']['snaps']['Row']` etc.
  - [x] **4.2.1.3** Remove all 11 `eslint-disable @typescript-eslint/no-explicit-any` comments
  - [x] **4.2.1.4** Run `npx tsc --noEmit` — fix any type errors introduced

### 4.3 Data Fetching Layer (React Query)

- [x] **4.3.1** Install TanStack Query
  - [x] **4.3.1.1** `npm install @tanstack/react-query @tanstack/react-query-devtools`
  - [x] **4.3.1.2** Create `src/lib/queryClient.ts` with defaults: `staleTime: 5 * 60 * 1000` (5 min), `gcTime: 30 * 60 * 1000` (30 min), `retry: 1`
  - [x] **4.3.1.3** Add `<QueryClientProvider>` in `main.tsx` wrapping `<AuthProvider>`
  - [x] **4.3.1.4** Add `<ReactQueryDevtools initialIsOpen={false} />` in dev mode
- [x] **4.3.2** Create query hooks
  - [x] **4.3.2.1** `src/hooks/queries/useSnaps.ts`: `useSnapsQuery()` + `useSnapQuery(id)`
  - [x] **4.3.2.2** `src/hooks/queries/useInspections.ts`: same pattern
  - [x] **4.3.2.3** `src/hooks/queries/useAppraisals.ts`: same pattern
  - [x] **4.3.2.4** `src/hooks/queries/useMonitor.ts`: same pattern
  - [x] **4.3.2.5** `src/hooks/queries/useWalks.ts`: same pattern
  - [x] **4.3.2.6** `src/hooks/queries/useDirectories.ts`: same pattern
  - [x] **4.3.2.7** `src/hooks/queries/useProperties.ts`: same pattern
  - [x] **4.3.2.8** `src/hooks/queries/useDashboard.ts`: pins + activity + walk routes (parallel queries via `useQueries`)
- [x] **4.3.3** Create mutation hooks
  - [x] **4.3.3.1** `useDeleteSnap`: `useMutation` that invalidates `['snaps']` on success + shows toast
  - [x] **4.3.3.2** `useUpdateSnapAnalysis`: `useMutation` with optimistic update (update cache immediately, rollback on error)
  - [x] **4.3.3.3** Same pattern for inspection, appraisal, monitor, walk, directory, property mutations
  - [x] **4.3.3.4** `useCreateDirectory`: `useMutation` that adds to `['directories']` cache and navigates to new directory
  - [x] **4.3.3.5** `useCreateProperty`: `useMutation` that adds to directory's property list cache
- [x] **4.3.4** Migrate all pages to use hooks
  - [x] **4.3.4.1** Replace `useState` + `useEffect` fetch pattern in SnapList with `useSnapsQuery()`
  - [x] **4.3.4.2** Replace in SnapDetail, InspectionList, InspectionDetail, etc. (all 14 pages)
  - [x] **4.3.4.3** Replace Dashboard data fetching with `useDashboard()`
  - [x] **4.3.4.4** Remove all manual `loading`/`error`/`data` state — React Query provides these
  - [x] **4.3.4.5** Delete `useDetailFetch.ts` custom hook (replaced by React Query)

### 4.4 Routing Fixes

- [x] **4.4.1** Fix property routing
  - [x] **4.4.1.1** Change `/app/properties/:address` to `/app/properties/:id` — address-based routing breaks with special characters
  - [x] **4.4.1.2** Update `PropertyList` links to use property ID instead of encoded address
  - [x] **4.4.1.3** Update `PropertyDetail` to fetch by ID via `getProperty(id)` instead of `getPropertyRecords(address)`
  - [x] **4.4.1.4** Update `AppLayout` `handleAddressSelect` to navigate by ID
  - [x] **4.4.1.5** Update `Dashboard` pin click handler to navigate by ID
- [x] **4.4.2** Add settings route
  - [x] **4.4.2.1** Create `src/pages/Settings.tsx` — user profile, preferences, delete account, export data
  - [x] **4.4.2.2** Add `<Route path="settings" element={<SettingsPage />} />` under `/app`

### 4.5 Vite Build Optimisation

- [x] **4.5.1** Configure `vite.config.ts`
  - [x] **4.5.1.1** Add `build.rollupOptions.output.manualChunks`: split `react-vendor` (react, react-dom, react-router-dom), `mapbox` (mapbox-gl, react-map-gl), `supabase` (@supabase/supabase-js), `icons` (lucide-react)
  - [x] **4.5.1.2** `npm install -D vite-plugin-compression` — add gzip + brotli pre-compression
  - [x] **4.5.1.3** `npm install -D rollup-plugin-visualizer` — add as plugin for `vite build --mode analyze`
  - [x] **4.5.1.4** Set `build.target: 'es2020'` for smaller modern output
  - [x] **4.5.1.5** Set `build.reportCompressedSize: true` for build output size visibility
  - [x] **4.5.1.6** Run visualizer, identify and action any unexpectedly large chunks

### 4.6 iOS Turf.js Tree-Shaking

- [x] **4.6.1** Reduce bundle size
  - [x] **4.6.1.1** Audit all `@turf/turf` imports — list every function actually used
  - [x] **4.6.1.2** Replace `import * as turf from '@turf/turf'` with individual package imports (e.g. `import distance from '@turf/distance'`)
  - [x] **4.6.1.3** Uninstall `@turf/turf`, install only the individual packages needed
  - [x] **4.6.1.4** Verify bundle size reduction

---

## Phase 5: Testing (Week 5-7)

Now that the architecture is clean, write tests against the new service files and query hooks. Much easier to test than the old monolith.

### 5.1 Web Test Infrastructure

- [x] **5.1.1** Install and configure Vitest
  - [x] **5.1.1.1** `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - [x] **5.1.1.2** Add scripts to `package.json`: `"test": "vitest"`, `"test:ci": "vitest run --coverage"`
  - [x] **5.1.1.3** Create `vitest.config.ts` with jsdom environment and path aliases matching `vite.config.ts`
  - [x] **5.1.1.4** Create `src/test/setup.ts` with `@testing-library/jest-dom` imports and Supabase client mock

### 5.2 Web Service Layer Tests

- [x] **5.2.1** Test the new per-feature services
  - [x] **5.2.1.1** Create mock Supabase client factory in `src/test/mocks/supabase.ts`
  - [x] **5.2.1.2** Test all mapper functions (mapSnap, mapInspection, mapAppraisal, mapWatched, mapWalk, mapDirectory, mapProperty, mapPropertySummary) — verify snake_case → camelCase, null defaults, missing fields
  - [x] **5.2.1.3** Test CRUD operations (listSnaps, getSnap, deleteSnap, etc.) with mocked Supabase responses
  - [x] **5.2.1.4** Test `ensureAuthSessionLoaded` — returns false when no session, true when session exists
  - [x] **5.2.1.5** Test `updateRowById` — verifies RLS-blocked 0-row updates are detected as failures
  - [x] **5.2.1.6** Test `uploadEditedImage` — data URL parsing, base64 conversion, storage upload call
  - [x] **5.2.1.7** Test `aiService.ts` — `photoUrlToBase64` CORS fallback, `compressBlob` canvas path, JSON extraction from fenced/unfenced responses
  - [x] **5.2.1.8** Test `daService.ts` — bounds query construction, empty response handling
  - [x] **5.2.1.9** Test `trainStationService.ts` — station and railway line data parsing

### 5.3 Web Auth & Component Tests

- [x] **5.3.1** Auth flow tests
  - [x] **5.3.1.1** Test `AuthProvider` — initial session resolution, `onAuthStateChange` subscription, cleanup on unmount
  - [x] **5.3.1.2** Test `ProtectedRoute` — redirects to `/login` when unauthenticated, renders children when authenticated, shows spinner while loading
  - [x] **5.3.1.3** Test `LoginPage` — form submission calls signIn, error display, sign-up toggle switches to signUp, Google OAuth trigger
  - [x] **5.3.1.4** Test waitlist form — email validation, duplicate handling (Supabase 23505 error code maps to success), error state auto-clears after 3s
- [x] **5.3.2** Component tests
  - [x] **5.3.2.1** Test `EditableText` — display mode shows text, click enters edit mode, blur/Enter saves, Escape cancels, voice recording toggle
  - [x] **5.3.2.2** Test `ConfirmModal` — renders when open, confirm callback fires, cancel callback fires, clicking overlay closes
  - [x] **5.3.2.3** Test `ImageEditModal` — prompt input, submit calls `editImageWithAI`, loading state, error display
  - [x] **5.3.2.4** Test `InlineDiff` — old/new text rendering, visual diff highlights
  - [x] **5.3.2.5** Test `Breadcrumb` — renders correct link hierarchy from props
  - [x] **5.3.2.6** Test `AddressSearch` — debounced input fires search, result click calls onSelect, keyboard up/down navigates results

### 5.4 Web E2E Tests

- [x] **5.4.1** Install and configure Playwright
  - [x] **5.4.1.1** `npm install -D @playwright/test`
  - [x] **5.4.1.2** Create `playwright.config.ts` with base URL pointing at Vite dev/preview server, browser targets (Chromium, Firefox, WebKit)
  - [ ] **5.4.1.3** Create `e2e/fixtures/` with auth helper (seeds a test user session via Supabase admin)
- [ ] **5.4.2** Critical journey tests
  - [x] **5.4.2.1** Landing page loads → waitlist signup → success message displayed
  - [ ] **5.4.2.2** Login with email/password → redirected to `/app` → dashboard map renders with pins
  - [ ] **5.4.2.3** Navigate to Snaps list → click a snap → detail page shows photo + AI analysis
  - [ ] **5.4.2.4** Navigate to Directories → create directory → add property → verify property appears in list
  - [ ] **5.4.2.5** Navigate to Properties → search by address → property detail loads with activity tabs
  - [x] **5.4.2.6** Sign out → redirected to login → visiting `/app` redirected to login

### 5.5 iOS Tests

- [x] **5.5.1** Install test dependencies
  - [x] **5.5.1.1** `npm install -D jest @testing-library/react-native jest-expo`
  - [x] **5.5.1.2** Configure Jest in `package.json` with `jest-expo` preset
  - [x] **5.5.1.3** Create mocks for Supabase, AsyncStorage, expo-camera, expo-location, expo-sensors
- [ ] **5.5.2** Service layer tests
  - [ ] **5.5.2.1** Test `genericStorage.ts` — save, list (with sort/filter), get, update, remove, count, clear
  - [ ] **5.5.2.2** Test each feature storage adapter (snapStorage, inspectionStorage, appraisalStorage, exploreStorage)
  - [ ] **5.5.2.3** Test `authService.ts` — signIn, signUp, signOut, signInWithGoogle, getCurrentUserAsync, forceSignOutLocal
  - [ ] **5.5.2.4** Test `visionService.ts` — edge function call construction, response parsing, error paths
  - [ ] **5.5.2.5** Test each AI analyser — prompt construction, JSON result mapping, fallback handling
  - [ ] **5.5.2.6** Test `pdfService.ts` — generates valid HTML for each report type
  - [ ] **5.5.2.7** Test `offlineQueue.ts` — enqueue, dequeue, retry logic, queue persistence
- [ ] **5.5.3** Component tests
  - [ ] **5.5.3.1** Test `SubscriptionGate` — blocks gated features for free tier, renders children for pro
  - [ ] **5.5.3.2** Test `ErrorBoundary` — catches thrown error, renders fallback, retry resets state
  - [ ] **5.5.3.3** Test UI primitives (Button, Card, Modal, Toast, TextField, Badge, Skeleton) — props, states, accessibility labels
  - [ ] **5.5.3.4** Test `EmptyState` — correct illustration and message per feature type

### 5.6 CI/CD

- [ ] **5.6.1** GitHub Actions
  - [x] **5.6.1.1** Create `.github/workflows/ci-web.yml`: lint → typecheck → vitest → build (fail-fast)
  - [x] **5.6.1.2** Create `.github/workflows/ci-mobile.yml`: lint → typecheck → jest
  - [x] **5.6.1.3** Add Playwright E2E job (runs against `vite preview` in CI)
  - [x] **5.6.1.4** Add coverage reporting — upload to Codecov, set minimum threshold (60% initially, ratchet up)
  - [ ] **5.6.1.5** Add branch protection: require CI pass + 1 approval before merge to main

---

## Phase 6: UX Polish (Week 7-9)

With a stable, tested codebase, make the product feel professional.

### 6.1 Empty States

- [x] **6.1.1** Create and add empty states
  - [x] **6.1.1.1** Create `EmptyState` component: icon + title + subtitle + optional CTA button
  - [x] **6.1.1.2** SnapList empty: "No snaps yet — capture your first property from the iOS app"
  - [x] **6.1.1.3** InspectionList empty: "No inspections yet — start an inspection from the iOS app"
  - [x] **6.1.1.4** AppraisalList empty: "No appraisals yet — appraise a property from the iOS app"
  - [x] **6.1.1.5** MonitorList empty: "No properties being monitored — add a property to watch from the iOS app"
  - [x] **6.1.1.6** WalkList empty: "No walks recorded — start exploring a neighbourhood from the iOS app"
  - [x] **6.1.1.7** DirectoryList empty: "Create your first directory to organise properties"
  - [x] **6.1.1.8** Dashboard with no pins: "Your map is empty — capture some properties to see them here"
  - [x] **6.1.1.9** PropertyDetail with no activities: "No activity yet for this property"

### 6.2 Skeleton Loaders

- [x] **6.2.1** Add loading placeholders
  - [x] **6.2.1.1** Create `SkeletonCard` component — animated pulse placeholder matching `FeatureCard` dimensions
  - [x] **6.2.1.2** Show 3-6 skeleton cards on all list pages while data loads
  - [x] **6.2.1.3** Show skeleton layout on detail pages (header bar + content blocks) while fetching
  - [x] **6.2.1.4** Show skeleton map on Dashboard while Mapbox initialises

### 6.3 Image Optimisation

- [x] **6.3.1** Speed up image loading
  - [x] **6.3.1.1** Add `loading="lazy"` to all `<img>` tags showing property photos
  - [x] **6.3.1.2** Add explicit `width` and `height` attributes to prevent Cumulative Layout Shift
  - [x] **6.3.1.3** Use Supabase Storage image transforms for thumbnails (200px wide for list views)
  - [ ] **6.3.1.4** Convert static landing page assets to WebP with JPEG fallback

### 6.4 Font Optimisation

- [x] **6.4.1** Optimise web fonts
  - [x] **6.4.1.1** Self-host DM Serif Display, Public Sans, and JetBrains Mono (download from Google Fonts, add to `public/fonts/`)
  - [x] **6.4.1.2** Add `@font-face` declarations with `font-display: swap` in `index.css`
  - [x] **6.4.1.3** Add `<link rel="preload" as="font" crossorigin>` for the primary body font (Public Sans 400)
  - [x] **6.4.1.4** Subset fonts to Latin characters only (removes ~60% of font file size)
  - [x] **6.4.1.5** Remove Google Fonts CDN links from `index.html` (if present)

### 6.5 List Virtualisation

- [x] **6.5.1** Handle large data sets
  - [x] **6.5.1.1** `npm install @tanstack/react-virtual`
  - [x] **6.5.1.2** Virtualise SnapList — only render visible cards, not all 50+
  - [x] **6.5.1.3** Virtualise InspectionList, AppraisalList, MonitorList, WalkList, PropertyList
  - [ ] **6.5.1.4** Test smooth scrolling with 200+ items

### 6.6 iOS Photo Performance

- [ ] **6.6.1** Optimise photo handling
  - [ ] **6.6.1.1** Verify captured photos are compressed before upload (max 1024px, JPEG quality 0.7)
  - [ ] **6.6.1.2** Generate local thumbnails for list views rather than loading full-res images
  - [ ] **6.6.1.3** Add progressive image loading — show blurred thumbnail, then sharp image

### 6.7 Mobile Web Navigation

- [x] **6.7.1** Landing page mobile menu
  - [x] **6.7.1.1** Add hamburger icon button (visible at < 768px, hidden on desktop)
  - [x] **6.7.1.2** Create slide-in mobile menu with all nav links + "Get early access" CTA
  - [x] **6.7.1.3** Lock body scroll when menu is open
  - [x] **6.7.1.4** Add close animation and Escape key to dismiss
- [x] **6.7.2** Mobile dashboard
  - [x] **6.7.2.1** Replace drag-to-resize activity panel with a snap-to-position BottomSheet (three stops: collapsed/half/full)
  - [x] **6.7.2.2** Add swipe-up gesture on the handle to expand
  - [x] **6.7.2.3** Condense activity cards on mobile — single-line summary, hide secondary fields
  - [x] **6.7.2.4** Make map controls (layer toggle, measure, 3D) more touch-friendly (44px min tap target)

### 6.8 Accessibility

- [ ] **6.8.1** ARIA attributes — interactive elements
  - [x] **6.8.1.1** Landing page feature tabs: add `role="tablist"` to container, `role="tab"` + `aria-selected` to each button, `role="tabpanel"` to content area
  - [x] **6.8.1.2** ConfirmModal: add `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
  - [x] **6.8.1.3** ImageEditModal: add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
  - [x] **6.8.1.4** All icon-only buttons (delete, edit, refresh, re-analyse, close): add `aria-label` describing the action
  - [x] **6.8.1.5** Collapsible sections on detail pages: add `aria-expanded` to toggle button
  - [x] **6.8.1.6** Loading states: add `aria-live="polite"` region that announces "Loading..." and "Loaded"
  - [x] **6.8.1.7** Form error messages: link to inputs via `aria-describedby`
- [ ] **6.8.2** Keyboard navigation
  - [x] **6.8.2.1** All interactive elements must be focusable with Tab — audit and fix any `div` or `span` used as buttons
  - [x] **6.8.2.2** Escape key closes all modals (ConfirmModal, ImageEditModal, Lightbox)
  - [x] **6.8.2.3** Add focus trap to modals — Tab cycles through modal content only, not background
  - [x] **6.8.2.4** Add visible `:focus-visible` outline styles to all buttons, links, inputs
  - [x] **6.8.2.5** Arrow keys navigate feature tabs on landing page
- [ ] **6.8.3** Screen reader and image accessibility
  - [x] **6.8.3.1** All property photos: add `alt` text with pattern `"Property photo at {address}"`
  - [x] **6.8.3.2** Map container: add `aria-label="Property map showing pins for your snaps, inspections, appraisals, and monitored properties"`
  - [x] **6.8.3.3** Announce route changes: add a visually-hidden `aria-live` region that announces the new page title on navigation
  - [ ] **6.8.3.4** Test full app flow with VoiceOver on macOS
- [ ] **6.8.4** Colour contrast
  - [x] **6.8.4.1** Audit `--text-muted: #8a8279` on `--page-bg: #121110` — calculate contrast ratio, fix if below 4.5:1
  - [x] **6.8.4.2** Audit `--stone-500: #78716C` on dark surfaces — likely too low contrast for body text
  - [x] **6.8.4.3** Add shape/icon differentiation to map pins (not just colour) for colour-blind users — snap=camera, inspect=clipboard, appraise=chart, monitor=eye, explore=footprints

---

## Phase 7: Monetisation (Week 9-11)

Product is stable, tested, polished, and legal. Time to get paid.

### 7.1 Pricing Page

- [x] **7.1.1** Create web pricing page
  - [x] **7.1.1.1** Design three-tier pricing cards matching iOS tiers: Free, Pro ($X/mo), Enterprise (contact)
  - [x] **7.1.1.2** Create `src/pages/Pricing.tsx` with feature comparison table
  - [x] **7.1.1.3** Add `/pricing` to public routes in `main.tsx` (no auth required)
  - [x] **7.1.1.4** Link from landing page nav ("Pricing") and CTA sections
  - [x] **7.1.1.5** Add FAQ: "Can I cancel anytime?", "What happens to my data if I downgrade?", "Is there a team plan?"
  - [x] **7.1.1.6** Add annual vs monthly toggle with annual discount (e.g. 2 months free)

### 7.2 Stripe Integration

- [ ] **7.2.1** Set up Stripe
  - [ ] **7.2.1.1** Create Stripe account, add products and prices for Pro monthly and Pro annual
  - [ ] **7.2.1.2** Create Supabase Edge Function `create-checkout-session` — creates Stripe Checkout session, returns URL
  - [ ] **7.2.1.3** Create Supabase Edge Function `stripe-webhook` — handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - [ ] **7.2.1.4** Webhook updates `users.subscription_tier` and `users.subscription_expires_at` in Supabase
  - [ ] **7.2.1.5** Add "Manage billing" button linking to Stripe Customer Portal
- [x] **7.2.2** Enforce tiers on web
  - [x] **7.2.2.1** Port `SubscriptionContext` pattern from iOS to web app
  - [x] **7.2.2.2** Fetch `subscription_tier` from Supabase `users` table on auth
  - [x] **7.2.2.3** Show upgrade prompt on Appraisal, Monitor, and Walk detail pages for free users
  - [x] **7.2.2.4** Grey out gated navigation items with "Pro" badge

### 7.3 Landing Page Conversion

- [ ] **7.3.1** Content improvements
  - [x] **7.3.1.1** Replace "Social Proof" section (currently just capability labels) with real beta user testimonials or remove the section entirely
  - [ ] **7.3.1.2** Record 60-second product demo video: snap a property → AI analysis → view report (screen capture of iOS app)
  - [ ] **7.3.1.3** Embed video in Hero section or below features
  - [x] **7.3.1.4** Add waitlist counter: "Join 500+ NSW property professionals" (fetch count from Supabase)
  - [ ] **7.3.1.5** Add trusted-by section if any firms, agencies, or valuers are beta testing
  - [ ] **7.3.1.6** Add an interactive demo: embedded web app with sample data (read-only, no login) so visitors can click through a real snap/inspection
- [ ] **7.3.2** SEO
  - [x] **7.3.2.1** Add `<meta name="description">` — "AI-powered property field intelligence for NSW property professionals. Instant condition scoring, hazard overlays, comparable sales, and planning data."
  - [x] **7.3.2.2** Add Open Graph tags: `og:title`, `og:description`, `og:image` (screenshot of the app), `og:type="website"`
  - [x] **7.3.2.3** Add Twitter card meta tags
  - [x] **7.3.2.4** Add JSON-LD structured data for `SoftwareApplication` schema
  - [ ] **7.3.2.5** Ensure landing page is pre-renderable for search engines — evaluate `vite-ssg` or Vercel ISR

---

## Phase 8: Expand Platform & NSW Data (Week 11-14)

With revenue flowing, expand reach and deepen the NSW value proposition.

### 8.1 Android Support

- [ ] **8.1.1** Fix and enable Android builds
  - [ ] **8.1.1.1** Run `expo prebuild --platform android` — verify Gradle build succeeds
  - [ ] **8.1.1.2** Test all five feature flows on Android emulator (Pixel 7 Pro, API 34)
  - [ ] **8.1.1.3** Test camera capture on a physical Android device
  - [ ] **8.1.1.4** Test GPS and compass heading on physical Android
  - [ ] **8.1.1.5** Fix platform-specific issues (shadows render differently, font weights, safe area insets)
  - [ ] **8.1.1.6** Add Android EAS build profiles to `eas.json`: development, preview, production
  - [ ] **8.1.1.7** Create Google Play Store listing: title, description, screenshots (6 screens), feature graphic
  - [ ] **8.1.1.8** Submit to Play Store closed testing track

### 8.2 Push Notifications

- [x] **8.2.1** Install and configure
  - [x] **8.2.1.1** `npm install expo-notifications`
  - [x] **8.2.1.2** Add `expo-notifications` to `plugins` in `app.json`
  - [x] **8.2.1.3** Add `NSUserNotificationsUsageDescription` to `infoPlist`
  - [x] **8.2.1.4** Create `services/notifications/notificationService.ts` — request permission, get/store push token
  - [x] **8.2.1.5** Store push token in Supabase `users` table (`push_token` column)
  - [x] **8.2.1.6** Request permission on first Monitor property add (not on app launch — contextual timing)
- [x] **8.2.2** Notification triggers
  - [x] **8.2.2.1** Monitor: server-side job detects changes → sends push "Change detected at {address}"
  - [x] **8.2.2.2** Monitor: DA lodged within 500m of a watched property → "New DA near {address}: {da_type}"
  - [x] **8.2.2.3** Weekly digest: Supabase cron → Edge Function → push summary of portfolio activity
  - [x] **8.2.2.4** Subscription expiry: 3 days before → "Your Pro trial ends in 3 days"
  - [x] **8.2.2.5** Add notification preferences screen — toggle each notification type on/off

### 8.3 NSW Spatial Layers

- [x] **8.3.1** Additional ArcGIS layers
  - [x] **8.3.1.1** Add Bushfire Prone Land layer (NSW RFS dataset) — critical for property risk assessment
  - [x] **8.3.1.2** Add Flood Prone Land layer (NSW SES / council flood maps)
  - [x] **8.3.1.3** Add Heritage items layer (NSW Heritage database — state + local heritage)
  - [x] **8.3.1.4** Add Contaminated land (PFAS, former industrial sites — NSW EPA CLM)
  - [x] **8.3.1.5** Add Acid Sulfate Soils layer
  - [x] **8.3.1.6** Add each layer as a toggle in `LayerControl` with appropriate styling
- [x] **8.3.2** Lot/parcel boundaries
  - [x] **8.3.2.1** Add NSW cadastre (lot boundary) overlay from NSW Spatial Services
  - [x] **8.3.2.2** Show lot area, lot/DP number on snap and inspection detail pages
  - [x] **8.3.2.3** Highlight the subject property parcel on the detail page map
- [x] **8.3.3** Enrich AI analysis with spatial context
  - [x] **8.3.3.1** Pass bushfire, flood, heritage, contamination status into the snap AI prompt
  - [x] **8.3.3.2** AI analysis should flag "This property is on bushfire prone land" or "Heritage listed" when applicable
  - [x] **8.3.3.3** Show spatial risk summary card on snap detail page: bushfire/flood/contamination badges

### 8.4 DA Improvements

- [x] **8.4.1** DA detail and alerting
  - [x] **8.4.1.1** Add DA detail popup on map click: show application type, description, estimated cost, status, lodgement date
  - [x] **8.4.1.2** Link DA popup to council's online DA tracker (external link)
  - [x] **8.4.1.3** Show nearby DAs on property detail pages (within 200m radius)
  - [x] **8.4.1.4** Add "Watch this DA" feature — notify user when status changes

### 8.5 Comparable Sales Improvements

- [ ] **8.5.1** Comp data quality
  - [ ] **8.5.1.1** Add more comp fields to the map view: sale price, settlement date, land area
  - [ ] **8.5.1.2** Add comp photo display — show street view or snap photo if available
  - [ ] **8.5.1.3** Add comp filtering: by date range, distance radius, property type, zone code
  - [ ] **8.5.1.4** Add comp sorting: by distance, sale price, settlement date, adjustment score
- [ ] **8.5.2** Valuation methodology
  - [ ] **8.5.2.1** Add API Valuer General data feed for land values (where available)
  - [ ] **8.5.2.2** Cross-reference AI appraisal with Valuer General land values
  - [ ] **8.5.2.3** Add rate per sqm comparison chart (subject vs comps)

---

## Phase 9: Innovations — Differentiate (Week 14+)

The foundations are solid. Now build the features that make GroundTruth impossible to ignore.

### 9.1 AI Comparative View

Start here — extends existing functionality with high visual impact and moderate effort.

- [x] **9.1.1** Annotated photo comparison
  - [x] **9.1.1.1** Split-screen view on snap detail: original photo | AI-annotated version with defects circled, materials labelled
  - [x] **9.1.1.2** Use Gemini image edit to generate the annotated version automatically on re-analysis
  - [x] **9.1.1.3** Add swipe slider between original and annotated (drag handle left/right)
- [ ] **9.1.2** Monitor time-series view
  - [ ] **9.1.2.1** Timeline scrubber showing all historical photos of a monitored property
  - [ ] **9.1.2.2** Side-by-side baseline vs latest photo with change areas highlighted
  - [ ] **9.1.2.3** Pixel-diff heatmap overlay showing areas of change between visits
  - [ ] **9.1.2.4** Chart showing condition trend over time (score per visit)
- [x] **9.1.3** Interactive comps map
  - [x] **9.1.3.1** Appraisal detail: full-screen map showing subject property (large pin) + all comps (small pins with price labels)
  - [x] **9.1.3.2** Click a comp pin → slide-up card with photo, sale price, adjustment, distance
  - [x] **9.1.3.3** Colour-code comp pins: green = inferior/upward adjustment, amber = similar, red = superior/downward
  - [x] **9.1.3.4** Draw radius rings (500m, 1km, 2km) from subject property

### 9.2 Client-Facing Reports & Collaboration

Next — directly drives revenue through enterprise tier and team plans.

- [ ] **9.2.1** Client-facing reports
  - [ ] **9.2.1.1** Generate shareable report link (public URL with 30-day expiry, no login required)
  - [ ] **9.2.1.2** Report shows: photos, AI analysis, spatial data, condition score — read-only, branded
  - [ ] **9.2.1.3** PDF export matching the shareable report format
  - [ ] **9.2.1.4** Add company branding customisation: logo upload, company name, ABN, contact details
  - [ ] **9.2.1.5** White-label report option for enterprise tier (remove GroundTruth branding)
- [ ] **9.2.2** Team support
  - [x] **9.2.2.1** Add `teams` and `team_members` tables to Supabase schema (team_id, user_id, role: owner/admin/member)
  - [ ] **9.2.2.2** Add "Create team" and "Invite member" in iOS settings and web settings
  - [ ] **9.2.2.3** Allow sharing a directory with team members (read-only or read-write)
  - [ ] **9.2.2.4** Show team member attribution on shared records: "Inspected by James, 2 days ago"
  - [ ] **9.2.2.5** Team activity feed: see what colleagues have been capturing across shared directories

### 9.3 Web Dashboard Overhaul & Data Tables

- [ ] **9.3.1** Modular dashboard
  - [ ] **9.3.1.1** Replace single map + panel layout with configurable widget grid: map, activity feed, portfolio stats, quick actions, alerts
  - [ ] **9.3.1.2** Add mini stat cards above the map: total properties | recent snaps this week | inspections this month | portfolio value
  - [ ] **9.3.1.3** Add "Quick snap" widget — drag-and-drop photo upload from desktop for instant AI analysis without the iOS app
  - [ ] **9.3.1.4** Add "Recent alerts" widget — latest DA activity, comp sales, condition changes near portfolio
- [x] **9.3.2** Data table views
  - [x] **9.3.2.1** Add sortable/filterable table view as alternative to card grid on all list pages
  - [x] **9.3.2.2** Column customisation: show/hide fields per user preference
  - [x] **9.3.2.3** Bulk actions toolbar: select multiple records → delete, export, move to directory
  - [x] **9.3.2.4** CSV export on every list page (one click to download)
  - [x] **9.3.2.5** Excel export with formatted headers and data types
- [ ] **9.3.3** Web report builder
  - [ ] **9.3.3.1** Drag-and-drop report editor: add/remove/reorder sections (photos, analysis, comps, notes, spatial data)
  - [ ] **9.3.3.2** Customisable report templates: "Quick Snap Report", "Full Inspection Report", "Appraisal Report"
  - [ ] **9.3.3.3** PDF generation from web (matching iOS PDF quality and layout)
  - [ ] **9.3.3.4** Add company logo/branding watermark to generated reports

### 9.4 Portfolio Analytics & Smart Alerts

- [ ] **9.4.1** Portfolio overview (web)
  - [ ] **9.4.1.1** New dashboard widget: total properties, total inspections, average condition score, total appraised value
  - [ ] **9.4.1.2** Portfolio condition heatmap — colour-code properties on map by condition score (green=8+, amber=5-7, red=<5)
  - [ ] **9.4.1.3** Appraised portfolio value chart — stacked bar or treemap showing value by directory
  - [ ] **9.4.1.4** Condition trend chart — line graph of average condition score across inspections over time
- [ ] **9.4.2** Smart alerts
  - [ ] **9.4.2.1** Alert when a new comparable sale occurs within 1km of any portfolio property
  - [ ] **9.4.2.2** Alert when a DA is lodged within 200m of any portfolio property
  - [ ] **9.4.2.3** Alert when a Monitor property's condition score drops below configurable threshold
  - [ ] **9.4.2.4** Alerts configurable per property or per directory
  - [ ] **9.4.2.5** Alert delivery: push notification (iOS) + email digest (weekly)
- [ ] **9.4.3** Maintenance prediction
  - [ ] **9.4.3.1** Based on condition scores, building age, and material type — AI estimates when major maintenance will be needed
  - [ ] **9.4.3.2** Show maintenance timeline on property detail: "Roof replacement likely within 3-5 years"
  - [ ] **9.4.3.3** Aggregate across portfolio: "3 properties need attention within 12 months"

### 9.5 Voice-First Field Workflow

- [ ] **9.5.1** Hands-free inspection mode
  - [ ] **9.5.1.1** Add "Voice capture" toggle on inspection camera screen
  - [ ] **9.5.1.2** While active: continuous recording, AI transcribes speech in real-time
  - [ ] **9.5.1.3** Auto-segment transcription by time and match each segment to the nearest captured photo
  - [ ] **9.5.1.4** "Snap and narrate" — single gesture captures photo + starts 10-second voice recording for that photo
  - [ ] **9.5.1.5** AI structures raw voice notes into inspection report sections automatically (defects, materials, condition)
- [ ] **9.5.2** Follow-up questions
  - [ ] **9.5.2.1** After analysis, add a voice input field: "Ask a question about this property"
  - [ ] **9.5.2.2** AI has context: photo + analysis + spatial data — answers questions like "What's the likely construction era?" or "Would this roof need replacement within 5 years?"
  - [ ] **9.5.2.3** Display answer as text card, optionally read aloud with TTS for hands-free use

### 9.6 Progressive Web App (PWA)

- [x] **9.6.1** Offline capability
  - [x] **9.6.1.1** `npm install -D vite-plugin-pwa`
  - [x] **9.6.1.2** Configure service worker with runtime caching for API responses (stale-while-revalidate for lists, cache-first for detail pages)
  - [x] **9.6.1.3** Create `manifest.json`: name, icons, theme colour (#1C1917), background colour (#121110), display: standalone
  - [ ] **9.6.1.4** Cache recently viewed property data for offline access
  - [ ] **9.6.1.5** Queue mutations when offline (edits, deletes), sync on reconnection
  - [x] **9.6.1.6** Add "Install GroundTruth" prompt for mobile Chrome/Safari users
  - [x] **9.6.1.7** Show offline indicator banner when network is unavailable

### 9.7 AR Camera Overlay — "Live Lens"

The big bet. Highest effort, highest differentiation. Only attempt after everything above is solid.

- [ ] **9.7.1** Evaluate feasibility
  - [ ] **9.7.1.1** Prototype with ReactVision (ViroReact Expo plugin): overlay test data on camera feed
  - [ ] **9.7.1.2** Test performance on iPhone 12 (minimum viable device) — must maintain 30fps
  - [ ] **9.7.1.3** Test GPS accuracy in suburban NSW — determine if overlay positioning is usable
- [ ] **9.7.2** MVP "Live Lens" overlay
  - [ ] **9.7.2.1** GPS-triggered floating badges on camera feed: zoning code, last sale price, existing condition score (if previously snapped)
  - [ ] **9.7.2.2** Show DA activity indicator for properties with recent DAs within view
  - [ ] **9.7.2.3** Show hazard badges: bushfire prone, flood zone, heritage listed (from NSW spatial data)
  - [ ] **9.7.2.4** Tap a badge to expand into a detail card without leaving camera
- [ ] **9.7.3** AR walk mode
  - [ ] **9.7.3.1** During Explore walks, overlay live streetscape scores on camera feed
  - [ ] **9.7.3.2** Show directional arrows to nearest amenities (school, shops, train station)
  - [ ] **9.7.3.3** Show real-time walkability/safety score badge that updates as user moves

---

## Phase Summary

| Phase | Focus | When | Why This Order |
|-------|-------|------|----------------|
| **1** | Stop the bleeding | Week 1-2 | Security holes and perf issues that hurt every user right now |
| **2** | Legal & privacy | Week 2-3 | App Store and enterprise blocker — cannot onboard users without this |
| **3** | Observability | Week 3-4 | Need crash + analytics data before scaling — install early, collect from day one |
| **4** | Architecture | Week 4-6 | Clean code enables everything after — tests, features, React Query all depend on split services |
| **5** | Testing | Week 5-7 | Tests are written against the new clean architecture, not the old monolith |
| **6** | UX polish | Week 7-9 | With a stable tested base, make the product feel professional |
| **7** | Monetisation | Week 9-11 | Product is now stable, legal, polished — time to charge money |
| **8** | Platform + data | Week 11-14 | Revenue flowing — invest in Android, push notifications, deeper NSW data |
| **9** | Innovations | Week 14+ | Foundations are solid — build the features that make GroundTruth impossible to ignore |

Ship the fixes. Then ship the magic.
