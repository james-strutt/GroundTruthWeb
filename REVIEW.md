# GroundTruth: Brutal Review & Global Adoption Roadmap

## The Product in 30 Seconds

A genuinely compelling vertical SaaS for property professionals: AI-powered field intelligence via mobile camera. Snap, Inspect, Appraise, Monitor, Explore. The iOS app (Expo/React Native) is the core product; the web app (React/Vite) serves as a dashboard + landing page. Supabase backend with Edge Functions proxying OpenAI Vision.

**Honest assessment: This is a strong MVP for a single Australian state. It is nowhere near ready for global adoption.** Here's why, and what to do about it.

---

## 1. CRITICAL: Zero Test Coverage

**Both projects have zero tests.** No unit tests, no integration tests, no e2e tests. For an app handling property valuations and AI-driven assessments that professionals will rely on for financial decisions, this is a liability.

**Impact on global adoption:** No enterprise buyer will touch software with no test suite. No investor will be comfortable scaling something that can't prove it works.

### 1.1 Web App Unit & Integration Tests

- [ ] **1.1.1** Install Vitest, React Testing Library, and jsdom
  - [ ] **1.1.1.1** `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - [ ] **1.1.1.2** Add `test` script to `package.json`: `"test": "vitest", "test:ci": "vitest run --coverage"`
  - [ ] **1.1.1.3** Configure `vitest.config.ts` with jsdom environment, path aliases matching `vite.config.ts`
  - [ ] **1.1.1.4** Create `src/test/setup.ts` with `@testing-library/jest-dom` imports and Supabase client mock
- [ ] **1.1.2** Service layer tests (`src/services/`)
  - [ ] **1.1.2.1** Create mock Supabase client factory in `src/test/mocks/supabase.ts`
  - [ ] **1.1.2.2** Write tests for `api.ts` — all mapper functions (mapSnap, mapInspection, mapAppraisal, etc.)
  - [ ] **1.1.2.3** Write tests for `api.ts` — CRUD operations (listSnaps, getSnap, deleteSnap, etc.) with mocked Supabase
  - [ ] **1.1.2.4** Write tests for `api.ts` — `ensureAuthSessionLoaded` guard and `updateRowById` RLS verification
  - [ ] **1.1.2.5** Write tests for `aiService.ts` — `photoUrlToBase64`, `compressBlob`, JSON extraction from fenced responses
  - [ ] **1.1.2.6** Write tests for `daService.ts` — bounds queries and empty-state handling
  - [ ] **1.1.2.7** Write tests for `trainStationService.ts` — station/railway data parsing
- [ ] **1.1.3** Auth flow tests
  - [ ] **1.1.3.1** Test `AuthProvider` — initial session resolution, auth state change subscription, cleanup
  - [ ] **1.1.3.2** Test `ProtectedRoute` — redirects to `/login` when unauthenticated, renders children when authenticated
  - [ ] **1.1.3.3** Test `LoginPage` — form submission, error display, sign-up toggle, Google OAuth trigger
  - [ ] **1.1.3.4** Test waitlist form — email validation, duplicate handling (23505 error code), success state
- [ ] **1.1.4** Component tests
  - [ ] **1.1.4.1** Test `EditableText` — display mode, edit mode, save/cancel, voice recording states
  - [ ] **1.1.4.2** Test `ConfirmModal` — open/close, confirm/cancel callbacks
  - [ ] **1.1.4.3** Test `ImageEditModal` — prompt submission, loading states, error handling
  - [ ] **1.1.4.4** Test `Breadcrumb` — renders correct hierarchy, links navigate correctly
  - [ ] **1.1.4.5** Test `AddressSearch` — debounced input, result selection, keyboard navigation

### 1.2 Web App E2E Tests

- [ ] **1.2.1** Install and configure Playwright
  - [ ] **1.2.1.1** `npm install -D @playwright/test`
  - [ ] **1.2.1.2** Create `playwright.config.ts` — base URL, browser targets (Chromium, Firefox, WebKit)
  - [ ] **1.2.1.3** Create `e2e/` directory with test fixtures and auth helpers
- [ ] **1.2.2** Critical journey tests
  - [ ] **1.2.2.1** Landing page → waitlist signup → success message
  - [ ] **1.2.2.2** Login → dashboard map loads → pins render
  - [ ] **1.2.2.3** Navigate to snap list → click snap → detail page loads with AI analysis
  - [ ] **1.2.2.4** Navigate to properties → search address → property detail with activities
  - [ ] **1.2.2.5** Create directory → add property → verify in list
  - [ ] **1.2.2.6** Sign out → redirect to login → protected route blocked

### 1.3 iOS App Unit & Integration Tests

- [ ] **1.3.1** Install test dependencies
  - [ ] **1.3.1.1** Install Jest + React Native Testing Library: `npm install -D jest @testing-library/react-native jest-expo`
  - [ ] **1.3.1.2** Configure Jest in `package.json` with `jest-expo` preset
  - [ ] **1.3.1.3** Create mock factories for Supabase, AsyncStorage, expo-camera, expo-location
- [ ] **1.3.2** Service layer tests
  - [ ] **1.3.2.1** Test `genericStorage.ts` — save, list, get, update, remove, count, clear
  - [ ] **1.3.2.2** Test each feature storage adapter (snapStorage, inspectionStorage, etc.)
  - [ ] **1.3.2.3** Test `authService.ts` — signIn, signUp, signOut, signInWithGoogle, session resolution
  - [ ] **1.3.2.4** Test `visionService.ts` — edge function call, response parsing, error handling
  - [ ] **1.3.2.5** Test each AI analyser (snapAnalyser, inspectAnalyser, etc.) — prompt construction, result mapping
  - [ ] **1.3.2.6** Test `pdfService.ts` — report generation with mock data
  - [ ] **1.3.2.7** Test `offlineQueue.ts` — queue, retry, dequeue logic
- [ ] **1.3.3** Component tests
  - [ ] **1.3.3.1** Test `SubscriptionGate` — blocks gated features for free tier, allows for pro
  - [ ] **1.3.3.2** Test `ErrorBoundary` — catches errors, renders fallback UI
  - [ ] **1.3.3.3** Test UI primitives (Button, Card, Modal, Toast, TextField) — props, states, accessibility
  - [ ] **1.3.3.4** Test `EmptyState` — renders correct messaging per feature type

### 1.4 iOS App E2E Tests

- [ ] **1.4.1** Install and configure Detox
  - [ ] **1.4.1.1** `npm install -D detox @types/detox`
  - [ ] **1.4.1.2** Create `.detoxrc.js` with iOS simulator configuration
  - [ ] **1.4.1.3** Create test helpers for auth state setup
- [ ] **1.4.2** Critical journey tests
  - [ ] **1.4.2.1** Login → home tab → map renders
  - [ ] **1.4.2.2** Snap tab → camera opens → capture photo → AI analysis returns
  - [ ] **1.4.2.3** Inspect tab → multi-photo capture → report generation
  - [ ] **1.4.2.4** Monitor tab → add property → baseline captured
  - [ ] **1.4.2.5** Explore tab → start walk → GPS tracking → end walk → analysis

### 1.5 CI/CD Integration

- [ ] **1.5.1** Add GitHub Actions workflow
  - [ ] **1.5.1.1** Create `.github/workflows/ci.yml` for web: lint, typecheck, test, build
  - [ ] **1.5.1.2** Create `.github/workflows/ci-mobile.yml` for iOS: lint, typecheck, test
  - [ ] **1.5.1.3** Add Playwright E2E job running against Vite preview server
  - [ ] **1.5.1.4** Add coverage reporting (Codecov or Coveralls)
  - [ ] **1.5.1.5** Add branch protection rules requiring CI pass before merge

---

## 2. CRITICAL: No Internationalisation (i18n)

Every single string in both apps is hardcoded in Australian English. No translation framework exists.

**Impact on global adoption:** This is a complete blocker. You cannot serve the UK, US, EU, or APAC markets with hardcoded "NSW Spatial Data" references and Australian-specific terminology.

### 2.1 Web App i18n Setup

- [ ] **2.1.1** Install and configure react-i18next
  - [ ] **2.1.1.1** `npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend`
  - [ ] **2.1.1.2** Create `src/i18n/config.ts` — initialise i18next with language detector, fallback `en-AU`
  - [ ] **2.1.1.3** Create `src/i18n/locales/en-AU/` directory structure with namespace files
  - [ ] **2.1.1.4** Wrap `<App />` in `<I18nextProvider>` in `main.tsx`
- [ ] **2.1.2** Extract all hardcoded strings — landing page
  - [ ] **2.1.2.1** Create `landing.json` namespace — Nav, Hero, Features, SocialProof, HowItWorks, CTA, Footer
  - [ ] **2.1.2.2** Replace all strings in `App.tsx` with `t('landing:hero.title')` pattern
  - [ ] **2.1.2.3** Replace FEATURES array descriptions with translation keys
  - [ ] **2.1.2.4** Replace Step component static text with keys
- [ ] **2.1.3** Extract all hardcoded strings — app shell
  - [ ] **2.1.3.1** Create `nav.json` namespace — sidebar labels, mobile nav labels, sign out
  - [ ] **2.1.3.2** Create `auth.json` namespace — login form, sign up, error messages
  - [ ] **2.1.3.3** Create `common.json` namespace — shared terms (address, suburb, latitude, delete, cancel, save)
- [ ] **2.1.4** Extract all hardcoded strings — feature pages
  - [ ] **2.1.4.1** Create `snaps.json` — list headers, detail labels, AI analysis field names
  - [ ] **2.1.4.2** Create `inspections.json` — defect types, severity labels, report sections
  - [ ] **2.1.4.3** Create `appraisals.json` — comparable fields, price estimate labels, methodology text
  - [ ] **2.1.4.4** Create `monitor.json` — change detection labels, alert messages
  - [ ] **2.1.4.5** Create `walks.json` — score categories, segment labels, narrative sections
  - [ ] **2.1.4.6** Create `directories.json` — CRUD labels, property list headers
  - [ ] **2.1.4.7** Create `dashboard.json` — map controls, layer names, activity panel labels
- [ ] **2.1.5** Add language switcher
  - [ ] **2.1.5.1** Create `LanguageSwitcher` component in `src/components/shared/`
  - [ ] **2.1.5.2** Add to `AppLayout` sidebar footer and mobile header
  - [ ] **2.1.5.3** Persist selected language to localStorage

### 2.2 iOS App i18n Setup

- [ ] **2.2.1** Install and configure
  - [ ] **2.2.1.1** `npm install react-i18next i18next @os-team/i18next-react-native-language-detector`
  - [ ] **2.2.1.2** Create `i18n/config.ts` matching web namespace structure for shared translation keys
  - [ ] **2.2.1.3** Create `i18n/locales/en-AU/` with matching namespace files
  - [ ] **2.2.1.4** Wrap root `_layout.tsx` in `<I18nextProvider>`
- [ ] **2.2.2** Extract all hardcoded strings across all 40+ screens
  - [ ] **2.2.2.1** Tab labels in `(tabs)/_layout.tsx`
  - [ ] **2.2.2.2** All screen headers, button labels, form placeholders
  - [ ] **2.2.2.3** AI analysis result labels and narratives
  - [ ] **2.2.2.4** Error messages and empty states
  - [ ] **2.2.2.5** Subscription gate messages and upgrade prompts
- [ ] **2.2.3** Add in-app language selection
  - [ ] **2.2.3.1** Add language picker to Settings screen
  - [ ] **2.2.3.2** Persist to AsyncStorage, detect device locale on first launch

### 2.3 Locale-Aware Formatting

- [ ] **2.3.1** Currency formatting
  - [ ] **2.3.1.1** Create `src/utils/formatCurrency.ts` — uses `Intl.NumberFormat` with locale + currency code
  - [ ] **2.3.1.2** Replace all hardcoded `$` and `toFixed()` calls in appraisal pages with `formatCurrency()`
  - [ ] **2.3.1.3** Add currency configuration per market (AUD, GBP, USD, EUR, etc.)
- [ ] **2.3.2** Date formatting
  - [ ] **2.3.2.1** Create `src/utils/formatDate.ts` — uses `Intl.DateTimeFormat` with locale
  - [ ] **2.3.2.2** Replace all `new Date().toLocaleDateString()` and manual date formatting
- [ ] **2.3.3** Measurement units
  - [ ] **2.3.3.1** Create `src/utils/formatArea.ts` — sqm for metric markets, sqft for imperial markets
  - [ ] **2.3.3.2** Create `src/utils/formatDistance.ts` — metres/km vs feet/miles
  - [ ] **2.3.3.3** Add unit preference to user profile or derive from locale

### 2.4 First Additional Locale

- [ ] **2.4.1** Create `en-GB` locale
  - [ ] **2.4.1.1** Copy `en-AU` as base, adjust terminology (valuation vs appraisal, surveyor vs inspector)
  - [ ] **2.4.1.2** Adjust regulatory references (RICS standards vs AS 4349.1)
  - [ ] **2.4.1.3** Adjust spatial data labels (council vs LGA, planning permission vs DA)
- [ ] **2.4.2** Create `en-US` locale
  - [ ] **2.4.2.1** Adjust terminology (home inspection, MLS comps, zoning codes)
  - [ ] **2.4.2.2** Adjust measurement defaults to imperial (sqft, miles)
  - [ ] **2.4.2.3** Adjust currency to USD

---

## 3. CRITICAL: Australia-Only Data Architecture — Going Global

The entire product is locked to NSW, Australia. This section combines the original finding with detailed research into how to make GroundTruth work globally.

### 3.1 Market Abstraction Layer

- [ ] **3.1.1** Design the market provider interface
  - [ ] **3.1.1.1** Create `src/services/markets/types.ts` — define `MarketProvider` interface:
    ```
    interface MarketProvider {
      id: string;                    // e.g. 'au-nsw', 'uk', 'us-ca'
      name: string;                  // e.g. 'New South Wales, Australia'
      locale: string;                // e.g. 'en-AU'
      currency: string;              // e.g. 'AUD'
      measurementSystem: 'metric' | 'imperial';
      inspectionStandard: string;    // e.g. 'AS 4349.1-2007'
      geocoder: GeocoderAdapter;
      spatialData: SpatialDataAdapter;
      comparableSales: ComparableSalesAdapter;
      planningData: PlanningDataAdapter;
      transitData: TransitDataAdapter;
      buildingFootprints: BuildingFootprintAdapter;
      aiPromptContext: MarketPromptContext;
    }
    ```
  - [ ] **3.1.1.2** Define adapter interfaces for each data source type (geocoder, spatial, comps, planning, transit)
  - [ ] **3.1.1.3** Create `MarketContext` React context to provide the active market throughout the app
  - [ ] **3.1.1.4** Create `useMarket()` hook for components to access market-specific configuration
- [ ] **3.1.2** Refactor existing NSW code into first market provider
  - [ ] **3.1.2.1** Move `daService.ts` → `services/markets/au-nsw/planningData.ts` implementing `PlanningDataAdapter`
  - [ ] **3.1.2.2** Move `trainStationService.ts` → `services/markets/au-nsw/transitData.ts` implementing `TransitDataAdapter`
  - [ ] **3.1.2.3** Extract NSW-specific AI prompt context from `aiPrompts.ts` into `services/markets/au-nsw/promptContext.ts`
  - [ ] **3.1.2.4** Extract NSW spatial data types from `common.ts` into `services/markets/au-nsw/types.ts`
  - [ ] **3.1.2.5** Create `services/markets/au-nsw/index.ts` assembling the full `MarketProvider`
- [ ] **3.1.3** Add market selection to user profile
  - [ ] **3.1.3.1** Add `market` column to Supabase `users` table
  - [ ] **3.1.3.2** Add market selector to iOS settings screen
  - [ ] **3.1.3.3** Add market selector to web app settings/profile
  - [ ] **3.1.3.4** Auto-detect market from device locale/GPS on first launch

### 3.2 Global Geocoding Strategy (Mapbox)

You already use Mapbox GL for maps. Mapbox Geocoding v6 provides global coverage and should be your primary geocoder.

- [ ] **3.2.1** Implement Mapbox geocoding adapter
  - [ ] **3.2.1.1** Create `src/services/geocoding/mapboxGeocoder.ts` using Mapbox Geocoding API v6
  - [ ] **3.2.1.2** Implement forward geocoding (address → coordinates) with Smart Address Match confidence scoring
  - [ ] **3.2.1.3** Implement reverse geocoding (coordinates → address) for camera snap geolocation
  - [ ] **3.2.1.4** Implement batch geocoding (up to 1,000 queries) for bulk property imports
  - [ ] **3.2.1.5** Add address autocomplete/suggestions for the `AddressSearch` component
  - [ ] **3.2.1.6** Configure `country` parameter per market to scope results (e.g. `gb` for UK, `us` for US)
- [ ] **3.2.2** Integrate Mapbox Boundaries (enterprise tier)
  - [ ] **3.2.2.1** Evaluate Mapbox Boundaries for administrative, postal, and statistical boundary polygons
  - [ ] **3.2.2.2** Replace NSW-specific LGA/council boundaries with Mapbox admin boundaries
  - [ ] **3.2.2.3** Use Mapbox point-in-polygon for zoning/jurisdiction lookups

### 3.3 Global Building Footprint Data (Free/Open Sources)

Three massive open datasets provide building footprints globally:

| Source | Coverage | Footprints | Format | Licence |
|--------|----------|------------|--------|---------|
| **Overture Maps Foundation** | Global | 2.3 billion | GeoParquet | ODbL/Community |
| **Google + Microsoft Combined** | Global (92% admin boundaries) | 2.5 billion | GeoParquet, FlatGeobuf, PMTiles | ODbL |
| **OpenStreetMap** | Global (variable density) | ~500M+ | Overpass API / Extracts | ODbL |

- [ ] **3.3.1** Integrate Overture Maps building data
  - [ ] **3.3.1.1** Evaluate Overture's GeoParquet building dataset for target markets
  - [ ] **3.3.1.2** Set up a PostGIS or serverless query layer to serve building footprints by bounding box
  - [ ] **3.3.1.3** Add building footprint overlay to the map dashboard as a toggleable layer
  - [ ] **3.3.1.4** Use Overture's GERS (Global Entity Reference System) IDs for stable building references
- [ ] **3.3.2** Integrate OpenStreetMap via Overpass API
  - [ ] **3.3.2.1** Create `src/services/osm/overpassAdapter.ts` for querying buildings, amenities, land use
  - [ ] **3.3.2.2** Query building tags (height, levels, material, roof type) to enrich AI snap analysis
  - [ ] **3.3.2.3** Query amenity data (schools, shops, transport) for walk/explore scoring
  - [ ] **3.3.2.4** Implement caching layer to avoid hammering public Overpass instances
- [ ] **3.3.3** Google Solar/Building Insights API (supplementary)
  - [ ] **3.3.3.1** Evaluate Google Solar API for building dimensions, roof area, and solar potential data
  - [ ] **3.3.3.2** Integrate `buildingInsights.findClosest` endpoint for property enrichment
  - [ ] **3.3.3.3** Coverage: North America, Europe, Oceania — use as supplement, not primary source

### 3.4 Comparable Sales Data Per Market

This is the hardest data problem. There is no single global comparable sales API. Strategy: integrate government open data per market.

- [ ] **3.4.1** Australia (current — expand beyond NSW)
  - [ ] **3.4.1.1** Abstract current NSW comp data source behind `ComparableSalesAdapter`
  - [ ] **3.4.1.2** Add VIC, QLD, SA, WA state data sources (each state has different portals)
- [ ] **3.4.2** United Kingdom
  - [ ] **3.4.2.1** Integrate HM Land Registry Price Paid Data (free, covers England & Wales since 1995)
  - [ ] **3.4.2.2** API endpoint: `landregistry.data.gov.uk` — RESTful JSON, monthly updates
  - [ ] **3.4.2.3** Integrate EPC (Energy Performance Certificate) data for property enrichment
  - [ ] **3.4.2.4** Map UK property types to GroundTruth schema (detached, semi, terrace, flat)
- [ ] **3.4.3** United States
  - [ ] **3.4.3.1** Evaluate ATTOM API for US property data (158M properties, 3,000 counties, AVM included)
  - [ ] **3.4.3.2** Alternatively evaluate free county assessor data feeds (variable quality per county)
  - [ ] **3.4.3.3** Integrate Zillow/Redfin public data where available via APIs
  - [ ] **3.4.3.4** Map US property types and zoning codes to GroundTruth schema
- [ ] **3.4.4** Europe
  - [ ] **3.4.4.1** Investigate INSPIRE cadastre data (EU-wide initiative, variable per country)
  - [ ] **3.4.4.2** France: Integrate API Cadastre (IGN) for parcel data + DVF (property transactions, open data)
  - [ ] **3.4.4.3** Netherlands: Integrate Kadaster open data for property transactions
  - [ ] **3.4.4.4** Germany: Investigate Gutachterausschuss (committee of valuers) data availability per state

### 3.5 Planning/Zoning Data Per Market

- [ ] **3.5.1** Design `PlanningDataAdapter` interface
  - [ ] **3.5.1.1** Define common fields: zoning code, zoning description, permitted uses, FSR/FAR, height limit, heritage status
  - [ ] **3.5.1.2** Allow market-specific extensions (e.g. UK conservation areas, US overlay districts)
- [ ] **3.5.2** UK planning data
  - [ ] **3.5.2.1** Integrate Planning Portal API for planning applications (equivalent to NSW DAs)
  - [ ] **3.5.2.2** Integrate local authority planning constraint data
- [ ] **3.5.3** US zoning data
  - [ ] **3.5.3.1** Evaluate Regrid/Loveland parcel + zoning API (commercial, covers most US jurisdictions)
  - [ ] **3.5.3.2** Evaluate free municipal open data portals for major metros
- [ ] **3.5.4** Global transit data
  - [ ] **3.5.4.1** Replace NSW-specific `trainStationService.ts` with OpenStreetMap Overpass queries for transit
  - [ ] **3.5.4.2** Query `railway=station`, `highway=bus_stop`, `amenity=ferry_terminal` globally
  - [ ] **3.5.4.3** Optionally integrate GTFS feeds for service frequency data

### 3.6 AI Prompt Internationalisation

- [ ] **3.6.1** Parameterise inspection standards
  - [ ] **3.6.1.1** Replace hardcoded "AS 4349.1-2007" with market-configured inspection standard:
    - Australia: AS 4349.1-2007
    - UK: RICS Home Survey Level 2/3
    - US: InterNACHI SOP / ASTM E2018 (commercial)
    - NZ: NZS 4306:2005
    - Canada: CAHPI/CSA A770
  - [ ] **3.6.1.2** Map defect severity/type codes to each standard's classification system
  - [ ] **3.6.1.3** Adjust AI prompt language for construction terminology per market (e.g. "cladding" vs "siding")
- [ ] **3.6.2** Parameterise spatial data context in prompts
  - [ ] **3.6.2.1** Replace "NSW spatial data" references with dynamic market context
  - [ ] **3.6.2.2** Include market-appropriate planning terminology in snap prompts
  - [ ] **3.6.2.3** Include market-appropriate comparable sale context in appraise prompts
- [ ] **3.6.3** Adjust AI response parsing per market
  - [ ] **3.6.3.1** Property type classifications differ (AU: unit/house/townhouse vs UK: flat/detached/semi vs US: condo/SFH/townhome)
  - [ ] **3.6.3.2** Construction material vocabulary differs (AU: fibro/weatherboard vs UK: brick/pebbledash vs US: vinyl siding/stucco)

---

## 4. SECURITY: Significant Gaps

### 4.1 Web Security Headers

- [ ] **4.1.1** Add security headers to `vercel.json`
  - [ ] **4.1.1.1** Add `Content-Security-Policy` — restrict script-src to self + Supabase + Mapbox domains
  - [ ] **4.1.1.2** Add `X-Frame-Options: DENY` — prevent clickjacking
  - [ ] **4.1.1.3** Add `X-Content-Type-Options: nosniff` — prevent MIME sniffing
  - [ ] **4.1.1.4** Add `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] **4.1.1.5** Add `Permissions-Policy` — disable unused APIs (camera, microphone on web — these are mobile features)
  - [ ] **4.1.1.6** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - [ ] **4.1.1.7** Test all headers with securityheaders.com and Mozilla Observatory

### 4.2 API Security

- [ ] **4.2.1** Fix edge function auth pattern
  - [ ] **4.2.1.1** In `aiService.ts`, replace direct `supabaseKey` header usage with user's JWT from `supabase.auth.getSession()`
  - [ ] **4.2.1.2** Update edge functions to validate the JWT and enforce per-user rate limits
  - [ ] **4.2.1.3** Add server-side rate limiting on the `openai-vision` edge function (e.g. 20 calls/user/hour)
  - [ ] **4.2.1.4** Add server-side rate limiting on the `gemini-image-edit` edge function
- [ ] **4.2.2** Client-side rate limiting
  - [ ] **4.2.2.1** Add debounce/cooldown to the "Re-analyse" button (prevent spam clicks)
  - [ ] **4.2.2.2** Add debounce/cooldown to the AI image edit submission
  - [ ] **4.2.2.3** Show remaining daily quota in the UI (aligns with subscription tier limits)
- [ ] **4.2.3** Input sanitisation
  - [ ] **4.2.3.1** Sanitise the `editPrompt` in `editImageWithAI` before sending to Gemini edge function
  - [ ] **4.2.3.2** Add prompt injection guardrails (strip system-level instructions from user input)
  - [ ] **4.2.3.3** Validate and sanitise address inputs before passing to Supabase `ilike` queries
  - [ ] **4.2.3.4** Add length limits to all text input fields (edit prompts, voice notes, property notes)

### 4.3 Privacy & Compliance

- [ ] **4.3.1** Privacy policy
  - [ ] **4.3.1.1** Draft privacy policy covering: data collected, processing purpose, storage location, retention period, third-party sharing (Supabase, OpenAI, Google, Mapbox)
  - [ ] **4.3.1.2** Create `/privacy` route on web app
  - [ ] **4.3.1.3** Add privacy policy screen to iOS app settings
  - [ ] **4.3.1.4** Link from landing page footer, login page, and app store listing
- [ ] **4.3.2** Terms of service
  - [ ] **4.3.2.1** Draft ToS covering: acceptable use, AI disclaimer (not a substitute for professional advice), data ownership, subscription terms
  - [ ] **4.3.2.2** Create `/terms` route on web app
  - [ ] **4.3.2.3** Add ToS screen to iOS app
- [ ] **4.3.3** GDPR compliance
  - [ ] **4.3.3.1** Add cookie consent banner to web app (only needed if using analytics/tracking cookies)
  - [ ] **4.3.3.2** Implement data export endpoint — user can download all their data as JSON/CSV
  - [ ] **4.3.3.3** Implement account deletion — full data purge from Supabase + storage
  - [ ] **4.3.3.4** Add "Delete my account" to iOS settings and web profile
  - [ ] **4.3.3.5** Add data processing agreement (DPA) template for enterprise customers
  - [ ] **4.3.3.6** Document lawful basis for processing (legitimate interest for core features, consent for AI analysis)
- [ ] **4.3.4** Location data consent
  - [ ] **4.3.4.1** Add explicit location data consent screen before first walk session
  - [ ] **4.3.4.2** Allow users to view and delete their location history (walk routes)
  - [ ] **4.3.4.3** Add option to disable background location tracking

### 4.4 iOS Security

- [ ] **4.4.1** Certificate pinning
  - [ ] **4.4.1.1** Implement SSL pinning for Supabase API endpoint using a custom fetch adapter
  - [ ] **4.4.1.2** Add pinned certificate rotation strategy (pin backup cert + primary)
- [ ] **4.4.2** Sensitive data audit
  - [ ] **4.4.2.1** Audit all AsyncStorage usage — ensure no auth tokens, API keys, or PII in plain storage
  - [ ] **4.4.2.2** Ensure all sensitive data uses `expo-secure-store` (encrypted keychain)
  - [ ] **4.4.2.3** Add biometric lock option for app access (Face ID / Touch ID)

---

## 5. PERFORMANCE: Bundle Size & Code Splitting

### 5.1 Route-Level Code Splitting (Web)

- [ ] **5.1.1** Convert all page imports to lazy loading
  - [ ] **5.1.1.1** Replace all 14 static imports in `main.tsx` with `React.lazy(() => import(...))`
  - [ ] **5.1.1.2** Wrap `<Routes>` content in `<Suspense fallback={<LoadingSpinner />}>`
  - [ ] **5.1.1.3** Group related routes with shared Suspense boundaries (e.g. snaps list + detail share one)
  - [ ] **5.1.1.4** Verify chunk generation with `npx vite build && ls -la dist/assets/*.js`
- [ ] **5.1.2** Lazy-load Mapbox GL
  - [ ] **5.1.2.1** Dynamic import `react-map-gl/mapbox` and `mapbox-gl/dist/mapbox-gl.css` only in Dashboard
  - [ ] **5.1.2.2** Show skeleton map placeholder while Mapbox chunk loads
  - [ ] **5.1.2.3** Verify Mapbox is NOT in the initial bundle (should save ~800KB-1MB)

### 5.2 Vite Build Optimisation

- [ ] **5.2.1** Configure `vite.config.ts`
  - [ ] **5.2.1.1** Add `build.rollupOptions.output.manualChunks` to split: `react-vendor` (react, react-dom, react-router), `mapbox` (mapbox-gl, react-map-gl), `supabase` (@supabase/supabase-js)
  - [ ] **5.2.1.2** Install and configure `vite-plugin-compression` for gzip + brotli pre-compression
  - [ ] **5.2.1.3** Add `build.reportCompressedSize: true` to monitor bundle sizes
  - [ ] **5.2.1.4** Add `rollup-plugin-visualizer` for treemap analysis of bundle composition
  - [ ] **5.2.1.5** Set `build.target: 'es2020'` to enable modern JS output (smaller bundles)

### 5.3 Rendering Performance (Web)

- [ ] **5.3.1** Memoize expensive Dashboard computations
  - [ ] **5.3.1.1** Wrap `stationsGeoJson` (line 120-127) in `useMemo` depending on `trainStations`
  - [ ] **5.3.1.2** Wrap `daGeoJson` (line 129-144) in `useMemo` depending on `daPoints`
  - [ ] **5.3.1.3** Wrap `walkRoutes` FeatureCollection construction in `useMemo`
  - [ ] **5.3.1.4** Memoize `handleLayerToggle` and `handleLayerOpacity` callbacks (already done — verify stable)
- [ ] **5.3.2** Add list virtualisation
  - [ ] **5.3.2.1** Install `@tanstack/react-virtual` or `react-window`
  - [ ] **5.3.2.2** Virtualise SnapList, InspectionList, AppraisalList, MonitorList, WalkList, PropertyList
  - [ ] **5.3.2.3** Test with 200+ items to verify smooth scrolling
- [ ] **5.3.3** Image optimisation
  - [ ] **5.3.3.1** Add `loading="lazy"` to all property photo `<img>` tags
  - [ ] **5.3.3.2** Add `width` and `height` attributes to prevent layout shift (CLS)
  - [ ] **5.3.3.3** Use Supabase Storage image transforms for responsive thumbnails (if supported)
  - [ ] **5.3.3.4** Convert landing page phone mockup images to WebP format

### 5.4 Font Optimisation

- [ ] **5.4.1** Optimise web font loading
  - [ ] **5.4.1.1** Add `<link rel="preload">` for DM Serif Display, Public Sans, and JetBrains Mono
  - [ ] **5.4.1.2** Use `font-display: swap` to prevent FOIT
  - [ ] **5.4.1.3** Subset fonts to Latin character set only (unless targeting CJK markets)
  - [ ] **5.4.1.4** Self-host fonts instead of loading from Google Fonts CDN (faster, privacy-compliant)

### 5.5 iOS Performance

- [ ] **5.5.1** Turf.js tree-shaking
  - [ ] **5.5.1.1** Replace `import * as turf from '@turf/turf'` with individual imports: `import { distance } from '@turf/distance'`
  - [ ] **5.5.1.2** Audit all Turf usage and list only the functions actually used
  - [ ] **5.5.1.3** Verify bundle size reduction with `npx expo export --dump-sourcemap`
- [ ] **5.5.2** Image compression
  - [ ] **5.5.2.1** Compress captured photos before upload (currently done in web `aiService.ts` but verify iOS does the same)
  - [ ] **5.5.2.2** Generate thumbnails locally for list views instead of loading full-resolution images

---

## 6. FRONTEND DESIGN & UX

### 6.1 Accessibility (a11y)

- [ ] **6.1.1** ARIA audit — interactive components
  - [ ] **6.1.1.1** Add `role="tablist"`, `role="tab"`, `aria-selected` to landing page feature tabs
  - [ ] **6.1.1.2** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to ConfirmModal and ImageEditModal
  - [ ] **6.1.1.3** Add `aria-live="polite"` to loading states and async operation feedback
  - [ ] **6.1.1.4** Add `aria-label` to all icon-only buttons (delete, edit, refresh, etc.)
  - [ ] **6.1.1.5** Add `aria-expanded` to collapsible sections in detail pages
  - [ ] **6.1.1.6** Add `aria-describedby` linking form inputs to error messages
- [ ] **6.1.2** Keyboard navigation
  - [ ] **6.1.2.1** Ensure all interactive elements are focusable and operable with keyboard
  - [ ] **6.1.2.2** Add keyboard shortcuts for map controls (zoom in/out, toggle layers)
  - [ ] **6.1.2.3** Add Escape key to close modals, cancel editing
  - [ ] **6.1.2.4** Add focus trap within modals (Tab cycling stays inside)
  - [ ] **6.1.2.5** Add visible focus indicators (`:focus-visible` styles) to all interactive elements
- [ ] **6.1.3** Screen reader support
  - [ ] **6.1.3.1** Add meaningful `alt` text to all property photos (include address and feature type)
  - [ ] **6.1.3.2** Add `aria-label` to the map container describing its purpose
  - [ ] **6.1.3.3** Announce route changes to screen readers (add `aria-live` region or use React Router's built-in)
  - [ ] **6.1.3.4** Test with VoiceOver (macOS), NVDA (Windows), and TalkBack (Android)
- [ ] **6.1.4** Colour contrast
  - [ ] **6.1.4.1** Audit all text/background combinations against WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large)
  - [ ] **6.1.4.2** The muted text colour `#8a8279` on dark background `#121110` may be below threshold — verify and fix
  - [ ] **6.1.4.3** Ensure map pin colours are distinguishable for colour-blind users (add shape/icon differentiation)

### 6.2 Mobile Web Navigation

- [ ] **6.2.1** Landing page mobile menu
  - [ ] **6.2.1.1** Add hamburger menu icon for screens < 768px
  - [ ] **6.2.1.2** Create slide-in or dropdown mobile nav with all links (Features, How it works, Sign in)
  - [ ] **6.2.1.3** Add body scroll lock when mobile menu is open
- [ ] **6.2.2** Mobile dashboard improvements
  - [ ] **6.2.2.1** Replace drag-to-resize panel with a BottomSheet pattern (snap to 30%/60%/100%)
  - [ ] **6.2.2.2** Add swipe-up gesture to expand activity panel
  - [ ] **6.2.2.3** Show condensed activity cards on mobile (hide less critical fields)

### 6.3 Loading, Error, and Empty States

- [ ] **6.3.1** Skeleton loaders
  - [ ] **6.3.1.1** Create `SkeletonCard` component matching FeatureCard dimensions
  - [ ] **6.3.1.2** Add skeleton loading to all list pages (SnapList, InspectionList, etc.)
  - [ ] **6.3.1.3** Add skeleton loading to detail pages while data fetches
  - [ ] **6.3.1.4** Add skeleton loading to Dashboard while pins/activity loads
- [ ] **6.3.2** Empty states
  - [ ] **6.3.2.1** Create `EmptyState` web component (illustration + message + CTA)
  - [ ] **6.3.2.2** Add empty states to all list pages: "No snaps yet — capture your first property from the iOS app"
  - [ ] **6.3.2.3** Add empty state to Dashboard when no pins exist
  - [ ] **6.3.2.4** Add empty state to property detail when no activities exist
- [ ] **6.3.3** Error boundaries
  - [ ] **6.3.3.1** Create `ErrorBoundary` component with retry button and error reporting
  - [ ] **6.3.3.2** Wrap each route in an error boundary in `main.tsx`
  - [ ] **6.3.3.3** Add global error boundary at the app root
  - [ ] **6.3.3.4** Create a `NotFound` page and add catch-all `<Route path="*">` in `main.tsx`
- [ ] **6.3.4** Toast notification system
  - [ ] **6.3.4.1** Create `Toast` component and `ToastProvider` context
  - [ ] **6.3.4.2** Replace `alert()` calls (e.g. `SnapDetail.tsx` line 58) with toast notifications
  - [ ] **6.3.4.3** Add success toasts for save, delete, re-analyse operations
  - [ ] **6.3.4.4** Add error toasts for failed operations

---

## 7. ARCHITECTURE: Web-Specific Issues

### 7.1 API Layer Refactor

- [ ] **7.1.1** Split `api.ts` (1,003 lines) into per-feature services
  - [ ] **7.1.1.1** Create `src/services/snapService.ts` — listSnaps, getSnap, deleteSnap, updateSnapAnalysisField, updateSnapField
  - [ ] **7.1.1.2** Create `src/services/inspectionService.ts` — listInspections, getInspection, deleteInspection, updateInspectionPhotoAnalysis, deleteInspectionPhoto
  - [ ] **7.1.1.3** Create `src/services/appraisalService.ts` — listAppraisals, getAppraisal, deleteAppraisal, updateAppraisalEstimateField, updateAppraisalCompSelections
  - [ ] **7.1.1.4** Create `src/services/monitorService.ts` — listWatched, getWatched, deleteWatched
  - [ ] **7.1.1.5** Create `src/services/walkService.ts` — listWalks, getWalk, deleteWalk, updateWalkField, getWalkRoutes
  - [ ] **7.1.1.6** Create `src/services/directoryService.ts` — CRUD + listPropertiesByDirectory
  - [ ] **7.1.1.7** Create `src/services/propertyService.ts` — CRUD + getPropertyActivities
  - [ ] **7.1.1.8** Create `src/services/dashboardService.ts` — getAllPins, getRecentActivity
  - [ ] **7.1.1.9** Keep `src/services/shared/supabaseHelpers.ts` — ensureAuthSessionLoaded, updateRowById, deleteRowById
  - [ ] **7.1.1.10** Re-export all from `src/services/index.ts` barrel file for backwards compatibility
- [ ] **7.1.2** Fix typing
  - [ ] **7.1.2.1** Generate Supabase types: `npx supabase gen types typescript --project-id <id> > src/types/database.ts`
  - [ ] **7.1.2.2** Replace all `any` in mapper functions with generated row types
  - [ ] **7.1.2.3** Remove all 11 `eslint-disable @typescript-eslint/no-explicit-any` comments

### 7.2 Data Fetching Layer

- [ ] **7.2.1** Install and configure TanStack Query (React Query)
  - [ ] **7.2.1.1** `npm install @tanstack/react-query @tanstack/react-query-devtools`
  - [ ] **7.2.1.2** Add `QueryClientProvider` to `main.tsx` with sensible defaults (staleTime: 5min, gcTime: 30min)
  - [ ] **7.2.1.3** Add React Query DevTools in development mode
- [ ] **7.2.2** Convert data fetching to query hooks
  - [ ] **7.2.2.1** Create `src/hooks/useSnaps.ts` — `useQuery(['snaps'], listSnaps)` + `useQuery(['snap', id], () => getSnap(id))`
  - [ ] **7.2.2.2** Create `src/hooks/useInspections.ts` — same pattern
  - [ ] **7.2.2.3** Create `src/hooks/useAppraisals.ts` — same pattern
  - [ ] **7.2.2.4** Create `src/hooks/useProperties.ts` — same pattern
  - [ ] **7.2.2.5** Create `src/hooks/useDashboard.ts` — pins + activity + walk routes
  - [ ] **7.2.2.6** Create `src/hooks/useDirectories.ts` — same pattern
- [ ] **7.2.3** Add mutation hooks with optimistic updates
  - [ ] **7.2.3.1** Create mutation hooks for delete operations (invalidate list query on success)
  - [ ] **7.2.3.2** Create mutation hooks for update operations (optimistic update + rollback on failure)
  - [ ] **7.2.3.3** Create mutation hooks for create operations (add to cache on success)

### 7.3 Routing Improvements

- [ ] **7.3.1** Add missing routes
  - [ ] **7.3.1.1** Add `<Route path="*" element={<NotFoundPage />} />` catch-all
  - [ ] **7.3.1.2** Add `/app/settings` route for user profile, market selection, preferences
- [ ] **7.3.2** Fix property routing
  - [ ] **7.3.2.1** Replace `/app/properties/:address` with `/app/properties/:id` (ID-based)
  - [ ] **7.3.2.2** Update all `navigate()` calls and `<Link>` references
  - [ ] **7.3.2.3** Add redirect from old address-based URLs to new ID-based URLs

---

## 8. iOS APP: Strengths & Gaps

### 8.1 Android Support

- [ ] **8.1.1** Enable and test Android
  - [ ] **8.1.1.1** Deduplicate Android permissions in `app.json` (currently listed twice)
  - [ ] **8.1.1.2** Run `expo prebuild --platform android` and verify build succeeds
  - [ ] **8.1.1.3** Test all five feature flows on Android emulator (Pixel 7 API 34)
  - [ ] **8.1.1.4** Test camera capture, GPS, and compass on physical Android device
  - [ ] **8.1.1.5** Fix any platform-specific rendering issues (shadows, fonts, safe areas)
  - [ ] **8.1.1.6** Create Play Store listing (screenshots, description, category)
  - [ ] **8.1.1.7** Add EAS build profiles for Android: `build:dev:android`, `build:preview:android`, `build:production:android`
  - [ ] **8.1.1.8** Submit to Google Play Store

### 8.2 Push Notifications

- [ ] **8.2.1** Set up Expo Notifications
  - [ ] **8.2.1.1** `npm install expo-notifications`
  - [ ] **8.2.1.2** Add notification plugin to `app.json`
  - [ ] **8.2.1.3** Request notification permission on first Monitor property add
  - [ ] **8.2.1.4** Store push token in Supabase `users` table
- [ ] **8.2.2** Implement notification triggers
  - [ ] **8.2.2.1** Monitor: notify when AI detects changes on a watched property
  - [ ] **8.2.2.2** Monitor: notify when a DA is lodged near a watched property
  - [ ] **8.2.2.3** Weekly digest: summary of portfolio changes
  - [ ] **8.2.2.4** Subscription: notify before trial/subscription expiry

### 8.3 Analytics & Crash Reporting

- [ ] **8.3.1** Add Sentry
  - [ ] **8.3.1.1** `npm install @sentry/react-native`
  - [ ] **8.3.1.2** Initialise in `app/_layout.tsx` with DSN from environment config
  - [ ] **8.3.1.3** Add Sentry to web app: `npm install @sentry/react` in GroundTruthWeb
  - [ ] **8.3.1.4** Configure source map uploads in EAS build and Vite build
- [ ] **8.3.2** Add PostHog analytics
  - [ ] **8.3.2.1** Track feature usage: snap count, inspect count, appraise count per user
  - [ ] **8.3.2.2** Track funnel: camera open → capture → analysis complete → save
  - [ ] **8.3.2.3** Track subscription conversion: free → pro upgrade points
  - [ ] **8.3.2.4** Track market-specific usage patterns to prioritise market expansion

### 8.4 OTA Updates

- [ ] **8.4.1** Fix runtime version policy
  - [ ] **8.4.1.1** Change `runtimeVersion.policy` from `"appVersion"` to `"fingerprint"` in `app.json`
  - [ ] **8.4.1.2** Test OTA update delivery with `eas update --branch preview`
  - [ ] **8.4.1.3** Add update check on app foreground with user-visible prompt

---

## 9. MONETISATION & BUSINESS MODEL

### 9.1 Web Pricing & Subscription

- [ ] **9.1.1** Create pricing page
  - [ ] **9.1.1.1** Design pricing page with three tiers (Free, Pro, Enterprise) matching iOS tiers
  - [ ] **9.1.1.2** Create `/pricing` route on web app
  - [ ] **9.1.1.3** Link from landing page nav and CTA sections
  - [ ] **9.1.1.4** Add feature comparison table
  - [ ] **9.1.1.5** Add FAQ section (billing, cancellation, data ownership)
- [ ] **9.1.2** Stripe integration
  - [ ] **9.1.2.1** Create Supabase Edge Function for Stripe checkout session creation
  - [ ] **9.1.2.2** Create Supabase Edge Function for Stripe webhook handling (subscription lifecycle)
  - [ ] **9.1.2.3** Sync Stripe subscription status to `users.subscription_tier` column
  - [ ] **9.1.2.4** Add billing portal link to web app settings

### 9.2 Enforce Tiers on Web

- [ ] **9.2.1** Add SubscriptionContext to web app
  - [ ] **9.2.1.1** Port iOS `SubscriptionContext` pattern to web
  - [ ] **9.2.1.2** Fetch user tier from Supabase on auth
  - [ ] **9.2.1.3** Gate access to Appraisal, Monitor, Walk detail pages based on tier
  - [ ] **9.2.1.4** Show upgrade prompts for gated features

---

## 10. INNOVATIONS & UI IMPROVEMENTS

### 10.1 AR Camera Overlay (Game-Changer)

Currently the camera captures a flat photo and sends it to AI post-capture. An AR overlay would let users see AI insights *while looking at the property*.

- [ ] **10.1.1** Evaluate AR feasibility
  - [ ] **10.1.1.1** Prototype using ReactVision (ViroReact) with Expo — it has an official Expo plugin
  - [ ] **10.1.1.2** Test AR scene overlay on camera feed showing: property boundary outline, zoning badge, heritage indicator
  - [ ] **10.1.1.3** Evaluate performance impact on mid-range devices (iPhone 12, Pixel 6)
- [ ] **10.1.2** Implement "Live Lens" mode
  - [ ] **10.1.2.1** Real-time camera feed with GPS-triggered data overlay
  - [ ] **10.1.2.2** Show floating badges: zoning code, last sale price, condition score (if previously snapped)
  - [ ] **10.1.2.3** Show property boundary polygon from Overture/OSM building footprint data
  - [ ] **10.1.2.4** Show DA activity indicators (nearby development applications)
  - [ ] **10.1.2.5** Tap a badge to expand into full detail card without leaving camera view
- [ ] **10.1.3** AR walk mode
  - [ ] **10.1.3.1** During Explore walks, overlay streetscape scores on the live camera feed
  - [ ] **10.1.3.2** Show directional markers for nearby amenities (schools, shops, transit)
  - [ ] **10.1.3.3** Show safety/lighting scores as colour gradient on the path ahead

### 10.2 AI-Powered Comparative View

- [ ] **10.2.1** Before/after AI visualisation
  - [ ] **10.2.1.1** Split-screen view: original photo | AI-annotated photo with defects highlighted
  - [ ] **10.2.1.2** Use Gemini image edit to generate annotated versions showing: crack locations circled, material labels overlaid, defect severity colour-coded
  - [ ] **10.2.1.3** Swipe slider between original and annotated (like image diff tools)
- [ ] **10.2.2** Time-series comparison for Monitor
  - [ ] **10.2.2.1** Implement photo alignment algorithm (use GPS + compass heading to overlay photos taken at different times)
  - [ ] **10.2.2.2** Pixel-diff heatmap showing areas of change between visits
  - [ ] **10.2.2.3** Timeline scrubber showing all historical photos of a property
- [ ] **10.2.3** Comparable sales visual map
  - [ ] **10.2.3.1** Interactive map showing subject property + all comps with price/distance annotations
  - [ ] **10.2.3.2** Click a comp to see side-by-side photo comparison with subject
  - [ ] **10.2.3.3** Colour-code comps by adjustment direction (green = inferior/upward, red = superior/downward)

### 10.3 Voice-First Field Workflow

The existing `EditableText` component already has voice support. Extend this into a full voice-first workflow.

- [ ] **10.3.1** Hands-free inspection mode
  - [ ] **10.3.1.1** "Voice capture" mode: user narrates observations while walking through a property
  - [ ] **10.3.1.2** AI transcribes and structures voice notes into inspection report sections automatically
  - [ ] **10.3.1.3** Auto-tag voice segments to the nearest captured photo based on timestamp
  - [ ] **10.3.1.4** "Snap and narrate" — capture photo + record observation in one gesture
- [ ] **10.3.2** AI conversation mode
  - [ ] **10.3.2.1** After an analysis, let the user ask follow-up questions via voice: "What's the likely age of that roof?", "Compare this to the last property I inspected"
  - [ ] **10.3.2.2** AI responds with spoken audio (TTS) for true hands-free operation
  - [ ] **10.3.2.3** Context-aware: AI has access to the current property's full data + user's portfolio

### 10.4 Collaborative Features

- [ ] **10.4.1** Team/workspace support
  - [ ] **10.4.1.1** Add `teams` table and `team_members` table to Supabase schema
  - [ ] **10.4.1.2** Allow sharing a directory with team members (read/write permissions)
  - [ ] **10.4.1.3** Show team member activity on shared properties ("James inspected this 2 days ago")
  - [ ] **10.4.1.4** Add real-time cursors on the map dashboard showing team member locations during field work
- [ ] **10.4.2** Client sharing
  - [ ] **10.4.2.1** Generate shareable report links (public URL with expiry, no login required)
  - [ ] **10.4.2.2** PDF export with professional branding (logo, company details, disclaimers)
  - [ ] **10.4.2.3** White-label report option for enterprise tier

### 10.5 Smart Property Portfolio

- [ ] **10.5.1** Portfolio analytics dashboard
  - [ ] **10.5.1.1** Aggregate portfolio value based on all appraised properties
  - [ ] **10.5.1.2** Portfolio condition heatmap — colour-code properties by inspection score
  - [ ] **10.5.1.3** Trend charts: portfolio value over time, condition score trends
  - [ ] **10.5.1.4** Maintenance prediction: AI estimates when major maintenance will be needed based on condition scores and building age
- [ ] **10.5.2** Smart alerts
  - [ ] **10.5.2.1** Alert when a comparable sale occurs near a portfolio property (price discovery)
  - [ ] **10.5.2.2** Alert when a DA is lodged near a portfolio property (development risk/opportunity)
  - [ ] **10.5.2.3** Alert when condition score drops below threshold on re-inspection
  - [ ] **10.5.2.4** Configurable alert rules per property or directory

### 10.6 Web Dashboard UI Overhaul

- [ ] **10.6.1** Dashboard redesign
  - [ ] **10.6.1.1** Replace single map + activity panel with a modular dashboard: map, activity feed, portfolio summary, quick actions
  - [ ] **10.6.1.2** Add drag-and-drop widget layout (user can customise their dashboard)
  - [ ] **10.6.1.3** Add mini stat cards: total properties, recent inspections, portfolio value estimate, alerts
  - [ ] **10.6.1.4** Add "Quick snap" — drag-and-drop photo upload from desktop for instant AI analysis
- [ ] **10.6.2** Data table views
  - [ ] **10.6.2.1** Add sortable, filterable table view as alternative to card list on all feature pages
  - [ ] **10.6.2.2** Add column customisation (show/hide fields)
  - [ ] **10.6.2.3** Add bulk actions (select multiple → delete, export, move to directory)
  - [ ] **10.6.2.4** Add CSV/Excel export for all data views
- [ ] **10.6.3** Report builder
  - [ ] **10.6.3.1** Web-based report editor with drag-and-drop sections (photos, analysis, comps, notes)
  - [ ] **10.6.3.2** Customisable report templates per feature type
  - [ ] **10.6.3.3** PDF generation from web (matching iOS PDF export quality)
  - [ ] **10.6.3.4** Add company logo/branding customisation in settings

### 10.7 Offline-First Web (PWA)

- [ ] **10.7.1** Progressive Web App setup
  - [ ] **10.7.1.1** Add `vite-plugin-pwa` with service worker for offline caching
  - [ ] **10.7.1.2** Create `manifest.json` with app metadata, icons, theme colour
  - [ ] **10.7.1.3** Cache critical routes and recently viewed property data
  - [ ] **10.7.1.4** Add "Install app" prompt for mobile web users
  - [ ] **10.7.1.5** Queue mutations when offline, sync when back online (match iOS offline-first pattern)

### 10.8 Landing Page Conversion Optimisation

- [ ] **10.8.1** Content improvements
  - [ ] **10.8.1.1** Replace "Social Proof" section with real testimonials or beta user quotes
  - [ ] **10.8.1.2** Add a 60-second product demo video (screen recording of iOS app in action)
  - [ ] **10.8.1.3** Add waitlist counter ("Join 1,200+ property professionals") for social proof
  - [ ] **10.8.1.4** Add trusted-by logos if any firms are beta testing
  - [ ] **10.8.1.5** Add a "See it in action" interactive demo (embedded web app with sample data, no login required)
- [ ] **10.8.2** Conversion mechanics
  - [ ] **10.8.2.1** Add exit-intent popup with waitlist form
  - [ ] **10.8.2.2** Add scroll-triggered CTA that appears after viewing features section
  - [ ] **10.8.2.3** Add per-market landing pages (`/au`, `/uk`, `/us`) with localised copy and pricing
  - [ ] **10.8.2.4** A/B test hero copy and CTA button text
- [ ] **10.8.3** SEO
  - [ ] **10.8.3.1** Add `<meta>` tags: description, og:title, og:description, og:image, twitter:card
  - [ ] **10.8.3.2** Add structured data (JSON-LD) for SoftwareApplication schema
  - [ ] **10.8.3.3** Create a `/blog` section for property tech content marketing (drives organic traffic)
  - [ ] **10.8.3.4** Ensure landing page is server-rendered or pre-rendered for SEO (consider Vite SSG plugin)

---

## 11. TOP PRIORITIES FOR GLOBAL ADOPTION

| # | Action | Effort | Impact | Section |
|---|--------|--------|--------|---------|
| 1 | **Market abstraction layer** — decouple from NSW | High | Existential | 3.1 |
| 2 | **i18n framework** — extract all strings | Medium | Existential | 2.1-2.4 |
| 3 | **Security hardening** — headers, CSP, privacy policy, GDPR | Medium | Legal blocker | 4.1-4.4 |
| 4 | **Test suite** — Vitest + Playwright + Jest | Medium | Enterprise blocker | 1.1-1.5 |
| 5 | **Code splitting + Mapbox lazy load** | Low | Immediate UX win | 5.1-5.2 |
| 6 | **React Query** — proper data layer with caching | Medium | UX + reliability | 7.2 |
| 7 | **Android support** — half the global market | Medium | Market access | 8.1 |
| 8 | **Push notifications** — Monitor feature incomplete without them | Low | Feature completion | 8.2 |
| 9 | **Analytics + crash reporting** | Low | Operational necessity | 8.3 |
| 10 | **Landing page overhaul** — real social proof, pricing, video | Medium | Conversion | 10.8 |
| 11 | **UK market launch** — HM Land Registry + RICS standards | High | First global market | 3.4.2, 3.5.2, 3.6 |
| 12 | **AR camera overlay** — "Live Lens" mode | High | Differentiator | 10.1 |
| 13 | **Team/collaboration features** | Medium | Enterprise readiness | 10.4 |
| 14 | **Voice-first workflow** | Medium | Field UX differentiator | 10.3 |
| 15 | **Portfolio analytics** | Medium | Retention + upsell | 10.5 |

---

## 12. GLOBAL DATA SOURCE REFERENCE

Summary of researched data sources for expanding GroundTruth beyond Australia.

### Geocoding & Maps
| Source | Coverage | Notes |
|--------|----------|-------|
| [Mapbox Geocoding v6](https://docs.mapbox.com/api/search/geocoding/) | Global | Already using Mapbox GL. v6 adds batch geocoding (1,000/request), Smart Address Match confidence. Best in NA/Europe |
| [Mapbox Boundaries](https://www.mapbox.com/boundaries) | Global (5M+ boundaries) | Admin, postal, statistical boundaries. Enterprise pricing. v4.6 expanded Americas/Europe/APAC |

### Building Footprints
| Source | Coverage | Footprints | Cost |
|--------|----------|------------|------|
| [Overture Maps Foundation](https://docs.overturemaps.org/guides/buildings/) | Global | 2.3 billion | Free (ODbL) |
| [Google + Microsoft Combined](https://source.coop/vida/google-microsoft-open-buildings) | Global (92% admin areas) | 2.5 billion | Free (ODbL) |
| [OpenStreetMap Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) | Global (variable) | 500M+ | Free (ODbL) |
| [Google Solar/Building Insights](https://developers.google.com/maps/documentation/solar/overview) | NA, Europe, Oceania | Building dimensions + solar | Pay-per-use |

### Comparable Sales / Property Transactions
| Market | Source | Coverage | Cost |
|--------|--------|----------|------|
| UK | [HM Land Registry Price Paid](https://landregistry.data.gov.uk/) | England & Wales since 1995 | Free |
| UK | [HM Land Registry APIs](https://www.api.gov.uk/hmlr/) | 13 APIs, RESTful JSON | Free |
| US | [ATTOM Data](https://www.attomdata.com/) | 158M US properties, 3,000 counties | Commercial |
| France | [DVF (Demandes de Valeurs Foncieres)](https://www.data.gouv.fr) | All French property transactions | Free |
| Netherlands | Kadaster Open Data | Dutch property transactions | Free |
| EU | [INSPIRE Cadastre](https://www.mapsforeurope.org/datasets/cadastral-all) | EU-wide (variable per country) | Free |

### Planning / Zoning
| Market | Source | Coverage |
|--------|--------|----------|
| AU (current) | NSW ArcGIS REST services | NSW only |
| UK | Planning Portal + Local Authority APIs | England |
| US | Regrid/Loveland (commercial) or municipal open data | Variable per jurisdiction |
| EU | INSPIRE + national cadastre services | Variable per country |

### Inspection Standards
| Market | Standard | Residential | Commercial |
|--------|----------|-------------|------------|
| Australia | AS 4349.1-2007 | Yes | — |
| UK | RICS Home Survey Level 2/3 | Yes | RICS |
| US | InterNACHI SOP | Yes | ASTM E2018 / ComSOP |
| NZ | NZS 4306:2005 | Yes | — |
| Canada | CAHPI / CSA A770 | Yes | — |
| International | — | — | ASTM E2018 (widely adopted) |

---

## Bottom Line

You've built a genuinely innovative product with strong domain expertise and a coherent design language. The core concept — AI-powered field intelligence for property professionals — has real global potential. The iOS architecture is solid and the feature depth is impressive for an MVP.

But you're one regulatory/legal threat away from trouble (no privacy policy, no GDPR), one scaling attempt away from pain (no tests, no caching, no code splitting), and architecturally locked to a single Australian state. The web app is a thin dashboard that could be 3x more useful with proper data management and offline/caching capabilities.

The innovations in Section 10 — AR camera overlay, voice-first workflow, collaborative features, portfolio analytics — are what will differentiate GroundTruth from competitors and justify premium pricing globally. The "Live Lens" AR mode alone could be a category-defining feature.

Fix the foundations (security, testing, i18n, market abstraction) before chasing growth. Then go big on the innovations. The product is worth it.

---

*Review conducted March 2026. Sources linked in Section 12.*
