# UI/UX & Architecture Review — Action Plan

Comprehensive review completed 2026-03-17. Mark items `[x]` as completed.

---

# Part A — Diagrams & Wireframes

## A.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (React SPA)                           │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │
│  │  React       │  │  React       │  │  Mapbox GL   │  │ CSS        │   │
│  │  Router v7   │  │  Context     │  │  (react-     │  │ Modules    │   │
│  │              │  │  (Auth)      │  │  map-gl)     │  │ + theme.ts │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────────┘   │
│         │                 │                 │                           │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────────┐     │
│  │                        src/services/                           │     │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────┐ │     │
│  │  │  api.ts    │  │ aiService.ts │  │ daService.ts│  │ train  │ │     │
│  │  │ CRUD ops   │  │ AI vision    │  │ DA queries  │  │Station │ │     │
│  │  │            │  │ analysis     │  │             │  │Service │ │     │
│  │  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  └───┬────┘ │     │
│  └────────┼────────────────┼────────────────┼──────────────┼──────┘     │
└───────────┼────────────────┼────────────────┼──────────────┼────────────┘
            │                │                │              │
            ▼                ▼                ▼              ▼
┌───────────────────┐ ┌────────────┐ ┌───────────────┐ ┌──────────────┐
│  Supabase (Main)  │ │  Supabase  │ │ Supabase (DA) │ │   Mapbox     │
│                   │ │  Edge      │ │               │ │   Tiles API  │
│ ┌───────────────┐ │ │  Functions │ │ ┌───────────┐ │ │              │
│ │ snaps         │ │ │            │ │ │ dev_apps  │ │ │ Vector tiles │
│ │ inspections   │ │ │ analyse-   │ │ │ (DAs)     │ │ │ Geocoding    │
│ │ appraisals    │ │ │ snap       │ │ └───────────┘ │ │ Directions   │
│ │ watched_props │ │ │ analyse-   │ │               │ │ Static maps  │
│ │ walk_sessions │ │ │ inspection │ │ VITE_DA_      │ └──────────────┘
│ │ walk_photos   │ │ │ analyse-   │ │ SUPABASE_URL  │
│ │ auth.users    │ │ │ explore    │ │ VITE_DA_      │
│ └───────────────┘ │ │ analyse-   │ │ SUPABASE_     │
│                   │ │ appraisal  │ │ ANON_KEY      │
│ VITE_SUPABASE_URL │ └────────────┘ └───────────────┘
│ VITE_SUPABASE_    │
│ ANON_KEY          │        Deployed on: Vercel
└───────────────────┘        Domain: vercel.app
```

## A.2 Routing & Navigation Map

```
                            ┌──────────────┐
                            │  / (Landing) │
                            │  App.tsx     │
                            └───────┬──────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌────────────┐ ┌────────────┐  ┌──────────────────┐
             │  /login    │ │  / (public)│  │  /app/*          │
             │  LoginPage │ │  Landing   │  │  ProtectedRoute  │
             └─────┬──────┘ └────────────┘  └────────┬─────────┘
                   │                                  │
                   │  on success                      ▼
                   └─────────────────►  ┌──────────────────────┐
                                        │    AppLayout         │
                                        │  ┌────────────────┐  │
                                        │  │ Sidebar / Nav  │  │
                                        │  │ + <Outlet />   │  │
                                        │  └────────────────┘  │
                                        └──────────┬───────────┘
                                                   │
           ┌────────────┬──────────┬───────────┬───┼────────┬──────────┐
           ▼            ▼          ▼           ▼   ▼        ▼          ▼
    ┌────────────┐┌──────────┐┌────────┐┌──────────┐┌─────────┐┌──────────┐
    │ /app       ││/app/     ││/app/   ││/app/     ││/app/    ││/app/     │
    │ Dashboard  ││snaps     ││inspec- ││apprais-  ││monitor  ││walks     │
    │            ││          ││tions   ││als       ││         ││          │
    │ Map + Feed ││SnapList  ││Insp.   ││Appr.     ││Monitor  ││WalkList  │
    └─────┬──────┘│          ││List    ││List      ││List     ││          │
          │       └────┬─────┘└───┬────┘└────┬─────┘└────┬────┘└────┬─────┘
          │            ▼          ▼          ▼          ▼          ▼
          │     ┌────────────┐┌────────┐┌────────┐┌────────┐┌──────────┐
          │     │/app/snaps/ ││/app/   ││/app/   ││/app/   ││/app/     │
          │     │:id         ││inspec- ││apprai- ││monitor/││walks/:id │
          │     │            ││tions/  ││sals/   ││:id     ││          │
          │     │SnapDetail  ││:id     ││:id     ││        ││WalkDetail│
          │     └────────────┘│        ││        ││Monitor ││          │
          │                   │Insp.   ││Appr.  ││Detail  │└──────────┘
          │                   │Detail  ││Detail  │└────────┘
          │                   └────────┘└────────┘
          │
          │  Also accessible from Dashboard:
          ▼
    ┌───────────────────────┐
    │ /app/properties       │
    │ PropertyList          │
    │                       │
    │ /app/properties/:addr │
    │ PropertyDetail        │
    │ (aggregates all       │
    │  activity for addr)   │
    └───────────────────────┘
```

## A.3 Component Hierarchy

```
<BrowserRouter>
├── <Route path="/" element={<App />} />              ← Landing page
│   ├── <Nav />                                        ← Fixed header, glassmorphism
│   ├── <Hero>                                         ← Full-viewport, topo background
│   │   ├── <HeroText />                               ← Badge + title + subtitle
│   │   └── <PhoneFrame><HomeScreen /></PhoneFrame>    ← Animated map mockup
│   ├── <Features>                                     ← 5-tab switcher
│   │   ├── <TabBar />                                 ← Snap | Inspect | Appraise | Monitor | Explore
│   │   └── <FeaturePanel>                             ← Animated swap on tab change
│   │       ├── <PhoneFrame><{Screen} /></PhoneFrame>  ← Per-feature phone mockup
│   │       └── <FeatureContent />                     ← Tag + title + description
│   ├── <HowItWorks />                                ← 3-step grid
│   ├── <CTA />                                        ← Waitlist form
│   └── <Footer />                                     ← Logo + tagline
│
├── <Route path="/login" element={<LoginPage />} />    ← Centred card, dark bg
│
└── <Route path="/app" element={<ProtectedRoute />} >
    └── <AppLayout>                                    ← Sidebar (desktop) + BottomNav (mobile)
        │
        ├── <Sidebar>                                  ← 220px, dark, fixed
        │   ├── <Brand />                              ← "GroundTruth" serif logo
        │   ├── <AddressSearch />                      ← Typeahead search
        │   ├── <NavLinks />                           ← 7 route links with icons
        │   └── <UserSection />                        ← Email + sign out
        │
        ├── <BottomNav />                              ← Mobile only, fixed bottom
        │
        └── <Outlet /> ─────────────────────────────── ← Page content renders here
            │
            ├── <Dashboard>                            ← /app (default)
            │   ├── <Map>                              ← Mapbox GL, full-height
            │   │   ├── Property pins (markers)
            │   │   ├── Walk route overlays
            │   │   ├── DA polygons layer
            │   │   ├── Train station markers
            │   │   ├── 3D buildings layer
            │   │   ├── <MeasureTools />
            │   │   └── <MapLegend />
            │   ├── <LayerControl />                   ← Toggle panel, top-right
            │   └── <ActivityPanel>                    ← 480px sidebar, right
            │       └── <PropertyGroup /> × N          ← Grouped by address
            │           ├── Address + suburb
            │           ├── Activity badges
            │           └── <ActivityItem /> × N       ← Type + summary + date
            │
            ├── <SnapList>                             ← /app/snaps
            │   ├── <PageHeader />
            │   └── <GroupedFeatureList>
            │       └── <FeatureCard /> × N
            │
            ├── <SnapDetail>                           ← /app/snaps/:id
            │   ├── <TopBar> ← Back + Delete
            │   ├── <HeroSection> ← Photo + Address
            │   ├── <InlineDiff /> (if AI changes pending)
            │   └── <CardGrid>                         ← auto-fit, minmax(320px)
            │       ├── <Card> AI Assessment
            │       ├── <Card> Observations
            │       ├── <Card> Risks
            │       └── <Card> Opportunities
            │
            ├── <InspectionDetail>                     ← /app/inspections/:id
            │   ├── <TopBar> ← Back + Delete + Re-analyse All
            │   ├── <HeroSection> ← Photo + Address
            │   ├── <PhotoGallery>                     ← Per-photo cards
            │   │   └── <PhotoCard> × N
            │   │       ├── Photo + action buttons
            │   │       ├── Condition + score
            │   │       ├── <EditableText /> narrative
            │   │       ├── Material badges
            │   │       └── Defect list (severity-coded)
            │   └── <InspectionReport>
            │       ├── Condition breakdown grid
            │       ├── Defects summary
            │       └── Materials observed
            │
            ├── <AppraisalDetail>                      ← /app/appraisals/:id
            │   ├── <TopBar> ← Back + Delete
            │   ├── <Header> ← Address + price estimate badge
            │   ├── <MapLayout>                        ← flex row, h:500px
            │   │   ├── <Map> ← Subject + comp pins
            │   │   └── <CompSidebar>                  ← 300px, scrollable
            │   │       ├── <CompDetail /> (selected)
            │   │       └── <CompList>
            │   │           └── <CompRow /> × N
            │   ├── <EstimateSection>                  ← auto-fit grid
            │   │   ├── <Card> Price Estimate
            │   │   └── <Card> Methodology
            │   └── <SelectedComps>                    ← auto-fill grid
            │       └── <CompCard /> × N
            │
            ├── <WalkDetail>                           ← /app/walks/:id
            │   ├── <TopBar> ← Back + Delete + Re-analyse
            │   ├── <Map> ← Walk route polyline
            │   ├── <StreetScore>
            │   │   ├── Overall score ring
            │   │   └── Dimension scores (4x)
            │   └── <PhotoGrid>
            │       └── <WalkPhoto /> × N
            │
            └── <PropertyDetail>                       ← /app/properties/:addr
                ├── <TopBar> ← Back
                ├── <Header> ← Address + suburb
                └── <ActivitySections>
                    ├── Snaps section
                    ├── Inspections section
                    ├── Appraisals section
                    ├── Monitor section
                    └── Walks section
```

## A.4 Folder Structure (Current vs Proposed)

```
CURRENT                                  PROPOSED (changes marked with +)
═══════                                  ════════

src/                                     src/
├── main.tsx                             ├── main.tsx
├── App.tsx                              ├── App.tsx
├── index.css                            ├── index.css
├── theme.ts                             ├── theme.ts
├── vite-env.d.ts                        ├── vite-env.d.ts
│                                        │
├── contexts/                            ├── contexts/
│   └── AuthContext.tsx                  │   └── AuthContext.tsx
│                                        │
├── types/                               ├── types/
│   └── common.ts                        │   └── common.ts
│                                        │
├── services/                            ├── services/
│   ├── api.ts                           │   ├── api.ts
│   ├── aiService.ts                     │   ├── aiService.ts
│   ├── daService.ts                     │   ├── daService.ts
│   └── trainStationService.ts           │   └── trainStationService.ts
│                                        │
│   (no hooks directory)               + ├── hooks/                    ← NEW
│                                      + │   ├── useMapState.ts
│                                      + │   ├── useSpatialLayers.ts
│                                      + │   ├── useMeasureTools.ts
│                                      + │   ├── useAnalysis.ts
│                                      + │   ├── useFetchDetail.ts
│                                      + │   └── useConfirmModal.ts
│                                        │
├── components/                          ├── components/
│   ├── layout/                          │   ├── layout/
│   │   ├── AppLayout.tsx                │   │   ├── AppLayout.tsx
│   │   ├── AppLayout.module.css         │   │   ├── AppLayout.module.css
│   │   ├── ProtectedRoute.tsx           │   │   ├── ProtectedRoute.tsx
│   │   └── AddressSearch.tsx            │   │   └── AddressSearch.tsx
│   │                                    │   │
│   ├── map/                             │   ├── map/
│   │   ├── LayerControl.tsx             │   │   ├── LayerControl.tsx
│   │   ├── MapLegend.tsx                │   │   ├── MapLegend.tsx
│   │   └── MeasureTools.tsx             │   │   ├── MeasureTools.tsx
│   │                                  + │   │   ├── MapSidebar.tsx      ← NEW
│   │                                  + │   │   └── MapSidebar.module.css
│   │                                    │   │
│   ├── shared/                          │   ├── shared/
│   │   ├── PageHeader.tsx               │   │   ├── PageHeader.tsx
│   │   ├── FeatureCard.tsx              │   │   ├── FeatureCard.tsx
│   │   ├── GroupedFeatureList.tsx        │   │   ├── GroupedFeatureList.tsx
│   │   ├── EditableText.tsx             │   │   ├── EditableText.tsx
│   │   ├── InlineDiff.tsx               │   │   ├── InlineDiff.tsx
│   │   ├── Lightbox.tsx                 │   │   ├── Lightbox.tsx
│   │   └── *.module.css                 │   │   ├── *.module.css
│   │                                  + │   │   ├── ErrorMessage.tsx    ← NEW
│   │                                  + │   │   ├── Breadcrumb.tsx      ← NEW
│   │                                  + │   │   ├── ConfirmModal.tsx    ← NEW
│   │                                  + │   │   ├── LoadingSpinner.tsx  ← NEW
│   │                                  + │   │   └── PhotoGallery.tsx    ← NEW
│   │                                    │   │
│   └── phone/                           │   └── phone/
│       ├── PhoneFrame.tsx               │       ├── PhoneFrame.tsx
│       └── screens/                     │       └── screens/
│           ├── HomeScreen.tsx           │           ├── HomeScreen.tsx
│           ├── SnapCardScreen.tsx       │           ├── SnapCardScreen.tsx
│           ├── InspectScreen.tsx        │           ├── InspectScreen.tsx
│           ├── AppraiseScreen.tsx       │           ├── AppraiseScreen.tsx
│           ├── MonitorScreen.tsx        │           ├── MonitorScreen.tsx
│           └── ExploreScreen.tsx        │           └── ExploreScreen.tsx
│                                        │
├── pages/                               ├── pages/
│   ├── Login.tsx                        │   ├── Login.tsx
│   ├── Dashboard.tsx  (838 lines!)      │   ├── Dashboard.tsx  (→ ~250 lines)
│   │                                    │   │
│   ├── snaps/                           │   ├── snaps/
│   │   ├── SnapList.tsx                 │   │   ├── SnapList.tsx
│   │   └── SnapDetail.tsx               │   │   └── SnapDetail.tsx
│   ├── inspections/                     │   ├── inspections/
│   │   ├── InspectionList.tsx           │   │   ├── InspectionList.tsx
│   │   └── InspectionDetail.tsx         │   │   └── InspectionDetail.tsx
│   ├── appraisals/                      │   ├── appraisals/
│   │   ├── AppraisalList.tsx            │   │   ├── AppraisalList.tsx
│   │   └── AppraisalDetail.tsx          │   │   └── AppraisalDetail.tsx
│   ├── monitor/                         │   ├── monitor/
│   │   ├── MonitorList.tsx              │   │   ├── MonitorList.tsx
│   │   └── MonitorDetail.tsx            │   │   └── MonitorDetail.tsx
│   ├── walks/                           │   ├── walks/
│   │   ├── WalkList.tsx                 │   │   ├── WalkList.tsx
│   │   └── WalkDetail.tsx               │   │   └── WalkDetail.tsx
│   └── properties/                      │   └── properties/
│       ├── PropertyList.tsx             │       ├── PropertyList.tsx
│       └── PropertyDetail.tsx           │       └── PropertyDetail.tsx
```

## A.5 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Actions                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     React Components                            │
│                                                                 │
│   Page Component (e.g. SnapDetail)                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  useState: snap, loading, error                         │  │
│   │  useEffect → fetch on mount                             │  │
│   │  handlers: handleDelete, handleReanalyse, handleAccept  │  │
│   └──────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│   Shared Components      │                                      │
│   ┌──────────────────┐   │   ┌─────────────────────────────┐   │
│   │ EditableText     │   │   │ InlineDiff                  │   │
│   │ FeatureCard      │   │   │ (shows AI suggested changes │   │
│   │ PageHeader       │   │   │  accept/reject per field)   │   │
│   │ Lightbox         │   │   └─────────────────────────────┘   │
│   │ GroupedFeatureList│   │                                      │
│   └──────────────────┘   │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────┼───────────────┐
              ▼            ▼               ▼
       ┌────────────┐ ┌──────────┐  ┌──────────────┐
       │  api.ts    │ │aiService │  │ daService.ts │
       │            │ │.ts       │  │              │
       │ getSnap()  │ │analyse   │  │ fetchDAs()   │
       │ listSnaps()│ │Snap()    │  │ within bbox  │
       │ updateSnap │ │analyse   │  │              │
       │ deleteSnap │ │Inspect() │  └──────┬───────┘
       │ getInsp()  │ │analyse   │         │
       │ listInsp() │ │Explore() │         ▼
       │ getAppr()  │ │analyse   │  ┌──────────────┐
       │ listAppr() │ │Appraisal │  │ DA Supabase  │
       │ getWalk()  │ │Photos()  │  │ (separate    │
       │ listWalks()│ └────┬─────┘  │  instance)   │
       │ getAllPins()│      │        └──────────────┘
       │ getProperty│      │
       └─────┬──────┘      │
             │              │
             ▼              ▼
       ┌────────────────────────┐
       │   Supabase Client      │
       │                        │
       │ createClient(          │
       │   VITE_SUPABASE_URL,   │
       │   VITE_SUPABASE_KEY    │
       │ )                      │
       │                        │
       │ .from('table')         │──── DB tables
       │ .select() / .insert()  │
       │ .update() / .delete()  │
       │                        │
       │ .functions.invoke()    │──── Edge Functions (AI)
       └────────────────────────┘
```

## A.6 Design Token Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     src/theme.ts (JS tokens)                    │
│                                                                 │
│  colours                          fonts                         │
│  ├── terracotta: '#D4653B'        ├── brand: 'DM Serif Display' │
│  ├── sage:       '#6B8F71'        ├── body:  'Public Sans'      │
│  ├── stone50:    '#FAF8F5'        └── data:  'JetBrains Mono'   │
│  ├── stone100:   '#F5F0EB'                                      │
│  ├── stone200:   '#E7DFD6'                                      │
│  ├── stone300:   '#D6CEC4'                                      │
│  ├── stone800:   '#2C2825'                                      │
│  ├── stone900:   '#1C1917'                                      │
│  ├── amber:      '#D97706'                                      │
│  └── charcoal:   '#121110'                                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ imported by components
                               │ for inline styles
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                 src/index.css :root (CSS custom properties)      │
│                                                                  │
│  Colours                       Typography                        │
│  ├── --terracotta: #D4653B     ├── --font-brand: 'DM Serif...'  │
│  ├── --sage: #6B8F71           ├── --font-body: 'Public Sans...'│
│  ├── --stone-50: #FAF8F5       └── --font-data: 'JetBrains...' │
│  ├── --stone-100: #F5F0EB                                       │
│  ├── --stone-200: #E7DFD6     Backgrounds                       │
│  ├── --stone-300: #D6CEC4     ├── --bg-primary: #121110         │
│  ├── --stone-800: #2C2825     └── --bg-secondary: #1A1816       │
│  ├── --stone-900: #1C1917                                        │
│  └── --amber: #D97706         Text                               │
│                                ├── --text-primary: #e8e2d9       │
│  MISSING (to add in Phase 2)   ├── --text-secondary: #a39e95    │
│  ├── --cream: #FFFDF9          └── --text-muted: #78736c        │
│  ├── --charcoal: #1C1917                                         │
│  ├── --accent: #D4653B                                           │
│  ├── --diff-old-bg             ┌─────────────────────────────┐  │
│  ├── --diff-new-bg             │ 45+ hardcoded hex values    │  │
│  ├── --shadow-sm               │ scattered across CSS modules│  │
│  ├── --shadow-md               │ that should reference these │  │
│  ├── --space-xs..3xl           │ variables instead           │  │
│  └── --radius-sm..lg           └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                               │
                               │ consumed by
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       CSS Modules (*.module.css)                 │
│                                                                  │
│  Two theme contexts:                                             │
│                                                                  │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐│
│  │ DARK CONTEXT         │    │ LIGHT CONTEXT                    ││
│  │ (sidebar, nav, login)│    │ (content area, cards, pages)     ││
│  │                      │    │                                  ││
│  │ bg: --bg-primary     │    │ bg: #FAF8F5 (stone-50)           ││
│  │ text: --text-primary │    │ text: #1C1917 (stone-900)        ││
│  │ border: rgba(white)  │    │ border: rgba(black)              ││
│  │                      │    │ card-bg: #FFFDF9 (cream)         ││
│  │ Used in:             │    │                                  ││
│  │ • AppLayout sidebar  │    │ AppLayout .content redefines     ││
│  │ • LoginPage          │    │ --text-primary, --text-secondary ││
│  │ • Landing page       │    │ for light theme context          ││
│  └─────────────────────┘    └──────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## A.7 Page Wireframes

### A.7.1 Landing Page (`App.tsx`)

```
Desktop (≥1024px)
╔══════════════════════════════════════════════════════════════════════════╗
║ NAV (fixed, z:1000, glassmorphism blur)                    h: 64px     ║
║ ┌────────────────────────────────────────────────────────────────────┐  ║
║ │ GroundTruth        Snap  Inspect  Appraise  Monitor     [Log in] │  ║
║ │ (serif brand)      (nav links, hidden ≤640px)           (button) │  ║
║ └────────────────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════════════╣
║ HERO (100vh, topo grid background)                                     ║
║ ┌───────────────────────────────────┐  ┌─────────────────────────────┐ ║
║ │                                   │  │    ┌───────────────────┐    │ ║
║ │  ┌─────────────────────────┐      │  │    │                   │    │ ║
║ │  │ Coming soon to iOS  ◆  │      │  │    │   ╔═══════════╗   │    │ ║
║ │  └─────────────────────────┘      │  │    │   ║ HomeScreen║   │    │ ║
║ │                                   │  │    │   ║ (animated ║   │    │ ║
║ │  AI-powered property              │  │    │   ║  map with ║   │    │ ║
║ │  field intelligence               │  │    │   ║  pins,    ║   │    │ ║
║ │  (clamp 36-56px, serif)           │  │    │   ║  routes,  ║   │    │ ║
║ │                                   │  │    │   ║  pulse)   ║   │    │ ║
║ │  Subtitle text describing         │  │    │   ╚═══════════╝   │    │ ║
║ │  the product capabilities         │  │    │   PhoneFrame      │    │ ║
║ │  (16px body font, muted)          │  │    │   280px wide      │    │ ║
║ │                                   │  │    └───────────────────┘    │ ║
║ │  [email    ] [Join waitlist]      │  │         max-width: 100%     │ ║
║ │  (form, terracotta button)        │  │                             │ ║
║ │                                   │  │                             │ ║
║ │  flex: 1                          │  │  flex-shrink: 0             │ ║
║ └───────────────────────────────────┘  └─────────────────────────────┘ ║
║                              gap: 3rem                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║ FEATURES (tabbed, dark bg)                                             ║
║                                                                        ║
║  ┌────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐         ║
║  │● Snap  │ │ Inspect │ │ Appraise │ │ Monitor │ │ Explore │         ║
║  └────────┘ └─────────┘ └──────────┘ └─────────┘ └─────────┘         ║
║                                                                        ║
║  ┌──────────────────┐  ┌──────────────────────────────────────────┐   ║
║  │ ┌──────────────┐ │  │                                          │   ║
║  │ │              │ │  │  SNAP (tag, uppercase, terracotta)       │   ║
║  │ │  PhoneFrame  │ │  │                                          │   ║
║  │ │  240px       │ │  │  Point. Shoot. Know.                     │   ║
║  │ │              │ │  │  (serif, 1.75rem)                        │   ║
║  │ │ SnapCard     │ │  │                                          │   ║
║  │ │ Screen       │ │  │  Take a photo and let AI identify        │   ║
║  │ │ (animated)   │ │  │  property features, materials, risks     │   ║
║  │ │              │ │  │  and opportunities in seconds.            │   ║
║  │ └──────────────┘ │  │  (body font, muted)                      │   ║
║  └──────────────────┘  └──────────────────────────────────────────┘   ║
║               gap: 2rem, animates on tab change (fadeUp 0.4s)          ║
╠══════════════════════════════════════════════════════════════════════════╣
║ HOW IT WORKS (light section)                                           ║
║                                                                        ║
║  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     ║
║  │    ┌────┐        │  │    ┌────┐        │  │    ┌────┐        │     ║
║  │    │ 01 │        │  │    │ 02 │        │  │    │ 03 │        │     ║
║  │    └────┘        │  │    └────┘        │  │    └────┘        │     ║
║  │  (48px circle,   │  │                  │  │                  │     ║
║  │   terracotta)    │  │  Capture         │  │  Review          │     ║
║  │                  │  │                  │  │                  │     ║
║  │  Get Started     │  │  Step 2 desc     │  │  Step 3 desc     │     ║
║  │                  │  │  (body, muted)   │  │  (body, muted)   │     ║
║  │  Step 1 desc     │  │                  │  │                  │     ║
║  └──────────────────┘  └──────────────────┘  └──────────────────┘     ║
║                     grid: repeat(3, 1fr), gap: 1.5rem                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║ CTA (topo background, centred)                                         ║
║                                                                        ║
║              Ready to see your properties differently?                  ║
║              (serif, large)                                             ║
║                                                                        ║
║              Subtitle text                                              ║
║                                                                        ║
║              [email          ] [Join waitlist]                          ║
║                                                                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║ FOOTER (minimal)                                                       ║
║                                                                        ║
║              GroundTruth                                                ║
║              Property intelligence, simplified.                         ║
╚══════════════════════════════════════════════════════════════════════════╝


Mobile (≤480px)
╔══════════════════════════╗
║ NAV (56px)               ║
║ GroundTruth    [Log in]  ║
║ (no nav links)           ║
╠══════════════════════════╣
║ HERO (stacked)           ║
║                          ║
║ ┌──────────────────────┐ ║
║ │ Badge                │ ║
║ │                      │ ║
║ │ AI-powered           │ ║
║ │ property field       │ ║
║ │ intelligence         │ ║
║ │ (clamp 26-36px)      │ ║
║ │                      │ ║
║ │ Subtitle             │ ║
║ │                      │ ║
║ │ [email  ]            │ ║
║ │ [Join waitlist]      │ ║
║ │ (stacked vertical)   │ ║
║ └──────────────────────┘ ║
║                          ║
║ Phone hidden (≤480px)    ║
╠══════════════════════════╣
║ FEATURES (tabs wrap)     ║
║ ┌─────┐┌──────┐┌──────┐ ║
║ │Snap ││Insp. ││Appr. │ ║
║ └─────┘└──────┘└──────┘ ║
║ ┌──────┐┌───────┐       ║
║ │Mon.  ││Explore│       ║
║ └──────┘└───────┘       ║
║                          ║
║ ┌──────────────────────┐ ║
║ │ Phone (240px, centrd)│ ║
║ │ ┌──────────────────┐ │ ║
║ │ │   Screen mockup  │ │ ║
║ │ └──────────────────┘ │ ║
║ └──────────────────────┘ ║
║ ┌──────────────────────┐ ║
║ │ Tag                  │ ║
║ │ Title (24px)         │ ║
║ │ Description (14px)   │ ║
║ └──────────────────────┘ ║
╠══════════════════════════╣
║ HOW IT WORKS             ║
║ (single column)          ║
║ ┌──────────────────────┐ ║
║ │ 01  Step 1 + desc    │ ║
║ ├──────────────────────┤ ║
║ │ 02  Step 2 + desc    │ ║
║ ├──────────────────────┤ ║
║ │ 03  Step 3 + desc    │ ║
║ └──────────────────────┘ ║
╠══════════════════════════╣
║ CTA + FOOTER (stacked)   ║
╚══════════════════════════╝
```

### A.7.2 Login Page

```
╔══════════════════════════════════════════════════╗
║              (100vh, centred, dark bg)            ║
║                                                  ║
║           ┌──────────────────────────┐           ║
║           │                          │           ║
║           │    GroundTruth           │           ║
║           │    (serif, 1.5rem, link) │           ║
║           │                          │           ║
║           │    Sign in               │           ║
║           │    (serif, 1.25rem)      │           ║
║           │                          │           ║
║           │    ┌──────────────────┐  │           ║
║           │    │ Email            │  │           ║
║           │    │ (rgba bg, 6px r) │  │           ║
║           │    └──────────────────┘  │           ║
║           │                          │           ║
║           │    ┌──────────────────┐  │           ║
║           │    │ Password         │  │           ║
║           │    │ (same style)     │  │           ║
║           │    └──────────────────┘  │           ║
║           │                          │           ║
║           │    ┌──────────────────┐  │           ║
║           │    │   Sign in        │  │           ║
║           │    │ (terracotta bg)  │  │           ║
║           │    └──────────────────┘  │           ║
║           │                          │           ║
║           │    ──── or continue ──── │           ║
║           │                          │           ║
║           │    ┌──────────────────┐  │           ║
║           │    │ G  Google        │  │           ║
║           │    │ (lighter bg)     │  │           ║
║           │    └──────────────────┘  │           ║
║           │                          │           ║
║           │    Don't have account?   │           ║
║           │    Sign up (link)        │           ║
║           │                          │           ║
║           │    max-width: 400px      │           ║
║           └──────────────────────────┘           ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### A.7.3 App Layout Shell

```
Desktop (≥768px)
╔════════════════════╦═══════════════════════════════════════════════════╗
║ SIDEBAR (220px)    ║  CONTENT AREA (flex: 1, cream bg)                ║
║ (dark bg, fixed)   ║                                                  ║
║                    ║  ┌───────────────────────────────────────────┐   ║
║ GroundTruth        ║  │                                           │   ║
║ (serif brand)      ║  │  <Outlet />                               │   ║
║                    ║  │                                           │   ║
║ ┌────────────────┐ ║  │  (Dashboard, SnapList, SnapDetail,       │   ║
║ │🔍 Search addr  │ ║  │   InspectionList, etc.)                  │   ║
║ └────────────────┘ ║  │                                           │   ║
║                    ║  │  padding: 1.5rem                          │   ║
║ ● Dashboard        ║  │  overflow-y: auto                         │   ║
║ ● Properties       ║  │                                           │   ║
║ ● Snaps            ║  │                                           │   ║
║ ● Inspections      ║  │                                           │   ║
║ ● Appraisals       ║  │                                           │   ║
║ ● Monitor          ║  │                                           │   ║
║ ● Walks            ║  │                                           │   ║
║                    ║  │                                           │   ║
║ (active = terra    ║  │                                           │   ║
║  bg highlight)     ║  │                                           │   ║
║                    ║  │                                           │   ║
║ ──────────────     ║  │                                           │   ║
║ user@email.com     ║  │                                           │   ║
║ [Sign out]         ║  │                                           │   ║
║                    ║  └───────────────────────────────────────────┘   ║
╚════════════════════╩═══════════════════════════════════════════════════╝


Mobile (≤768px)
╔══════════════════════════════╗
║ CONTENT AREA (full width)    ║
║                              ║
║  padding: 1.5rem             ║
║  padding-bottom: 4.5rem     ║
║  (clearance for bottom nav)  ║
║                              ║
║  ┌────────────────────────┐  ║
║  │                        │  ║
║  │  <Outlet />            │  ║
║  │                        │  ║
║  │  (page content)        │  ║
║  │                        │  ║
║  └────────────────────────┘  ║
║                              ║
╠══════════════════════════════╣
║ BOTTOM NAV (fixed, 4.5rem)   ║
║ (dark bg, blur backdrop)     ║
║                              ║
║  ◻ Map  ◻ Snaps  ◻ Props  ◻ More ║
║  (icon above label, 0.75rem) ║
╚══════════════════════════════╝
```

### A.7.4 Dashboard

```
Desktop
╔═══════════════════════════════════════════════════╦════════════════════╗
║ MAP (flex: 1)                                     ║ ACTIVITY (480px)   ║
║                                                   ║ (cream bg)         ║
║                                                   ║                    ║
║   ┌─────────────────────┐    ┌──────────┐         ║ Properties         ║
║   │  LAYER CONTROL      │    │ 3D □     │         ║ (serif, 1.125rem)  ║
║   │  ☑ DAs              │    │ toggle   │         ║                    ║
║   │  ☑ Train stations   │    │ 29×29px  │         ║ ┌────────────────┐ ║
║   │  ☑ Railway lines    │    │ top:7.5r │         ║ │ 42 Smith St    │ ║
║   │  ☑ Walk routes      │    │ right:.6 │         ║ │ Marrickville   │ ║
║   └─────────────────────┘    └──────────┘         ║ │ [snap] [insp]  │ ║
║                                                   ║ │ [appr] [mon]   │ ║
║                                                   ║ │        ▾       │ ║
║        ┌─·─┐                                      ║ ├────────────────┤ ║
║        │pin│  ┌─·─┐                               ║ │ ▸ Snap • summ  │ ║
║        └───┘  │pin│    ┌─·─┐                      ║ │   12 Mar 2026  │ ║
║               └───┘    │pin│                      ║ │ ▸ Insp • summ  │ ║
║                        └───┘                      ║ │   10 Mar 2026  │ ║
║                                                   ║ └────────────────┘ ║
║                                                   ║                    ║
║        ┌─·─┐                                      ║ ┌────────────────┐ ║
║        │pin│                                      ║ │ 15 Jones Ave   │ ║
║        └───┘                                      ║ │ Newtown        │ ║
║                                                   ║ │ [snap]         │ ║
║                                                   ║ │        ▾       │ ║
║   ┌─────────────────────┐                         ║ └────────────────┘ ║
║   │ MEASURE TOOLS       │                         ║                    ║
║   │ 📏 Distance  📐 Area│                         ║ ┌────────────────┐ ║
║   └─────────────────────┘                         ║ │ [View all      │ ║
║                                                   ║ │  records]      │ ║
║   ┌─────────────────────┐                         ║ └────────────────┘ ║
║   │ LEGEND              │                         ║                    ║
║   │ ● Property pin      │                         ║                    ║
║   │ ■ DA boundary       │                         ║                    ║
║   │ ▲ Train station     │                         ║                    ║
║   │ — Walk route        │                         ║                    ║
║   │ border: 1px terra   │                         ║                    ║
║   └─────────────────────┘                         ║                    ║
╚═══════════════════════════════════════════════════╩════════════════════╝


Mobile (≤768px)
╔══════════════════════════════╗
║ MAP (flex: 1, min-h: 300px)  ║
║                              ║
║    ┌─·─┐                     ║
║    │pin│  ┌─·─┐              ║
║    └───┘  │pin│              ║
║           └───┘              ║
║                              ║
╠══════════════════════════════╣
║ ACTIVITY (100%, max-h: 40vh) ║
║ (border-top: 2px solid)     ║
║                              ║
║ ┌────────────────────────┐   ║
║ │ 42 Smith St, Marr.     │   ║
║ │ [snap] [insp]   ▾     │   ║
║ ├────────────────────────┤   ║
║ │ 15 Jones Ave, Newt.    │   ║
║ │ [snap]           ▾     │   ║
║ └────────────────────────┘   ║
║ (overflow-y: auto)           ║
╚══════════════════════════════╝
```

### A.7.5 Snap Detail Page

```
╔══════════════════════════════════════════════════════════════════╗
║ TOP BAR                                                         ║
║ [← Back]                                         [🗑 Delete]   ║
║                                                                 ║
║ ◈ PROPOSED: [← Back]            [🗑 Delete] moved to bottom    ║
║ ◈ PROPOSED: Breadcrumb: Dashboard > Properties > 42 Smith > Snap║
╠══════════════════════════════════════════════════════════════════╣
║ HERO SECTION (flex row, gap: 1.25rem)                           ║
║                                                                 ║
║ ┌──────────────┐  ┌──────────────────────────────────────────┐  ║
║ │              │  │                                          │  ║
║ │    Photo     │  │  42 Smith Street                         │  ║
║ │  200 × 150   │  │  (serif, 1.5rem)                         │  ║
║ │  object-fit  │  │                                          │  ║
║ │  cover       │  │  📍 Marrickville NSW 2204                │  ║
║ │  radius:10px │  │  (body, 0.875rem, muted)                 │  ║
║ │              │  │                                          │  ║
║ │  click →     │  │  12 March 2026                           │  ║
║ │  Lightbox    │  │  (data font, 0.75rem, muted)             │  ║
║ │              │  │                                          │  ║
║ └──────────────┘  └──────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════╣
║ INLINE DIFF (if AI changes pending)                             ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ Field        Old Value          New Value         [✓] [✗]  │  ║
║ │ condition    Good               Fair              [✓] [✗]  │  ║
║ │ materials    Brick, timber      Brick, weatherb.  [✓] [✗]  │  ║
║ │ narrative    Original text...   Updated text...   [✓] [✗]  │  ║
║ │                                                            │  ║
║ │ [Accept All]                          [Reject All]         │  ║
║ └────────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════╣
║ CARD GRID (auto-fit, minmax(320px, 1fr), gap: 1rem)             ║
║                                                                 ║
║ ┌───────────────────────┐  ┌───────────────────────┐           ║
║ │ 🔍 AI Assessment      │  │ 👁 Observations       │           ║
║ │ (cream bg, 12px rad)  │  │                       │           ║
║ │                       │  │ Summary text           │           ║
║ │ Summary paragraph     │  │ (0.875rem, body)       │           ║
║ │ (0.875rem)            │  │                       │           ║
║ │                       │  │ ┌───────┬──────┬────┐ │           ║
║ │ ┌───────┬──────┬────┐ │  │ │Label  │Label │Lab │ │           ║
║ │ │Type   │Era   │Cond│ │  │ │Value  │Value │Val │ │           ║
║ │ │Resid. │1920s │Good│ │  │ └───────┴──────┴────┘ │           ║
║ │ └───────┴──────┴────┘ │  │ (3-col grid, 0.75rem  │           ║
║ │ (detail grid, 3 col)  │  │  gap)                  │           ║
║ │                       │  │                       │           ║
║ │ ┌─────────────────┐   │  │ [Confidence: 85%]     │           ║
║ │ │▓▓▓▓▓▓▓▓▓▓░░░│   │  │ [████████░░] 6px bar  │           ║
║ │ │ Confidence: 92% │   │  └───────────────────────┘           ║
║ │ └─────────────────┘   │                                      ║
║ └───────────────────────┘                                      ║
║                                                                 ║
║ ┌───────────────────────┐  ┌───────────────────────┐           ║
║ │ ⚠ Risks               │  │ ✦ Opportunities       │           ║
║ │                       │  │                       │           ║
║ │ • Roof deterioration  │  │ • Heritage listing    │           ║
║ │ • Drainage concerns   │  │ • Subdivision pot.    │           ║
║ │ • Foundation cracks   │  │ • Granny flat add.    │           ║
║ │                       │  │                       │           ║
║ │ [Confidence: 78%]     │  │ [Confidence: 71%]     │           ║
║ │ [██████░░░░] 6px bar  │  │ [█████░░░░░] 6px bar  │           ║
║ └───────────────────────┘  └───────────────────────┘           ║
║                                                                 ║
║ ◈ PROPOSED: [Re-analyse 🔄] button with spinner + progress     ║
║ ◈ PROPOSED: [🗑 Delete] moved here, danger-styled              ║
╚══════════════════════════════════════════════════════════════════╝
```

### A.7.6 Inspection Detail Page

```
╔══════════════════════════════════════════════════════════════════╗
║ TOP BAR                                                         ║
║ [← Back]                    [Re-analyse All]     [🗑 Delete]   ║
╠══════════════════════════════════════════════════════════════════╣
║ HERO (same as SnapDetail — photo + address + meta)              ║
╠══════════════════════════════════════════════════════════════════╣
║ PHOTO CARDS (flex column, gap: 0)                               ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ ┌──────────────┐  ┌────────────────────────────────────┐   │  ║
║ │ │              │  │ Condition: Good                    │   │  ║
║ │ │    Photo 1   │  │ Score: ████████░░ 85/100           │   │  ║
║ │ │  200 × 150   │  │                                    │   │  ║
║ │ │              │  │ Narrative (EditableText):           │   │  ║
║ │ │ [🏷 exterior]│  │ "The front facade shows well-      │   │  ║
║ │ │ [🏷 roof    ]│  │  maintained brickwork with minor    │   │  ║
║ │ │  (tag badges │  │  mortar erosion..."                 │   │  ║
║ │ │   abs btm-l) │  │                                    │   │  ║
║ │ │              │  │ Materials: [Brick] [Tile] [Timber] │   │  ║
║ │ │ [🗑] [🔄]   │  │ (badge row, rounded pills)         │   │  ║
║ │ │ (abs top-r,  │  │                                    │   │  ║
║ │ │  circular)   │  │ Defects:                           │   │  ║
║ │ │              │  │ • Mortar erosion (Medium)           │   │  ║
║ │ │              │  │ • Gutter sag (Low)                  │   │  ║
║ │ └──────────────┘  │                   flex: 1           │   │  ║
║ │                   └────────────────────────────────────┘   │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ ┌──────────────┐  ┌────────────────────────────────────┐   │  ║
║ │ │              │  │ Condition: Fair                    │   │  ║
║ │ │    Photo 2   │  │ Score: ██████░░░░ 62/100           │   │  ║
║ │ │  200 × 150   │  │                                    │   │  ║
║ │ │              │  │ Narrative...                        │   │  ║
║ │ │ [🏷 interior]│  │                                    │   │  ║
║ │ │              │  │ Materials: [Plaster] [Hardwood]    │   │  ║
║ │ │ [🗑] [🔄]   │  │                                    │   │  ║
║ │ │              │  │ Defects:                           │   │  ║
║ │ │              │  │ • Water staining (High)            │   │  ║
║ │ │              │  │ • Cracked plaster (Medium)         │   │  ║
║ │ └──────────────┘  └────────────────────────────────────┘   │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ (repeat for each photo...)                                      ║
╠══════════════════════════════════════════════════════════════════╣
║ INSPECTION REPORT (card)                                        ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ Inspection Report                                          │  ║
║ │ (serif, 1.125rem)                                          │  ║
║ │                                                            │  ║
║ │ CONDITION BREAKDOWN (3-col grid)                           │  ║
║ │ ┌──────────────┬──────────────┬──────────────┐             │  ║
║ │ │ Structural   │ Services     │ Finishes     │             │  ║
║ │ │ Good         │ Fair         │ Poor         │             │  ║
║ │ ├──────────────┼──────────────┼──────────────┤             │  ║
║ │ │ Roof         │ Electrical   │ Paint        │             │  ║
║ │ │ Good         │ Good         │ Fair         │             │  ║
║ │ ├──────────────┼──────────────┼──────────────┤             │  ║
║ │ │ Foundation   │ Plumbing     │ Flooring     │             │  ║
║ │ │ Fair         │ Fair         │ Good         │             │  ║
║ │ └──────────────┴──────────────┴──────────────┘             │  ║
║ │                                                            │  ║
║ │ DEFECTS SUMMARY                                            │  ║
║ │ • Water staining — ceiling, bathroom (High)                │  ║
║ │ • Mortar erosion — exterior east wall (Medium)             │  ║
║ │ • Cracked plaster — living room (Medium)                   │  ║
║ │ • Gutter sag — north side (Low)                            │  ║
║ │                                                            │  ║
║ │ MATERIALS OBSERVED                                         │  ║
║ │ Brick, Tile, Timber, Plaster, Hardwood                     │  ║
║ └────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
```

### A.7.7 Appraisal Detail Page

```
╔══════════════════════════════════════════════════════════════════╗
║ TOP BAR                                                         ║
║ [← Back]                                         [🗑 Delete]   ║
╠══════════════════════════════════════════════════════════════════╣
║ HEADER                                                          ║
║                                                                 ║
║ 42 Smith Street                    ┌──────────────────────┐     ║
║ (serif, 1.375rem)                  │ Est. $1,250,000      │     ║
║ 📍 Marrickville NSW 2204           │ ████████░░ High conf │     ║
║                                    └──────────────────────┘     ║
╠══════════════════════════════════════════════════════════════════╣
║ MAP + COMP SIDEBAR (flex row, h: 500px)                         ║
║                                                                 ║
║ ┌──────────────────────────────────────┐┌──────────────────────┐║
║ │                                      ││ Comparable Sales     │║
║ │         MAPBOX MAP                   ││ 8 comparables        │║
║ │                                      ││ (0.8125rem, 600wt)   │║
║ │    ★ Subject (black pin)             ││────────────────────  │║
║ │                                      ││                      │║
║ │         ● Comp 1 (sage)              ││ IF COMP SELECTED:    │║
║ │                ● Comp 2 (sage)       ││ ┌──────────────────┐ │║
║ │    ● Comp 3 (terracotta = selected)  ││ │ 15 Jones Ave     │ │║
║ │                                      ││ │ $1.18M  420m²    │ │║
║ │                                      ││ │ Sold: Jan 2026   │ │║
║ │  ┌─────────────┐                     ││ │ Score: 87        │ │║
║ │  │ LEGEND      │                     ││ │                  │ │║
║ │  │ ★ Subject   │                     ││ │ [+ Shortlist]    │ │║
║ │  │ ● Comp      │                     ││ └──────────────────┘ │║
║ │  │ ● Selected  │                     ││────────────────────  │║
║ │  └─────────────┘                     ││                      │║
║ │                                      ││ COMP LIST (scroll)   │║
║ │  ┌─────────────────┐                 ││ ┌──────────────────┐ │║
║ │  │ 🚶 Walk to comp │                 ││ │● 10 King St      │ │║
║ │  │ 850m • 11 min   │                 ││ │  $1.2M  Dec 25   │ │║
║ │  └─────────────────┘                 ││ ├──────────────────┤ │║
║ │                                      ││ │● 22 Queen Ave    │ │║
║ │                                      ││ │  $1.15M Nov 25   │ │║
║ │   flex: 1                            ││ ├──────────────────┤ │║
║ └──────────────────────────────────────┘│ │● 8 Park Rd       │ │║
║                                         ││ │  $1.3M  Jan 26   │ │║
║                                         ││ └──────────────────┘ │║
║                                         │└──────────────────────┘║
║                                         │  300px, overflow-y     ║
╠══════════════════════════════════════════════════════════════════╣
║ ESTIMATE SECTION (auto-fit grid, minmax(280px), gap: 1rem)      ║
║                                                                 ║
║ ┌──────────────────────────┐  ┌──────────────────────────┐      ║
║ │ Price Estimate           │  │ Methodology              │      ║
║ │                          │  │                          │      ║
║ │ $1,250,000               │  │ Comparable sales         │      ║
║ │ (serif, 1.5rem)          │  │ analysis using 8         │      ║
║ │                          │  │ recent transactions      │      ║
║ │ Range: $1.15M - $1.35M   │  │ within 1.2km radius,    │      ║
║ │ Rate: $2,976/m²          │  │ adjusted for property    │      ║
║ │ Comps used: 5            │  │ attributes, condition,   │      ║
║ │ Generated: 12 Mar 2026   │  │ and market trends.       │      ║
║ │                          │  │                          │      ║
║ │ [████████░░] High        │  │                          │      ║
║ │ Confidence: 87%          │  │                          │      ║
║ └──────────────────────────┘  └──────────────────────────┘      ║
╠══════════════════════════════════════════════════════════════════╣
║ SELECTED COMPS (auto-fill grid, minmax(260px), gap: 0.75rem)    ║
║                                                                 ║
║ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    ║
║ │ 10 King St      │ │ 22 Queen Ave    │ │ 8 Park Rd       │    ║
║ │ Newtown         │ │ Marrickville    │ │ Enmore          │    ║
║ │                 │ │                 │ │                 │    ║
║ │ $1,200,000      │ │ $1,150,000      │ │ $1,300,000      │    ║
║ │ Adj: $1,240,000 │ │ Adj: $1,210,000 │ │ Adj: $1,260,000 │    ║
║ │ 380m² • 650m    │ │ 410m² • 420m    │ │ 395m² • 890m    │    ║
║ │ Dec 2025        │ │ Nov 2025        │ │ Jan 2026        │    ║
║ │ Score: 92       │ │ Score: 88       │ │ Score: 84       │    ║
║ │                 │ │                 │ │                 │    ║
║ │ ▲ +5% Superior  │ │ ▼ -3% Inferior  │ │ ═ Equal         │    ║
║ └─────────────────┘ └─────────────────┘ └─────────────────┘    ║
╚══════════════════════════════════════════════════════════════════╝
```

### A.7.8 List Page (Generic Pattern)

```
╔══════════════════════════════════════════════════════════════════╗
║ PAGE HEADER                                                     ║
║                                                                 ║
║ 📷 Snaps                                            12 snaps    ║
║ (serif, 1.375rem)                          (body, 0.875rem)    ║
╠══════════════════════════════════════════════════════════════════╣
║ GROUPED FEATURE LIST                                            ║
║ (uses GroupedFeatureList → FeatureCard components)              ║
║                                                                 ║
║ 42 Smith Street, Marrickville  (group header, address)          ║
║ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    ║
║ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │    ║
║ │ │  Thumbnail  │ │ │ │  Thumbnail  │ │ │ │  Thumbnail  │ │    ║
║ │ │  (photo)    │ │ │ │  (photo)    │ │ │ │  (photo)    │ │    ║
║ │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │    ║
║ │                 │ │                 │ │                 │    ║
║ │ Front facade    │ │ Rear yard      │ │ Interior hall   │    ║
║ │ (title, 600wt)  │ │                 │ │                 │    ║
║ │                 │ │ Good • 78%     │ │ Fair • 65%      │    ║
║ │ Good • 92%     │ │ (condition)    │ │                 │    ║
║ │ (condition)    │ │                 │ │ 8 Mar 2026     │    ║
║ │                 │ │ 10 Mar 2026   │ │                 │    ║
║ │ 12 Mar 2026   │ │                 │ │                 │    ║
║ └─────────────────┘ └─────────────────┘ └─────────────────┘    ║
║       grid: repeat(auto-fit, minmax(320px, 1fr))                ║
║                                                                 ║
║ 15 Jones Avenue, Newtown  (next group header)                   ║
║ ┌─────────────────┐                                             ║
║ │ ┌─────────────┐ │                                             ║
║ │ │  Thumbnail  │ │                                             ║
║ │ └─────────────┘ │                                             ║
║ │ Street view     │                                             ║
║ │ Fair • 71%     │                                             ║
║ │ 5 Mar 2026    │                                             ║
║ └─────────────────┘                                             ║
╚══════════════════════════════════════════════════════════════════╝
```

### A.7.9 Walk Detail Page

```
╔══════════════════════════════════════════════════════════════════╗
║ TOP BAR                                                         ║
║ [← Back]                    [Re-analyse 🔄]      [🗑 Delete]   ║
╠══════════════════════════════════════════════════════════════════╣
║ MAP (walk route overlay)                                        ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │                                                            │  ║
║ │        ·─·─·─·─·─·                                        │  ║
║ │      ·´              ·                                     │  ║
║ │    ·                    ·─·─·─·                            │  ║
║ │   ·    (walk route        ·                                │  ║
║ │    ·    polyline)           ·                               │  ║
║ │      ·                      ·                              │  ║
║ │        ·─·─·─·─·─·─·─·─·─·                               │  ║
║ │                                                            │  ║
║ │  Duration: 45 min    Distance: 3.2 km    Photos: 8        │  ║
║ └────────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════╣
║ STREET SCORE                                                    ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │                                                            │  ║
║ │  Overall: 76/100                                           │  ║
║ │  ┌──────────────┐                                          │  ║
║ │  │   ╭─────╮    │                                          │  ║
║ │  │   │ 76  │    │  (score ring, animated fill)             │  ║
║ │  │   ╰─────╯    │                                          │  ║
║ │  └──────────────┘                                          │  ║
║ │                                                            │  ║
║ │  ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ┌────────┐ │  ║
║ │  │ Safety      │ │ Amenity     │ │ Aesthetic │ │ Access │ │  ║
║ │  │ 82/100      │ │ 71/100      │ │ 78/100    │ │ 73/100 │ │  ║
║ │  │             │ │             │ │           │ │        │ │  ║
║ │  │ Well-lit,   │ │ Parks       │ │ Tree-     │ │ Flat,  │ │  ║
║ │  │ clear       │ │ nearby,    │ │ lined,    │ │ wide   │ │  ║
║ │  │ sightlines  │ │ shops      │ │ well-kept │ │ paths  │ │  ║
║ │  └─────────────┘ └─────────────┘ └───────────┘ └────────┘ │  ║
║ └────────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════╣
║ WALK PHOTOS (grid)                                              ║
║                                                                 ║
║ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    ║
║ │   Photo 1  │ │   Photo 2  │ │   Photo 3  │ │   Photo 4  │    ║
║ │            │ │            │ │            │ │            │    ║
║ │ Features:  │ │ Features:  │ │ Concerns:  │ │ Features:  │    ║
║ │ • Tree     │ │ • Park     │ │ • Cracked  │ │ • Cafe     │    ║
║ │ • Footpath │ │ • Bench    │ │   footpath │ │ • Lights   │    ║
║ └────────────┘ └────────────┘ └────────────┘ └────────────┘    ║
╚══════════════════════════════════════════════════════════════════╝
```

### A.7.10 Property Detail Page

```
╔══════════════════════════════════════════════════════════════════╗
║ TOP BAR                                                         ║
║ [← Back]                                                        ║
║ ◈ PROPOSED: Breadcrumb: Dashboard > Properties > 42 Smith St    ║
╠══════════════════════════════════════════════════════════════════╣
║ HEADER                                                          ║
║                                                                 ║
║ 42 Smith Street                                                 ║
║ (serif, 1.375rem)                                               ║
║ 📍 Marrickville NSW 2204                                        ║
╠══════════════════════════════════════════════════════════════════╣
║ ACTIVITY SECTIONS                                               ║
║                                                                 ║
║ Snaps (3)                                                       ║
║ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    ║
║ │ [FeatureCard]   │ │ [FeatureCard]   │ │ [FeatureCard]   │    ║
║ │ Front facade    │ │ Rear yard       │ │ Interior        │    ║
║ │ 12 Mar 2026     │ │ 10 Mar 2026     │ │ 8 Mar 2026      │    ║
║ │ ◈ PROPOSED:     │ │                 │ │                 │    ║
║ │ click → detail  │ │ click → detail  │ │ click → detail  │    ║
║ └─────────────────┘ └─────────────────┘ └─────────────────┘    ║
║                                                                 ║
║ Inspections (1)                                                 ║
║ ┌─────────────────┐                                             ║
║ │ [FeatureCard]   │                                             ║
║ │ Full inspection │                                             ║
║ │ 12 Mar 2026     │                                             ║
║ └─────────────────┘                                             ║
║                                                                 ║
║ Appraisals (1)                                                  ║
║ ┌─────────────────┐                                             ║
║ │ [FeatureCard]   │                                             ║
║ │ Market value    │                                             ║
║ │ $1,250,000      │                                             ║
║ │ 11 Mar 2026     │                                             ║
║ └─────────────────┘                                             ║
║                                                                 ║
║ Monitor (1)                                                     ║
║ ┌─────────────────┐                                             ║
║ │ [FeatureCard]   │                                             ║
║ │ Before/after    │                                             ║
║ │ 15 Mar 2026     │                                             ║
║ └─────────────────┘                                             ║
║                                                                 ║
║ Walks (0)                                                       ║
║ No walks recorded for this property.                            ║
╚══════════════════════════════════════════════════════════════════╝
```

## A.8 Responsive Breakpoint Map

```
VIEWPORT WIDTH
│
│  320px   480px    768px    1024px   1440px
│    │       │        │        │        │
│    ├───────┤        │        │        │
│    │ SMALL │        │        │        │
│    │MOBILE │        │        │        │
│    │       │        │        │        │
│    │• Nav: │        │        │        │
│    │  brand│        │        │        │
│    │  +CTA │        │        │        │
│    │  only │        │        │        │
│    │       │        │        │        │
│    │• Hero:│        │        │        │
│    │  stack│        │        │        │
│    │  phone│        │        │        │
│    │  hide │        │        │        │
│    │       │        │        │        │
│    │• Form:│        │        │        │
│    │  vert │        │        │        │
│    │       │        │        │        │
│    │• Grids│        │        │        │
│    │  1col │        │        │        │
│    │       ├────────┤        │        │
│    │       │ TABLET │        │        │
│    │       │        │        │        │
│    │       │• Hero: │        │        │
│    │       │  stack │        │        │
│    │       │  phone │        │        │
│    │       │  show  │        │        │
│    │       │        │        │        │
│    │       │• App:  │        │        │
│    │       │  bottom│        │        │
│    │       │  nav   │        │        │
│    │       │        │        │        │
│    │       │• Dash: │        │        │
│    │       │  map+  │        │        │
│    │       │  panel │        │        │
│    │       │  stack │        │        │
│    │       │        │        │        │
│    │       │• Cards:│        │        │
│    │       │  2-col │        │        │
│    │       │        ├────────┤        │
│    │       │        │DESKTOP │        │
│    │       │        │        │        │
│    │       │        │• App:  │        │
│    │       │        │  side  │        │
│    │       │        │  bar   │        │
│    │       │        │  220px │        │
│    │       │        │        │        │
│    │       │        │• Hero: │        │
│    │       │        │  2-col │        │
│    │       │        │  row   │        │
│    │       │        │        │        │
│    │       │        │• Dash: │        │
│    │       │        │  map+  │        │
│    │       │        │  panel │        │
│    │       │        │  side  │        │
│    │       │        │  480px │        │
│    │       │        │        │        │
│    │       │        │• Cards:│        │
│    │       │        │  3-col │        │
│    │       │        │  auto  │        │
│    │       │        │  fit   │        │
│    │       │        │        ├────────│
│    │       │        │        │ WIDE   │
│    │       │        │        │ Same   │
│    │       │        │        │ as     │
│    │       │        │        │desktop │
│    │       │        │        │ more   │
│    │       │        │        │ cols   │
│    │       │        │        │ in     │
│    │       │        │        │ grids  │
▼    ▼       ▼        ▼        ▼        ▼

CURRENT BREAKPOINTS USED (inconsistent):
  480px ──── PhoneFrame
  540px ──── Feature tabs (App.module.css)
  640px ──── InlineDiff, SnapDetail, App nav
  768px ──── AppLayout, Dashboard, AppraisalDetail, PhoneFrame
  900px ──── App hero, PhoneFrame

PROPOSED STANDARD (Phase 2.4):
  480px ──── Small mobile
  768px ──── Tablet
  1024px ─── Desktop
```

## A.9 User Flow Diagrams

### A.9.1 Core User Journey

```
                    ┌──────────────┐
                    │  Landing     │
                    │  Page (/)    │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  Login       │
                    │  (/login)    │
                    │  email/pass  │
                    │  or Google   │
                    └──────┬───────┘
                           │ authenticated
                           ▼
                    ┌──────────────┐
                    │  Dashboard   │◄─────────────────────────────┐
                    │  (/app)      │                              │
                    │  Map + Feed  │                              │
                    └──┬───┬───┬──┘                              │
                       │   │   │                                  │
          ┌────────────┘   │   └────────────┐                    │
          ▼                ▼                ▼                    │
   ┌────────────┐  ┌────────────┐  ┌────────────┐              │
   │  Click     │  │  Click     │  │  Navigate  │              │
   │  map pin   │  │  activity  │  │  via       │              │
   │            │  │  feed item │  │  sidebar   │              │
   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘              │
         │               │               │                      │
         ▼               ▼               ▼                      │
   ┌───────────────────────────────────────────┐                │
   │              Detail Pages                  │                │
   │  ┌──────────────────────────────────────┐ │                │
   │  │  View data + AI analysis             │ │                │
   │  │         │                            │ │                │
   │  │    ┌────┴─────┬──────────┐           │ │                │
   │  │    ▼          ▼          ▼           │ │                │
   │  │  Edit      Re-analyse   Delete      │ │                │
   │  │  fields    (AI)         (confirm)   │ │                │
   │  │  (Editable  │               │       │ │                │
   │  │   Text)     ▼               ▼       │ │                │
   │  │           Review         Redirect ──┼─┼──► List page   │
   │  │           InlineDiff       │        │ │       │         │
   │  │           Accept/Reject    │        │ │       │         │
   │  └──────────────────────────────────────┘ │       │         │
   └───────────────────────────────────────────┘       │         │
                                                       │         │
                                              [← Back] │         │
                                                       ▼         │
                                                  ┌──────────┐  │
                                                  │ List     │  │
                                                  │ Pages    │──┘
                                                  │ (browse) │
                                                  └──────────┘
```

### A.9.2 AI Analysis Flow

```
User takes photo (mobile app)
         │
         ▼
┌─────────────────────┐
│ Photo uploaded to   │
│ Supabase storage    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐      ┌──────────────────────┐
│ Record created in   │      │ User clicks          │
│ snaps / inspections │      │ "Re-analyse" button  │
│ / walks table       │      │ on detail page       │
└────────┬────────────┘      └──────────┬───────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │ aiService.ts     │
         │                  │
         │ analyseSnap()    │
         │ analyseInspect() │
         │ analyseExplore() │
         │ analyseAppraisal │
         │ Photos()         │
         └────────┬─────────┘
                  │ .functions.invoke()
                  ▼
         ┌──────────────────┐
         │ Supabase Edge    │
         │ Function         │
         │                  │
         │ Receives photo   │
         │ URL + context    │
         │                  │
         │ Calls AI vision  │
         │ model            │
         │                  │
         │ Returns:         │
         │ • condition      │
         │ • materials      │
         │ • defects        │
         │ • narrative      │
         │ • scores         │
         │ • features       │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Results stored   │
         │ alongside        │
         │ original data    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ InlineDiff shows │
         │ old vs new       │
         │ values           │
         │                  │
         │ User accepts or  │
         │ rejects per field│
         │                  │
         │ Accepted changes │
         │ saved via api.ts │
         │ update functions │
         └──────────────────┘
```

---

# Part B — Proposed Design Changes: Directory-First Architecture

## B.1 The Problem

The current information architecture is **activity-centric**: users navigate by activity type (Snaps, Inspections, Appraisals, Monitor, Walks) and properties emerge as a side-effect of grouping activities by address string.

This creates several UX problems:

```
CURRENT MENTAL MODEL (activity-first)         USER'S ACTUAL MENTAL MODEL (property-first)
═══════════════════════════════════════       ═══════════════════════════════════════════

 "I want to see my snap"                      "I want to see everything about
  → Navigate to Snaps list                      42 Smith Street"
  → Find the snap                               → Find the property
  → View it (no context of                      → See all activities in one place
     what else exists at                         → Organised within my project
     this property)

 "I want to see all properties                 "Show me my Marrickville
  I've inspected"                                investment portfolio"
  → ...there's no way to do this                → Open that directory
     except scrolling every list                 → See all 8 properties
                                                 → See progress at a glance
```

**Key gaps:**
1. No way to organise properties into logical groups (portfolios, projects, clients)
2. No property-centric view — you must know which activity type to look for
3. Walks don't connect to properties at all (no address field)
4. No concept of "completeness" — which properties still need inspection? appraisal?
5. The 7-item sidebar (Dashboard + 6 modules) spreads related work across too many views

## B.2 Proposed Information Architecture

### The Directory Model

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Directory (NEW first-class entity)                             │
│  ═══════════════════════════════════                            │
│  A named collection of properties with a purpose.              │
│  Think: project folder, client portfolio, investigation area.  │
│                                                                 │
│  Fields:                                                        │
│  • id (uuid)                                                    │
│  • name (string) — e.g. "Marrickville Portfolio"                │
│  • description (string, optional)                               │
│  • colour (string, optional) — for map pin tinting              │
│  • icon (string, optional) — visual identifier                  │
│  • userId (uuid)                                                │
│  • createdAt, updatedAt                                         │
│  • isArchived (boolean) — soft-archive old directories          │
│                                                                 │
│  Examples:                                                      │
│  • "Inner West Investment Properties"                           │
│  • "Client: Jane Smith"                                         │
│  • "Q1 2026 Inspection Round"                                   │
│  • "Renovation Targets"                                         │
│  • "Personal Watchlist"                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ has many
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Property (promoted to first-class entity)                      │
│  ═════════════════════════════════════════                      │
│  Currently just a DB view. Becomes a real table with its own    │
│  lifecycle. A property belongs to one directory.                │
│                                                                 │
│  Fields:                                                        │
│  • id (uuid) — replaces normalisedAddress as key                │
│  • directoryId (uuid, FK)                                       │
│  • address (string)                                             │
│  • normalisedAddress (string, for dedup)                        │
│  • suburb (string)                                              │
│  • latitude, longitude                                          │
│  • propid (optional, external ref)                              │
│  • notes (string, optional) — user notes about the property     │
│  • status (enum) — e.g. "active", "under_offer", "settled"     │
│  • userId (uuid)                                                │
│  • createdAt, updatedAt                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ has many (via propertyId FK)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Activities (existing tables, modified)                         │
│  ═════════════════════════════════════                          │
│  Each activity gains a propertyId FK (replacing address-based   │
│  grouping). Address fields kept for display but no longer used  │
│  as the grouping key.                                           │
│                                                                 │
│  ┌───────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────┐ │
│  │  Snap     │ │  Inspection  │ │  Appraisal │ │  Monitor   │ │
│  │           │ │              │ │            │ │  (Watched  │ │
│  │ +property │ │ +propertyId  │ │ +property  │ │  Property) │ │
│  │  Id (FK)  │ │  (FK)        │ │  Id (FK)   │ │ +property  │ │
│  │           │ │              │ │            │ │  Id (FK)   │ │
│  └───────────┘ └──────────────┘ └────────────┘ └────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WalkSession (special case)                                │ │
│  │                                                            │ │
│  │  Walks can optionally link to a property OR remain          │ │
│  │  directory-level. A walk through a neighbourhood might      │ │
│  │  touch multiple properties.                                 │ │
│  │                                                            │ │
│  │  +directoryId (FK) — always belongs to a directory          │ │
│  │  +propertyId (FK, nullable) — optionally linked             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Entity Relationship Diagram

```
┌──────────┐        ┌──────────────┐        ┌──────────────────┐
│   User   │        │  Directory   │        │    Property      │
│          │ 1────* │              │ 1────* │                  │
│ id       │        │ id           │        │ id               │
│ email    │        │ name         │        │ directoryId (FK) │
│          │        │ description  │        │ address          │
│          │        │ colour       │        │ suburb           │
│          │        │ icon         │        │ lat/lng          │
│          │        │ userId (FK)  │        │ status           │
│          │        │ isArchived   │        │ notes            │
│          │        │ createdAt    │        │ userId (FK)      │
└──────────┘        └──────────────┘        └────────┬─────────┘
                                                     │
                                          1──────────┤────────1
                                          │          │        │
                                     ┌────┴───┐ ┌───┴────┐ ┌─┴──────────┐
                                     │ Snaps  │ │Inspect.│ │ Appraisals │
                                     │ *      │ │ *      │ │ *          │
                                     │propId  │ │propId  │ │ propId     │
                                     └────────┘ └────────┘ └────────────┘
                                          │          │
                                     ┌────┴───┐ ┌───┴────────┐
                                     │Monitor │ │WalkSessions│
                                     │ *      │ │ *          │
                                     │propId  │ │directoryId │
                                     └────────┘ │propId (opt)│
                                                └────────────┘
```

## B.3 Proposed Navigation & Routing

### New Sidebar

```
CURRENT SIDEBAR (7 items, flat)      PROPOSED SIDEBAR (contextual)
════════════════════════════════      ════════════════════════════════

  GroundTruth                           GroundTruth

  🔍 Search address                     🔍 Search properties

  ● Dashboard                           ● Dashboard (map overview)
  ● Properties                          ──────────────────────
  ● Snaps                               MY DIRECTORIES
  ● Inspections                         📁 Inner West Portfolio
  ● Appraisals                          📁 Client: Jane Smith
  ● Monitor                             📁 Q1 Inspections
  ● Walks                               📁 Personal Watchlist
                                        ──────────────────────
  ──────────────────────                 [+ New directory]
  user@email.com
  [Sign out]                            ──────────────────────
                                        ● Recent activity
                                        ● Walks (area-based)

                                        ──────────────────────
                                        user@email.com
                                        [Sign out]
```

### New Route Structure

```
/                               Landing page (unchanged)
/login                          Login (unchanged)
/app                            Dashboard — map showing all properties across all directories
│
├── /app/directories                    Directory list (home/overview)
├── /app/directories/:id                Directory detail — properties within
├── /app/directories/:id/properties/:id Property detail — all activities
│
├── /app/properties/:id                 Property detail (direct link, no directory context)
│
├── /app/snaps/:id                      Snap detail (direct link)
├── /app/inspections/:id                Inspection detail (direct link)
├── /app/appraisals/:id                 Appraisal detail (direct link)
├── /app/monitor/:id                    Monitor detail (direct link)
├── /app/walks/:id                      Walk detail (direct link)
│
└── /app/walks                          Walk list (area-based, not property-specific)
```

## B.4 Proposed Page Wireframes

### B.4.1 Dashboard (Redesigned)

The dashboard becomes a cross-directory overview. The map shows all properties, colour-coded by directory. The sidebar becomes a quick-access panel.

```
Desktop
╔═══════════════════════════════════════════════════╦════════════════════╗
║ MAP (flex: 1)                                     ║ QUICK ACCESS       ║
║                                                   ║ (480px)            ║
║   Properties colour-coded by directory:           ║                    ║
║                                                   ║ ┌────────────────┐ ║
║        🔴 🔴        (Inner West Portfolio)         ║ │ RECENT         │ ║
║                                                   ║ │                │ ║
║           🔵            (Client: Jane Smith)       ║ │ 📷 Snap added  │ ║
║                                                   ║ │ 42 Smith St    │ ║
║     🟢 🟢 🟢           (Q1 Inspections)           ║ │ 2 hours ago    │ ║
║                                                   ║ │                │ ║
║                                                   ║ │ 🔍 Inspection  │ ║
║   Click pin → Property detail                     ║ │ 15 Jones Ave   │ ║
║   Click cluster → Zoom in                         ║ │ yesterday      │ ║
║                                                   ║ │                │ ║
║   ┌─────────────────────┐                         ║ │ 💰 Appraisal   │ ║
║   │ LEGEND              │                         ║ │ 8 Park Rd      │ ║
║   │ 🔴 Inner West Port. │                         ║ │ 3 days ago     │ ║
║   │ 🔵 Client: Jane     │                         ║ └────────────────┘ ║
║   │ 🟢 Q1 Inspections   │                         ║                    ║
║   │ ■ DA boundary       │                         ║ ┌────────────────┐ ║
║   │ ▲ Train station     │                         ║ │ NEEDS ACTION   │ ║
║   │ — Walk route        │                         ║ │                │ ║
║   └─────────────────────┘                         ║ │ ⚠ 3 properties │ ║
║                                                   ║ │ missing insp.  │ ║
║                                                   ║ │                │ ║
║                                                   ║ │ ⚠ 2 monitor    │ ║
║   ┌─────────────────────┐                         ║ │ alerts         │ ║
║   │ MEASURE / 3D / etc  │                         ║ │                │ ║
║   └─────────────────────┘                         ║ └────────────────┘ ║
╚═══════════════════════════════════════════════════╩════════════════════╝
```

### B.4.2 Directory List (New Page)

The new home screen when user has multiple directories.

```
╔══════════════════════════════════════════════════════════════════╗
║ MY DIRECTORIES                              [+ New directory]   ║
║ (serif, 1.375rem)                                               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ ┌──────────────────────────────────────────────────────────────┐║
║ │ 📁 Inner West Investment Portfolio                    🔴     │║
║ │    8 properties • 23 activities • Last: 2 hours ago          │║
║ │                                                              │║
║ │    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │║
║ │    │ 📷 12   │ │ 🔍 8    │ │ 💰 5    │ │ 👁 8    │         │║
║ │    │ snaps   │ │ insp.   │ │ appr.   │ │ monitor │         │║
║ │    └─────────┘ └─────────┘ └─────────┘ └─────────┘         │║
║ │                                                              │║
║ │    Progress: ██████████░░░░ 6/8 properties inspected        │║
║ └──────────────────────────────────────────────────────────────┘║
║                                                                 ║
║ ┌──────────────────────────────────────────────────────────────┐║
║ │ 📁 Client: Jane Smith                                 🔵     │║
║ │    3 properties • 9 activities • Last: yesterday             │║
║ │                                                              │║
║ │    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │║
║ │    │ 📷 4    │ │ 🔍 3    │ │ 💰 2    │ │ 👁 0    │         │║
║ │    │ snaps   │ │ insp.   │ │ appr.   │ │ monitor │         │║
║ │    └─────────┘ └─────────┘ └─────────┘ └─────────┘         │║
║ │                                                              │║
║ │    Progress: ████████████░░ 2/3 properties appraised        │║
║ └──────────────────────────────────────────────────────────────┘║
║                                                                 ║
║ ┌──────────────────────────────────────────────────────────────┐║
║ │ 📁 Q1 2026 Inspection Round                           🟢     │║
║ │    15 properties • 42 activities • Last: 3 days ago          │║
║ │    ...                                                       │║
║ └──────────────────────────────────────────────────────────────┘║
║                                                                 ║
║ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐║
║   ARCHIVED                                                     ║
║ │                                                             │║
║   📁 2025 Annual Review (archived)  [Restore]                  ║
║ │ 📁 Old Portfolio (archived)        [Restore]                │║
║ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘║
╚══════════════════════════════════════════════════════════════════╝
```

### B.4.3 Directory Detail (New Page — The Key Page)

This replaces the old flat property list + individual activity lists. It's the **workspace** for a collection of properties.

```
╔══════════════════════════════════════════════════════════════════╗
║ HEADER                                                          ║
║                                                                 ║
║ [← Directories]                                                 ║
║                                                                 ║
║ 📁 Inner West Investment Portfolio                              ║
║ (serif, 1.5rem)                                                 ║
║ 8 properties • Created 15 Jan 2026                              ║
║                                                                 ║
║ [+ Add property]   [📍 Map view]   [≡ List view]   [⚙ Edit]   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ ┌── FILTER BAR ──────────────────────────────────────────────┐  ║
║ │ 🔍 Filter properties...    [All] [Needs inspection] [Alerts]│  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ── LIST VIEW ───────────────────────────────────────────────── ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ ┌──────────┐                                               │  ║
║ │ │          │  42 Smith Street, Marrickville                 │  ║
║ │ │ Thumb    │  Status: Active                                │  ║
║ │ │          │                                                │  ║
║ │ └──────────┘  📷 3 snaps  🔍 1 inspection  💰 1 appraisal  │  ║
║ │               👁 1 monitoring  🚶 0 walks                   │  ║
║ │                                                            │  ║
║ │               Last activity: 2 hours ago                    │  ║
║ │               ⚠ No walk score yet                           │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ ┌──────────┐                                               │  ║
║ │ │          │  15 Jones Avenue, Newtown                      │  ║
║ │ │ Thumb    │  Status: Under offer                           │  ║
║ │ │          │                                                │  ║
║ │ └──────────┘  📷 1 snap   🔍 0 inspections  💰 0 appraisals│  ║
║ │               👁 0 monitoring                               │  ║
║ │                                                            │  ║
║ │               Last activity: 5 days ago                     │  ║
║ │               ⚠ Needs inspection  ⚠ Needs appraisal        │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ ... more properties ...                                    │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ── MAP VIEW (toggle) ──────────────────────────────────────── ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │                                                            │  ║
║ │    Map showing only this directory's properties            │  ║
║ │    Auto-fitted bounds to show all pins                     │  ║
║ │                                                            │  ║
║ │        🔴        🔴                                        │  ║
║ │                                                            │  ║
║ │     🔴     🔴              🔴                              │  ║
║ │                                                            │  ║
║ │              🔴      🔴                                    │  ║
║ │                           🔴                               │  ║
║ │                                                            │  ║
║ │    Click pin → Property detail                             │  ║
║ └────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
```

### B.4.4 Property Detail (Redesigned — The Hub)

This becomes the **single source of truth** for everything about a property. All activities are visible in one place, organised by type with clear status.

```
╔══════════════════════════════════════════════════════════════════╗
║ BREADCRUMB                                                      ║
║ Inner West Portfolio > 42 Smith Street                          ║
╠══════════════════════════════════════════════════════════════════╣
║ HEADER                                                          ║
║                                                                 ║
║ ┌──────────────┐  42 Smith Street                               ║
║ │              │  Marrickville NSW 2204                         ║
║ │    Photo     │  (serif, 1.5rem)                               ║
║ │   (latest    │                                                ║
║ │    snap)     │  Status: [Active ▾]     [📝 Notes] [⚙ Edit]  ║
║ │              │                                                ║
║ └──────────────┘  User notes: "Federation cottage, good bones, ║
║                    needs roof work. Agent: Sarah 0412..."       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ ACTIVITY TABS                                                   ║
║ ┌──────────┬────────────┬────────────┬──────────┬─────────┐    ║
║ │ Overview │ 📷 Snaps(3)│ 🔍 Insp(1) │ 💰 App(1)│ 👁 Mon(1)│    ║
║ └──────────┴────────────┴────────────┴──────────┴─────────┘    ║
║                                                                 ║
║ ── OVERVIEW TAB (default) ──────────────────────────────────── ║
║                                                                 ║
║ COMPLETENESS                                                    ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │  📷 Snaps        ████████████████  3 captured              │  ║
║ │  🔍 Inspection   ████████████████  1 complete              │  ║
║ │  💰 Appraisal    ████████████████  1 complete ($1.25M)     │  ║
║ │  👁 Monitor      ████████████████  1 active (no alerts)    │  ║
║ │  🚶 Walk score   ░░░░░░░░░░░░░░░░  Not yet scored         │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ QUICK STATS                                                     ║
║ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             ║
║ │ Est. value   │ │ Condition    │ │ Walk score   │             ║
║ │ $1,250,000   │ │ Good (85%)   │ │ — / 100      │             ║
║ │ High conf.   │ │ via inspect. │ │ needs walk   │             ║
║ └──────────────┘ └──────────────┘ └──────────────┘             ║
║                                                                 ║
║ RECENT ACTIVITY (timeline)                                      ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ ● 2 hours ago — Snap added (front facade)           [→]   │  ║
║ │ │                                                          │  ║
║ │ ● Yesterday — Monitor check (no changes detected)  [→]   │  ║
║ │ │                                                          │  ║
║ │ ● 3 days ago — Appraisal completed ($1.25M)         [→]   │  ║
║ │ │                                                          │  ║
║ │ ● 5 days ago — Inspection completed (Good, 85/100)  [→]   │  ║
║ │ │                                                          │  ║
║ │ ● 1 week ago — First snap (added to directory)      [→]   │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ── SNAPS TAB ───────────────────────────────────────────────── ║
║                                                                 ║
║ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             ║
║ │ Front facade │ │ Rear yard    │ │ Interior     │             ║
║ │ [Photo]      │ │ [Photo]      │ │ [Photo]      │             ║
║ │              │ │              │ │              │             ║
║ │ Good • 92%   │ │ Good • 78%   │ │ Fair • 65%   │             ║
║ │ 12 Mar 2026  │ │ 10 Mar 2026  │ │ 8 Mar 2026   │             ║
║ │              │ │              │ │              │             ║
║ │ Click → Snap │ │ Click → Snap │ │ Click → Snap │             ║
║ │ detail page  │ │ detail page  │ │ detail page  │             ║
║ └──────────────┘ └──────────────┘ └──────────────┘             ║
║                                                                 ║
║ [+ Add snap]                                                    ║
║                                                                 ║
║ ── INSPECTION TAB ─────────────────────────────────────────── ║
║ (Shows inspection detail inline or links to detail page)       ║
║                                                                 ║
║ ── APPRAISAL TAB ──────────────────────────────────────────── ║
║ (Shows appraisal with map, comps, estimate)                    ║
║                                                                 ║
║ ── MONITOR TAB ─────────────────────────────────────────────── ║
║ (Shows before/after, alerts, change history)                   ║
╚══════════════════════════════════════════════════════════════════╝
```

### B.4.5 Add Property Flow (New)

```
╔══════════════════════════════════════════════════════════════════╗
║ ADD PROPERTY TO: Inner West Portfolio                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ 🔍 Search for an address...                                │  ║
║ │                                                            │  ║
║ │ (Mapbox geocoder / address autocomplete)                   │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ OR                                                              ║
║                                                                 ║
║ ┌────────────────────────────────────────────────────────────┐  ║
║ │ 📍 Drop a pin on the map                                   │  ║
║ │                                                            │  ║
║ │ ┌────────────────────────────────────────────────────────┐ │  ║
║ │ │                                                        │ │  ║
║ │ │              (Interactive map)                         │ │  ║
║ │ │              Click to place pin                        │ │  ║
║ │ │                                                        │ │  ║
║ │ └────────────────────────────────────────────────────────┘ │  ║
║ └────────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║ ── AFTER ADDRESS SELECTED ──────────────────────────────────── ║
║                                                                 ║
║ Address:  42 Smith Street, Marrickville NSW 2204                ║
║ Suburb:   Marrickville                                          ║
║ Coords:   -33.9105, 151.1553                                   ║
║                                                                 ║
║ Status:   [Active ▾]                                            ║
║ Notes:    [                                          ]          ║
║                                                                 ║
║ ⚠ This address already exists in "Q1 Inspections"              ║
║   [Link existing] or [Create new entry]                         ║
║                                                                 ║
║ [Cancel]                                    [Add property]      ║
╚══════════════════════════════════════════════════════════════════╝
```

### B.4.6 New Sidebar with Directory Context

When a user is inside a directory, the sidebar shifts to show property-level navigation:

```
TOP-LEVEL SIDEBAR                    INSIDE A DIRECTORY
════════════════════                 ════════════════════

  GroundTruth                          GroundTruth

  🔍 Search properties                 [← All directories]

  ● Dashboard                          📁 Inner West Portfolio
  ──────────────────                    ──────────────────────
  MY DIRECTORIES                        PROPERTIES
  📁 Inner West Portfolio               ● 42 Smith St ⬤
  📁 Client: Jane Smith                 ● 15 Jones Ave ⬤
  📁 Q1 Inspections                     ● 8 Park Rd ⬤
  📁 Personal Watchlist                 ● 22 Queen Ave
  ──────────────────                    ● 5 King St
  [+ New directory]                     ● 30 Railway Pde
                                        ● 11 Church St
  ──────────────────                    ● 7 Illawarra Rd
  ● Recent activity                     ──────────────────────
  ● Walks                               [+ Add property]

  ──────────────────                    ──────────────────
  user@email.com                        ● Map view
  [Sign out]                            ● Walks in area

                                        ──────────────────
                                        user@email.com
                                        [Sign out]

                                        (⬤ = has alerts)
```

## B.5 Navigation Flow (Redesigned)

```
                         ┌──────────────┐
                         │  Dashboard   │
                         │  (map + feed)│
                         └──────┬───────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
                 ▼              ▼              ▼
          ┌────────────┐ ┌───────────┐  ┌──────────┐
          │ Click pin  │ │ Click     │  │ Click    │
          │ on map     │ │ directory │  │ recent   │
          │            │ │ in sidebar│  │ activity │
          └─────┬──────┘ └─────┬─────┘  └────┬─────┘
                │              │              │
                │              ▼              │
                │    ┌──────────────────┐     │
                │    │ Directory Detail │     │
                │    │ (property list)  │     │
                │    └────────┬─────────┘     │
                │             │               │
                ▼             ▼               │
         ┌──────────────────────────┐         │
         │    Property Detail       │◄────────┘
         │    (the hub)             │
         │                         │
         │  Overview tab:          │
         │  • Completeness tracker │
         │  • Quick stats          │
         │  • Activity timeline    │
         │                         │
         │  Activity tabs:         │
         │  • Snaps → SnapDetail   │
         │  • Inspection → InspDet │
         │  • Appraisal → ApprDet  │
         │  • Monitor → MonDetail  │
         │                         │
         └─────────────────────────┘
                    │
                    │ click activity card
                    ▼
         ┌──────────────────────────┐
         │    Activity Detail       │
         │                         │
         │  Breadcrumb:            │
         │  Inner West > 42 Smith  │
         │  > Snap: Front facade   │
         │                         │
         │  [← Back to property]   │
         └─────────────────────────┘
```

## B.6 Key UX Improvements This Enables

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. COMPLETENESS TRACKING                                         │
│                                                                  │
│ Directory view shows at a glance which properties need work:     │
│                                                                  │
│  42 Smith St    📷✓  🔍✓  💰✓  👁✓  🚶✗  ← needs walk          │
│  15 Jones Ave   📷✓  🔍✗  💰✗  👁✗  🚶✗  ← needs everything    │
│  8 Park Rd      📷✓  🔍✓  💰✓  👁✓  🚶✓  ← complete ✓         │
│                                                                  │
│ Progress bar: ████████░░░░ 1/3 properties fully assessed         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. CONTEXTUAL NAVIGATION                                         │
│                                                                  │
│ User is always oriented:                                         │
│  • Which directory am I in?                                      │
│  • Which property am I looking at?                               │
│  • What's the full picture for this property?                    │
│  • What still needs doing?                                       │
│                                                                  │
│ vs current: "I'm looking at Snap #47... what property is this?   │
│ What other work has been done here? Is there an appraisal?"      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. MULTI-PROJECT SUPPORT                                         │
│                                                                  │
│ A user working across multiple clients/projects can:             │
│  • Switch between directories in sidebar                         │
│  • See cross-directory overview on dashboard                     │
│  • Archive completed projects                                    │
│  • Share directories (future: collaboration)                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. REDUCED COGNITIVE LOAD                                        │
│                                                                  │
│ Sidebar goes from 7 competing nav items to:                      │
│  • Dashboard (overview)                                          │
│  • Your directories (organised work)                             │
│  • Walks (area-based, separate concern)                          │
│                                                                  │
│ Users think in terms of "my projects" and "my properties",       │
│ not "my snaps" and "my inspections".                             │
└──────────────────────────────────────────────────────────────────┘
```

## B.7 Migration Strategy

This is a significant change. Proposed phased approach:

```
PHASE M1: Database (backend)
├── Create `directories` table
├── Create `properties` table (with directoryId FK)
├── Add `propertyId` FK column to snaps, inspections, appraisals, watched_properties
├── Migration script: auto-create a "My Properties" default directory per user
├── Migration script: create property records from existing address groupings
├── Migration script: backfill propertyId on all existing activities
└── Keep address fields for display (don't remove)

PHASE M2: API layer
├── Add directory CRUD to api.ts (createDirectory, listDirectories, etc.)
├── Add property CRUD to api.ts (createProperty, listPropertiesInDirectory, etc.)
├── Update activity queries to filter by propertyId instead of address ilike
├── Keep backward-compatible address-based queries during transition
└── Update GroupedProperty type to use property ID

PHASE M3: Frontend — Routes & Navigation
├── Add new routes: /app/directories, /app/directories/:id
├── Update sidebar to show directories instead of activity modules
├── Create DirectoryList page
├── Create DirectoryDetail page
├── Redesign PropertyDetail with tabs (overview, snaps, insp, appr, mon)
└── Keep old activity routes working as direct-link fallbacks

PHASE M4: Frontend — Dashboard & Polish
├── Redesign dashboard sidebar (recent activity + needs action)
├── Colour-code map pins by directory
├── Add completeness tracking to directory and property views
├── Add "Add property" flow with address search + map pin
├── Archive old activity list pages (keep accessible but remove from primary nav)
└── Update breadcrumbs throughout
```

## B.8 Action Items for Directory-First Redesign

- [x] B.8.1 Database schema changes
  - [x] B.8.1.1 Design `directories` table schema (id, name, description, colour, icon, userId, isArchived, timestamps)
  - [x] B.8.1.2 Design `properties` table schema (id, directoryId FK, address, normalisedAddress, suburb, lat/lng, status, notes, userId, timestamps)
  - [x] B.8.1.3 Add `property_id` column to `snaps` table (FK, nullable during migration)
  - [x] B.8.1.4 Add `property_id` column to `inspections` table
  - [x] B.8.1.5 Add `property_id` column to `appraisals` table
  - [x] B.8.1.6 Add `property_id` column to `watched_properties` table
  - [x] B.8.1.7 Add `directory_id` column to `walk_sessions` table
  - [x] B.8.1.8 Add optional `property_id` column to `walk_sessions` table
  - [x] B.8.1.9 Create migration script: default "My Properties" directory per user
  - [x] B.8.1.10 Create migration script: generate property records from existing `properties_grouped` view
  - [x] B.8.1.11 Create migration script: backfill `property_id` on all activity records
  - [x] B.8.1.12 Add RLS policies for directories and properties tables
  - [x] B.8.1.13 Update or replace `properties_grouped` DB view
- [x] B.8.2 TypeScript types (`src/types/common.ts`)
  - [x] B.8.2.1 Add `Directory` interface (id, name, description, colour, icon, isArchived, createdAt, updatedAt)
  - [x] B.8.2.2 Add `DirectorySummary` interface (directory + property count, activity counts, progress)
  - [x] B.8.2.3 Update `Property` interface — add id, directoryId, status, notes fields
  - [x] B.8.2.4 Update `Snap`, `Inspection`, `Appraisal`, `WatchedProperty` — add propertyId field
  - [x] B.8.2.5 Update `WalkSession` — add directoryId, optional propertyId
  - [x] B.8.2.6 Add `PropertyStatus` enum type ("active", "under_offer", "settled", "archived")
  - [x] B.8.2.7 Add `PropertyCompleteness` interface (hasSnaps, hasInspection, hasAppraisal, hasMonitor, hasWalkScore)
- [x] B.8.3 API layer (`src/services/api.ts`)
  - [x] B.8.3.1 Add `createDirectory(name, description?, colour?)` function
  - [x] B.8.3.2 Add `listDirectories()` function — returns DirectorySummary[]
  - [x] B.8.3.3 Add `getDirectory(id)` function
  - [x] B.8.3.4 Add `updateDirectory(id, fields)` function
  - [x] B.8.3.5 Add `archiveDirectory(id)` function (soft archive)
  - [x] B.8.3.6 Add `createProperty(directoryId, address, suburb, lat, lng)` function
  - [x] B.8.3.7 Add `listPropertiesInDirectory(directoryId)` function
  - [x] B.8.3.8 Add `getProperty(id)` function — returns property with activity counts + completeness
  - [x] B.8.3.9 Add `updateProperty(id, fields)` function (status, notes)
  - [x] B.8.3.10 Add `getPropertyActivities(propertyId)` — returns all snaps, inspections, etc. for a property
  - [x] B.8.3.11 Update existing `listSnaps()` etc. to accept optional `propertyId` filter
  - [x] B.8.3.12 Update `getAllPins()` to include directoryId for colour-coding
- [x] B.8.4 New pages
  - [x] B.8.4.1 Create `src/pages/directories/DirectoryList.tsx` — grid of directory cards with summaries
  - [x] B.8.4.2 Create `src/pages/directories/DirectoryList.module.css`
  - [x] B.8.4.3 Create `src/pages/directories/DirectoryDetail.tsx` — property list with filters, map/list toggle
  - [x] B.8.4.4 Create `src/pages/directories/DirectoryDetail.module.css`
  - [x] B.8.4.5 Create `src/pages/directories/CreateDirectory.tsx` — name, description, colour picker modal
  - [x] B.8.4.6 Create `src/pages/directories/AddProperty.tsx` — address search + map pin drop + confirmation
- [x] B.8.5 Redesign Property Detail (`src/pages/properties/PropertyDetail.tsx`)
  - [x] B.8.5.1 Add tabbed interface (Overview, Snaps, Inspections, Appraisals, Monitor)
  - [x] B.8.5.2 Add Overview tab with completeness tracker, quick stats, activity timeline
  - [x] B.8.5.3 Add Snaps tab showing snap cards with [+ Add snap] action
  - [x] B.8.5.4 Add Inspections tab showing inspection summary or link to detail
  - [x] B.8.5.5 Add Appraisals tab showing appraisal summary with estimate
  - [x] B.8.5.6 Add Monitor tab showing change history and alerts
  - [x] B.8.5.7 Add property header with status dropdown, notes field, edit action
  - [x] B.8.5.8 Update breadcrumb: Directory name > Property address
  - [x] B.8.5.9 Update routing to `/app/directories/:dirId/properties/:propId`
- [x] B.8.6 Redesign navigation (`src/components/layout/AppLayout.tsx`)
  - [x] B.8.6.1 Replace 7-item flat nav with contextual sidebar (directories list or property list)
  - [x] B.8.6.2 Add directory list in sidebar with direct click to directory detail
  - [x] B.8.6.3 Add [+ New directory] button in sidebar
  - [x] B.8.6.4 When inside a directory, show property list in sidebar with back button
  - [x] B.8.6.5 Keep Dashboard and Walks as top-level nav items
  - [x] B.8.6.6 Update mobile bottom nav (Dashboard, Directories, Walks, Profile)
  - [x] B.8.6.7 Update AddressSearch to navigate to property within its directory
- [x] B.8.7 Redesign Dashboard (`src/pages/Dashboard.tsx`)
  - [x] B.8.7.1 Colour-code map pins by directory (use directory.colour field)
  - [x] B.8.7.2 Update legend to show directories with their colours
  - [x] B.8.7.3 Replace activity feed sidebar with "Recent activity" + "Needs action" panels
  - [x] B.8.7.4 Add "Needs action" panel showing properties missing activities
  - [x] B.8.7.5 Add directory filter to map (show/hide directories)
- [x] B.8.8 Update routing (`src/main.tsx`)
  - [x] B.8.8.1 Add `/app/directories` route → DirectoryList
  - [x] B.8.8.2 Add `/app/directories/:id` route → DirectoryDetail
  - [x] B.8.8.3 Add `/app/directories/:dirId/properties/:propId` route → PropertyDetail
  - [x] B.8.8.4 Keep `/app/properties/:id` as a direct-link fallback
  - [x] B.8.8.5 Keep `/app/snaps/:id`, `/app/inspections/:id`, etc. as direct-link routes
  - [x] B.8.8.6 Remove `/app/snaps`, `/app/inspections`, `/app/appraisals`, `/app/monitor` list routes from primary nav (keep routes working for backward compat)
  - [x] B.8.8.7 Redirect `/app` to Dashboard
- [x] B.8.9 Cleanup & polish
  - [x] B.8.9.1 Archive old activity list pages (SnapList, InspectionList, etc.) — keep code but remove from nav
  - [x] B.8.9.2 Update all breadcrumbs to use directory > property > activity hierarchy
  - [x] B.8.9.3 Update all "back" buttons to navigate to parent in hierarchy
  - [x] B.8.9.4 Add empty states for new directories (no properties yet) and new properties (no activities yet)
  - [x] B.8.9.5 Test full navigation flow: Dashboard → Directory → Property → Activity → Back
  - [x] B.8.9.6 Test mobile navigation with new sidebar/bottom nav

## B.9 Supabase Database Changes

### B.9.1 Current Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT SUPABASE SCHEMA                       │
│                    (5 flat activity tables)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ snaps                                                    │   │
│  │ ─────                                                    │   │
│  │ id (uuid PK)                                             │   │
│  │ user_id (uuid FK → auth.users)                           │   │
│  │ address (text)           ← grouping key (ilike match)    │   │
│  │ suburb (text)                                            │   │
│  │ latitude (float8)                                        │   │
│  │ longitude (float8)                                       │   │
│  │ propid (int8, nullable)  ← external NSW property ID      │   │
│  │ photo_url (text)                                         │   │
│  │ ai_analysis (jsonb)                                      │   │
│  │ confidence (float8)                                      │   │
│  │ is_favourite (bool)                                      │   │
│  │ created_at (timestamptz)                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ inspections                                              │   │
│  │ ───────────                                              │   │
│  │ id (uuid PK)                                             │   │
│  │ user_id, address, suburb, latitude, longitude, propid    │   │
│  │ photos (jsonb[])          ← per-photo analysis embedded  │   │
│  │ photo_count (int4)                                       │   │
│  │ overall_score (float8)                                   │   │
│  │ report (jsonb)            ← aggregated inspection report │   │
│  │ notes (text)                                             │   │
│  │ is_favourite, created_at, updated_at                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ appraisals                                               │   │
│  │ ──────────                                               │   │
│  │ id (uuid PK)                                             │   │
│  │ user_id, address, suburb, latitude, longitude, propid    │   │
│  │ area_sqm (float8)                                        │   │
│  │ zone_code (text)                                         │   │
│  │ scored_comps (jsonb[])    ← comparable sales with scores │   │
│  │ price_estimate (jsonb)    ← value, range, confidence     │   │
│  │ notes (text)                                             │   │
│  │ is_favourite, created_at, updated_at                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ watched_properties                                       │   │
│  │ ───────────────────                                      │   │
│  │ id (uuid PK)                                             │   │
│  │ user_id, address, suburb, latitude, longitude, propid    │   │
│  │ baseline_photo_url (text)                                │   │
│  │ latest_photo_url (text)                                  │   │
│  │ changes (jsonb)           ← detected differences         │   │
│  │ alerts (jsonb)            ← severity-tagged alerts       │   │
│  │ visit_count (int4)                                       │   │
│  │ is_favourite, created_at, last_visited_at                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ walk_sessions                                            │   │
│  │ ─────────────                                            │   │
│  │ id (uuid PK)                                             │   │
│  │ user_id (uuid FK)                                        │   │
│  │ title (text)                                             │   │
│  │ suburb (text)             ← NO address field             │   │
│  │ route (jsonb)             ← GeoJSON LineString           │   │
│  │ photos (jsonb[])                                         │   │
│  │ segments (jsonb[])                                       │   │
│  │ total_distance_metres (float8)                           │   │
│  │ duration_seconds (int4)                                  │   │
│  │ street_score (jsonb)      ← walkability/safety/etc.      │   │
│  │ analysis_narrative (text)                                │   │
│  │ started_at, ended_at (timestamptz)                       │   │
│  │ is_favourite (bool)                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ properties_grouped (VIEW — read-only aggregation)        │   │
│  │ ──────────────────                                       │   │
│  │ normalised_address (text) ← derived grouping key         │   │
│  │ address, suburb, latitude, longitude, propid             │   │
│  │ snap_count, inspection_count, appraisal_count,           │   │
│  │ monitor_count, total_records                             │   │
│  │ last_activity_at, thumbnail_url                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  No directories table.                                          │
│  No properties table (only a derived view).                     │
│  No FK relationships between activities.                        │
│  Grouping is address-string ilike matching only.                │
└─────────────────────────────────────────────────────────────────┘
```

### B.9.2 Target Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET SUPABASE SCHEMA                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ directories (NEW)                                        │   │
│  │ ───────────                                              │   │
│  │ id (uuid PK, default gen_random_uuid())                  │   │
│  │ user_id (uuid FK → auth.users, NOT NULL)                 │   │
│  │ name (text NOT NULL)                                     │   │
│  │ description (text)                                       │   │
│  │ colour (text)             ← hex colour for map pins      │   │
│  │ icon (text)               ← emoji or icon identifier     │   │
│  │ is_archived (bool DEFAULT false)                         │   │
│  │ created_at (timestamptz DEFAULT now())                   │   │
│  │ updated_at (timestamptz DEFAULT now())                   │   │
│  │                                                          │   │
│  │ RLS: user_id = auth.uid()                                │   │
│  │ INDEX: user_id, is_archived                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          │ 1:many                               │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ properties (NEW — replaces properties_grouped view)      │   │
│  │ ──────────                                               │   │
│  │ id (uuid PK, default gen_random_uuid())                  │   │
│  │ directory_id (uuid FK → directories.id, NOT NULL)        │   │
│  │ user_id (uuid FK → auth.users, NOT NULL)                 │   │
│  │ address (text NOT NULL)                                  │   │
│  │ normalised_address (text NOT NULL)  ← lower(trim(addr))  │   │
│  │ suburb (text)                                            │   │
│  │ latitude (float8)                                        │   │
│  │ longitude (float8)                                       │   │
│  │ propid (int8)             ← external NSW property ID      │   │
│  │ status (text DEFAULT 'active')  ← active/under_offer/    │   │
│  │                                    settled/archived       │   │
│  │ notes (text)              ← free-form user notes          │   │
│  │ created_at (timestamptz DEFAULT now())                   │   │
│  │ updated_at (timestamptz DEFAULT now())                   │   │
│  │                                                          │   │
│  │ RLS: user_id = auth.uid()                                │   │
│  │ UNIQUE: (directory_id, normalised_address)               │   │
│  │ INDEX: directory_id, user_id, normalised_address         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          │ 1:many (via property_id FK)          │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ snaps (MODIFIED)                                         │   │
│  │ ─────                                                    │   │
│  │ + property_id (uuid FK → properties.id, NULLABLE*)       │   │
│  │                                                          │   │
│  │ All existing columns preserved.                          │   │
│  │ address/suburb/lat/lng kept for display + backward compat│   │
│  │ * NULLABLE during migration, NOT NULL after backfill     │   │
│  │                                                          │   │
│  │ INDEX: property_id                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ inspections (MODIFIED)                                   │   │
│  │ ───────────                                              │   │
│  │ + property_id (uuid FK → properties.id, NULLABLE*)       │   │
│  │ All existing columns preserved.                          │   │
│  │ INDEX: property_id                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ appraisals (MODIFIED)                                    │   │
│  │ ──────────                                               │   │
│  │ + property_id (uuid FK → properties.id, NULLABLE*)       │   │
│  │ All existing columns preserved.                          │   │
│  │ INDEX: property_id                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ watched_properties (MODIFIED)                            │   │
│  │ ───────────────────                                      │   │
│  │ + property_id (uuid FK → properties.id, NULLABLE*)       │   │
│  │ All existing columns preserved.                          │   │
│  │ INDEX: property_id                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ walk_sessions (MODIFIED)                                 │   │
│  │ ─────────────                                            │   │
│  │ + directory_id (uuid FK → directories.id, NULLABLE*)     │   │
│  │ + property_id (uuid FK → properties.id, NULLABLE)        │   │
│  │                                                          │   │
│  │ directory_id: which directory this walk belongs to        │   │
│  │ property_id: optionally link to a specific property      │   │
│  │ (walks can be area-based, not always property-specific)  │   │
│  │                                                          │   │
│  │ All existing columns preserved.                          │   │
│  │ INDEX: directory_id, property_id                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ properties_summary (NEW VIEW — replaces properties_grouped) │
│  │ ──────────────────                                       │   │
│  │ SELECT                                                   │   │
│  │   p.id, p.directory_id, p.address, p.suburb,             │   │
│  │   p.latitude, p.longitude, p.status, p.notes,            │   │
│  │   d.name AS directory_name, d.colour AS directory_colour, │   │
│  │   COUNT(DISTINCT s.id) AS snap_count,                    │   │
│  │   COUNT(DISTINCT i.id) AS inspection_count,              │   │
│  │   COUNT(DISTINCT a.id) AS appraisal_count,               │   │
│  │   COUNT(DISTINCT w.id) AS monitor_count,                 │   │
│  │   GREATEST(MAX(s.created_at), MAX(i.created_at),         │   │
│  │     MAX(a.created_at), MAX(w.created_at))                │   │
│  │     AS last_activity_at,                                 │   │
│  │   (SELECT photo_url FROM snaps                           │   │
│  │    WHERE property_id = p.id                              │   │
│  │    ORDER BY created_at DESC LIMIT 1) AS thumbnail_url    │   │
│  │ FROM properties p                                        │   │
│  │ JOIN directories d ON d.id = p.directory_id              │   │
│  │ LEFT JOIN snaps s ON s.property_id = p.id                │   │
│  │ LEFT JOIN inspections i ON i.property_id = p.id          │   │
│  │ LEFT JOIN appraisals a ON a.property_id = p.id           │   │
│  │ LEFT JOIN watched_properties w ON w.property_id = p.id   │   │
│  │ GROUP BY p.id, d.name, d.colour                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### B.9.3 Migration SQL (Phased)

```sql
-- PHASE 1: Create new tables (non-breaking, additive only)

CREATE TABLE directories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  colour text,
  icon text,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_id uuid NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  address text NOT NULL,
  normalised_address text NOT NULL,
  suburb text,
  latitude float8,
  longitude float8,
  propid int8,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (directory_id, normalised_address)
);

-- PHASE 2: Add FK columns to activity tables (nullable, non-breaking)

ALTER TABLE snaps ADD COLUMN property_id uuid REFERENCES properties(id);
ALTER TABLE inspections ADD COLUMN property_id uuid REFERENCES properties(id);
ALTER TABLE appraisals ADD COLUMN property_id uuid REFERENCES properties(id);
ALTER TABLE watched_properties ADD COLUMN property_id uuid REFERENCES properties(id);
ALTER TABLE walk_sessions ADD COLUMN directory_id uuid REFERENCES directories(id);
ALTER TABLE walk_sessions ADD COLUMN property_id uuid REFERENCES properties(id);

CREATE INDEX idx_snaps_property ON snaps(property_id);
CREATE INDEX idx_inspections_property ON inspections(property_id);
CREATE INDEX idx_appraisals_property ON appraisals(property_id);
CREATE INDEX idx_watched_property ON watched_properties(property_id);
CREATE INDEX idx_walks_directory ON walk_sessions(directory_id);
CREATE INDEX idx_walks_property ON walk_sessions(property_id);

-- PHASE 3: Backfill data (run as migration script)
-- Creates a default "My Properties" directory per user,
-- then creates property records from existing address groupings,
-- then links activity records to their property.

-- Step 3a: Create default directory per user
INSERT INTO directories (user_id, name, description)
SELECT DISTINCT user_id, 'My Properties', 'Auto-created from existing records'
FROM snaps
UNION
SELECT DISTINCT user_id, 'My Properties', 'Auto-created from existing records'
FROM inspections
-- ...union all activity tables for distinct user_ids
ON CONFLICT DO NOTHING;

-- Step 3b: Create property records from existing groupings
-- (use a function or script to deduplicate by normalised address)

-- Step 3c: Update activity records with property_id
-- (match by user_id + normalised address)

-- PHASE 4: RLS policies

ALTER TABLE directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY directories_user_policy ON directories
  USING (user_id = auth.uid());

CREATE POLICY properties_user_policy ON properties
  USING (user_id = auth.uid());

-- PHASE 5: Replace properties_grouped view

DROP VIEW IF EXISTS properties_grouped;
CREATE VIEW properties_summary AS
  -- (see target schema above for full query)
  ...;
```

### B.9.4 Supabase Action Items

- [x] B.9.4.1 Create `directories` table
  - [x] B.9.4.1.1 Define schema as per B.9.2
  - [x] B.9.4.1.2 Add RLS policy: `user_id = auth.uid()`
  - [x] B.9.4.1.3 Add index on `(user_id, is_archived)`
  - [x] B.9.4.1.4 Add `updated_at` trigger function
- [x] B.9.4.2 Create `properties` table
  - [x] B.9.4.2.1 Define schema as per B.9.2
  - [x] B.9.4.2.2 Add FK constraint to `directories(id)` with `ON DELETE CASCADE`
  - [x] B.9.4.2.3 Add RLS policy: `user_id = auth.uid()`
  - [x] B.9.4.2.4 Add unique constraint on `(directory_id, normalised_address)`
  - [x] B.9.4.2.5 Add indexes on `directory_id`, `user_id`, `normalised_address`
  - [x] B.9.4.2.6 Add `updated_at` trigger function
  - [x] B.9.4.2.7 Add computed `normalised_address` trigger (lower + trim on insert/update)
- [x] B.9.4.3 Add `property_id` FK to activity tables
  - [x] B.9.4.3.1 `ALTER TABLE snaps ADD COLUMN property_id uuid REFERENCES properties(id)`
  - [x] B.9.4.3.2 `ALTER TABLE inspections ADD COLUMN property_id uuid REFERENCES properties(id)`
  - [x] B.9.4.3.3 `ALTER TABLE appraisals ADD COLUMN property_id uuid REFERENCES properties(id)`
  - [x] B.9.4.3.4 `ALTER TABLE watched_properties ADD COLUMN property_id uuid REFERENCES properties(id)`
  - [x] B.9.4.3.5 `ALTER TABLE walk_sessions ADD COLUMN directory_id uuid REFERENCES directories(id)`
  - [x] B.9.4.3.6 `ALTER TABLE walk_sessions ADD COLUMN property_id uuid REFERENCES properties(id)`
  - [x] B.9.4.3.7 Create indexes on all new FK columns
- [x] B.9.4.4 Write backfill migration script
  - [x] B.9.4.4.1 Create default "My Properties" directory for each existing user
  - [x] B.9.4.4.2 Generate property records from distinct `(user_id, lower(trim(address)))` across all activity tables
  - [x] B.9.4.4.3 Backfill `property_id` on `snaps` by matching `user_id` + normalised address
  - [x] B.9.4.4.4 Backfill `property_id` on `inspections` by matching
  - [x] B.9.4.4.5 Backfill `property_id` on `appraisals` by matching
  - [x] B.9.4.4.6 Backfill `property_id` on `watched_properties` by matching
  - [x] B.9.4.4.7 Backfill `directory_id` on `walk_sessions` (assign to default directory)
  - [x] B.9.4.4.8 Verify all activity records have `property_id` set
  - [x] B.9.4.4.9 Verify row counts match before and after migration
- [x] B.9.4.5 Create `properties_summary` view
  - [x] B.9.4.5.1 Write view query joining properties + directories + activity counts
  - [x] B.9.4.5.2 Include `directory_name`, `directory_colour` in output
  - [x] B.9.4.5.3 Include `last_activity_at` and `thumbnail_url`
  - [x] B.9.4.5.4 Drop old `properties_grouped` view (after web app updated)
- [x] B.9.4.6 Create `directory_summary` view
  - [x] B.9.4.6.1 Write view query: directory fields + property count + total activity counts + last_activity_at
  - [x] B.9.4.6.2 Include completeness metrics (properties with/without each activity type)
- [x] B.9.4.7 Test RLS policies
  - [x] B.9.4.7.1 Verify user A cannot see user B's directories
  - [x] B.9.4.7.2 Verify user A cannot see user B's properties
  - [x] B.9.4.7.3 Verify cascade delete: deleting directory deletes its properties
  - [x] B.9.4.7.4 Verify activity records remain if property deleted (nullable FK)

---

## B.10 iOS App Changes (`groundtruth/`)

### B.10.1 Current iOS Architecture

```
groundtruth/
├── app/
│   ├── (tabs)/                          ← Tab-based navigation
│   │   ├── index.tsx                    ← Home/Dashboard tab
│   │   ├── snap.tsx                     ← Snap capture tab
│   │   ├── inspect.tsx                  ← Inspection capture tab
│   │   ├── appraise.tsx                 ← Appraisal tab
│   │   ├── monitor.tsx                  ← Monitor tab
│   │   └── explore.tsx                  ← Walk/Explore tab
│   ├── snap/[id].tsx                    ← Snap detail
│   ├── inspection/[id].tsx              ← Inspection detail
│   ├── appraisal/[id].tsx              ← Appraisal detail
│   ├── watched/[id].tsx                 ← Monitor detail
│   └── walk/[id].tsx                    ← Walk detail
│
├── services/
│   ├── persistence/
│   │   ├── genericStorage.ts            ← AsyncStorage CRUD factory
│   │   ├── snapStorage.ts              ← @groundtruth_snaps
│   │   ├── inspectionStorage.ts        ← @groundtruth_inspections
│   │   ├── appraisalStorage.ts         ← @groundtruth_appraisals
│   │   ├── watchedStorage.ts           ← @groundtruth_watched
│   │   └── walkStorage.ts             ← @groundtruth_walks
│   │
│   ├── sync/
│   │   └── supabaseSync.ts             ← Fire-and-forget sync to Supabase
│   │
│   ├── analysis/                        ← AI analysis via Edge Functions
│   └── location/                        ← Geocoding, reverse geocoding
│
├── components/                          ← Shared UI components
└── types/                               ← TypeScript interfaces
```

**Key characteristics:**
- **Expo Router** with file-based routing
- **5 activity tabs** — each is an independent capture flow
- **AsyncStorage** per activity type — no local DB (no SQLite/CoreData)
- **Fire-and-forget sync** — each activity syncs independently to its Supabase table
- **No concept of directories or properties** — each activity self-contains its address data
- **Address captured per activity** — user searches/geocodes for every snap, inspection, etc.

### B.10.2 iOS Changes Required

```
CURRENT iOS TAB BAR                  PROPOSED iOS TAB BAR
════════════════════                 ════════════════════

  ● Home                               ● Home (Dashboard)
  ● Snap                               ● Directories
  ● Inspect                            ● Capture (+)
  ● Appraise                           ● Walks
  ● Monitor                            ● Profile
  ● Explore (Walk)

  (6 tabs — cramped on iPhone)          (5 tabs — cleaner)
```

**Proposed Navigation Flow:**

```
┌──────────────┐
│ Home tab     │
│ (dashboard)  │
│              │
│ Recent       │
│ activity     │
│ feed         │
│              │
│ Needs        │
│ attention    │
│ alerts       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Directories  │
│ tab          │
│              │
│ 📁 Inner W.  │──► ┌─────────────────────┐
│ 📁 Client J. │    │ Directory Detail     │
│ 📁 Q1 Insp.  │    │                     │
│              │    │ 42 Smith St     ──► Property Detail
│ [+ New]      │    │ 15 Jones Ave    ──► Property Detail
│              │    │ 8 Park Rd       ──► Property Detail
└──────────────┘    │                     │
                    │ [+ Add property]    │
                    └─────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │ Property Detail     │
                    │ (the hub)           │
                    │                     │
                    │ Overview            │
                    │ • Completeness      │
                    │ • Quick stats       │
                    │ • Timeline          │
                    │                     │
                    │ Actions:            │
                    │ [📷 Snap]           │──► Camera → AI → Save to property
                    │ [🔍 Inspect]        │──► Multi-photo → AI → Save
                    │ [💰 Appraise]       │──► Comp search → AI → Save
                    │ [👁 Monitor]        │──► Before/after → AI → Save
                    │                     │
                    │ Past activities:    │
                    │ • 3 snaps           │──► Snap detail
                    │ • 1 inspection      │──► Inspection detail
                    │ • 1 appraisal       │──► Appraisal detail
                    └─────────────────────┘

┌──────────────┐
│ Capture tab  │
│ (+)          │
│              │
│ Quick-add    │
│ action sheet:│
│              │
│ 📷 Snap      │──► Select directory → Select/create property → Camera
│ 🔍 Inspect   │──► Select directory → Select/create property → Camera
│ 💰 Appraise  │──► Select directory → Select/create property → Setup
│ 👁 Monitor   │──► Select directory → Select/create property → Camera
│              │
│ OR from      │
│ property hub │
│ (pre-filled) │
└──────────────┘

┌──────────────┐
│ Walks tab    │
│              │
│ Start walk   │──► Select directory (optional) → GPS recording
│              │
│ Past walks:  │
│ • Walk 1     │──► Walk detail
│ • Walk 2     │
└──────────────┘
```

### B.10.3 iOS Action Items

- [x] B.10.3.1 New types (`types/`)
  - [x] B.10.3.1.1 Add `Directory` interface (id, userId, name, description, colour, icon, isArchived, createdAt, updatedAt)
  - [x] B.10.3.1.2 Add `Property` interface (id, directoryId, userId, address, normalisedAddress, suburb, lat, lng, propid, status, notes, createdAt, updatedAt)
  - [x] B.10.3.1.3 Add `PropertyStatus` type ("active" | "under_offer" | "settled" | "archived")
  - [x] B.10.3.1.4 Update `SavedSnapRecord` — add `propertyId` field
  - [x] B.10.3.1.5 Update `InspectionRecord` — add `propertyId` field
  - [x] B.10.3.1.6 Update `AppraisalRecord` — add `propertyId` field
  - [x] B.10.3.1.7 Update `WatchedProperty` — add `propertyId` field
  - [x] B.10.3.1.8 Update `WalkSession` — add `directoryId` and optional `propertyId` fields
- [x] B.10.3.2 New persistence services (`services/persistence/`)
  - [x] B.10.3.2.1 Create `directoryStorage.ts` using `genericStorage` factory — key: `@groundtruth_directories`
  - [x] B.10.3.2.2 Create `propertyStorage.ts` using `genericStorage` factory — key: `@groundtruth_properties`
  - [x] B.10.3.2.3 Add `listByDirectory(directoryId)` method to `propertyStorage`
  - [x] B.10.3.2.4 Add `getByAddress(normalisedAddress, directoryId)` method for dedup checking
  - [x] B.10.3.2.5 Update `snapStorage` to support filtering by `propertyId`
  - [x] B.10.3.2.6 Update `inspectionStorage` to support filtering by `propertyId`
  - [x] B.10.3.2.7 Update `appraisalStorage` to support filtering by `propertyId`
  - [x] B.10.3.2.8 Update `watchedStorage` to support filtering by `propertyId`
  - [x] B.10.3.2.9 Update `walkStorage` to support filtering by `directoryId` and optional `propertyId`
- [x] B.10.3.3 New sync functions (`services/sync/supabaseSync.ts`)
  - [x] B.10.3.3.1 Add `syncDirectory()` — upsert to `directories` table
  - [x] B.10.3.3.2 Add `syncProperty()` — upsert to `properties` table
  - [x] B.10.3.3.3 Update `syncSnap()` — include `property_id` in upsert payload
  - [x] B.10.3.3.4 Update `syncInspection()` — include `property_id` in upsert payload
  - [x] B.10.3.3.5 Update `syncAppraisal()` — include `property_id` in upsert payload
  - [x] B.10.3.3.6 Update `syncWatchedProperty()` — include `property_id` in upsert payload
  - [x] B.10.3.3.7 Update `syncWalkSession()` — include `directory_id` and optional `property_id`
  - [x] B.10.3.3.8 Ensure directory + property sync before activity sync (parent before child)
- [x] B.10.3.4 Refactor address capture flow
  - [x] B.10.3.4.1 Extract shared `PropertyPicker` component — select directory → select/create property
  - [x] B.10.3.4.2 `PropertyPicker` reuses address search + geocoding from existing flow
  - [x] B.10.3.4.3 `PropertyPicker` checks for existing property at same address within directory
  - [x] B.10.3.4.4 `PropertyPicker` auto-creates property record if new address
  - [x] B.10.3.4.5 `PropertyPicker` returns `propertyId` to caller
  - [x] B.10.3.4.6 Update Snap capture flow — use `PropertyPicker` instead of inline address search
  - [x] B.10.3.4.7 Update Inspection capture flow — use `PropertyPicker`
  - [x] B.10.3.4.8 Update Appraisal capture flow — use `PropertyPicker`
  - [x] B.10.3.4.9 Update Monitor capture flow — use `PropertyPicker`
  - [x] B.10.3.4.10 Walk capture — optionally link to directory via `PropertyPicker` (not required)
- [x] B.10.3.5 New screens
  - [x] B.10.3.5.1 Create `app/(tabs)/directories.tsx` — directory list with counts and progress
  - [x] B.10.3.5.2 Create `app/directory/[id].tsx` — directory detail with property list
  - [x] B.10.3.5.3 Create `app/directory/create.tsx` — create directory form (name, description, colour)
  - [x] B.10.3.5.4 Create `app/property/[id].tsx` — property hub with overview + activity tabs
  - [x] B.10.3.5.5 Create `app/property/add.tsx` — add property to directory (address search + map)
  - [x] B.10.3.5.6 Update `app/(tabs)/index.tsx` (Home) — show recent activity across all directories + needs-action alerts
- [x] B.10.3.6 Restructure tab bar
  - [x] B.10.3.6.1 Replace 6 activity tabs with 5 tabs: Home, Directories, Capture (+), Walks, Profile
  - [x] B.10.3.6.2 "Capture" tab opens action sheet: Snap, Inspect, Appraise, Monitor
  - [x] B.10.3.6.3 Each capture action flows through `PropertyPicker` first
  - [x] B.10.3.6.4 If launched from property hub, `PropertyPicker` is pre-filled (skip selection)
  - [x] B.10.3.6.5 Update `app/(tabs)/_layout.tsx` with new tab configuration
  - [x] B.10.3.6.6 Keep existing detail screens (`snap/[id]`, `inspection/[id]`, etc.) unchanged
- [x] B.10.3.7 Local data migration
  - [x] B.10.3.7.1 Write migration function that runs on app startup (once)
  - [x] B.10.3.7.2 Create default "My Properties" directory from existing local data
  - [x] B.10.3.7.3 Generate property records from distinct addresses across all local activity stores
  - [x] B.10.3.7.4 Backfill `propertyId` on all existing local activity records
  - [x] B.10.3.7.5 Set migration flag in AsyncStorage to prevent re-running
  - [x] B.10.3.7.6 Handle edge case: user has no existing data (new install)
  - [x] B.10.3.7.7 Handle edge case: same address with different casing/whitespace
- [x] B.10.3.8 Property hub screen design
  - [x] B.10.3.8.1 Overview section: completeness tracker (which activity types exist)
  - [x] B.10.3.8.2 Quick stats: estimated value (from appraisal), condition (from inspection), walk score
  - [x] B.10.3.8.3 Activity timeline: chronological list of all activities at this property
  - [x] B.10.3.8.4 Action buttons: [📷 Snap] [🔍 Inspect] [💰 Appraise] [👁 Monitor] — launch capture pre-filled
  - [x] B.10.3.8.5 Past activities list: grouped by type, each linking to existing detail screens
  - [x] B.10.3.8.6 Property header: photo, address, status badge, notes (editable)
- [x] B.10.3.9 Backward compatibility
  - [x] B.10.3.9.1 Existing activity records without `propertyId` still display correctly
  - [x] B.10.3.9.2 Existing sync functions continue to work with Supabase (nullable FK)
  - [x] B.10.3.9.3 Old AsyncStorage keys preserved alongside new ones during transition
  - [x] B.10.3.9.4 App gracefully handles mixed state (some records migrated, some not)

---

## B.11 Cross-Platform Implementation Order

The directory-first architecture spans Supabase, iOS, and Web. Here's the recommended order:

```
WEEK 1-2: Supabase (foundation)
├── B.9.4.1 Create directories table
├── B.9.4.2 Create properties table
├── B.9.4.3 Add property_id FK to activity tables
├── B.9.4.4 Run backfill migration
├── B.9.4.5 Create properties_summary view
└── B.9.4.7 Test RLS policies

WEEK 2-3: iOS app (capture side)
├── B.10.3.1 New types
├── B.10.3.2 New persistence services
├── B.10.3.3 Updated sync functions
├── B.10.3.4 PropertyPicker component
├── B.10.3.7 Local data migration
└── B.10.3.9 Backward compatibility testing

WEEK 3-4: iOS app (navigation)
├── B.10.3.5 New screens (directory list, directory detail, property hub)
├── B.10.3.6 Restructure tab bar
└── B.10.3.8 Property hub screen design

WEEK 4-5: Web app (frontend)
├── B.8.2 TypeScript types
├── B.8.3 API layer
├── B.8.4 New pages (DirectoryList, DirectoryDetail)
├── B.8.5 Redesign PropertyDetail
├── B.8.6 Redesign navigation
└── B.8.7 Redesign Dashboard

WEEK 5-6: Polish & cleanup
├── B.8.8 Update routing
├── B.8.9 Cleanup old pages
├── B.9.4.5 Drop old properties_grouped view
└── End-to-end testing across platforms
```

---

# Part C — Action Plan (Original)

The following items from the original review remain valid and should be implemented alongside or after the directory redesign.

---

## Phase 1 — Critical UX Fixes

### 1.1 Error States on Detail Pages

Replace silent failures with meaningful error UI (distinguish "not found" from "fetch failed").

- [x] 1.1.1 Create a shared `ErrorMessage` component in `src/components/shared/`
  - [x] 1.1.1.1 Create `ErrorMessage.tsx` with props: `message`, `onRetry`, `type` (`notFound` | `error`)
  - [x] 1.1.1.2 Create `ErrorMessage.module.css` with styling consistent with design tokens
  - [x] 1.1.1.3 Include a retry button that re-triggers the fetch
  - [x] 1.1.1.4 Show different icons/copy for "not found" vs "network error"
- [x] 1.1.2 Add error state to `SnapDetail.tsx`
  - [x] 1.1.2.1 Add `error` state variable alongside existing `loading` state
  - [x] 1.1.2.2 Wrap `getSnap()` call in try/catch, set error message on failure
  - [x] 1.1.2.3 Render `ErrorMessage` component when error is set
  - [x] 1.1.2.4 Keep "Snap not found" for when fetch succeeds but returns null
- [x] 1.1.3 Add error state to `InspectionDetail.tsx`
  - [x] 1.1.3.1 Add `error` state variable
  - [x] 1.1.3.2 Wrap `getInspection()` call in try/catch
  - [x] 1.1.3.3 Render `ErrorMessage` component when error is set
  - [x] 1.1.3.4 Keep "Inspection not found" for null result
- [x] 1.1.4 Add error state to `AppraisalDetail.tsx`
  - [x] 1.1.4.1 Add `error` state variable
  - [x] 1.1.4.2 Wrap `getAppraisal()` call in try/catch
  - [x] 1.1.4.3 Render `ErrorMessage` component when error is set
  - [x] 1.1.4.4 Keep "Appraisal not found" for null result
- [x] 1.1.5 Add error state to `MonitorDetail.tsx`
  - [x] 1.1.5.1 Add `error` state variable
  - [x] 1.1.5.2 Wrap `getWatched()` call in try/catch
  - [x] 1.1.5.3 Render `ErrorMessage` component when error is set
  - [x] 1.1.5.4 Keep "Watched property not found" for null result
- [x] 1.1.6 Add error state to `WalkDetail.tsx`
  - [x] 1.1.6.1 Add `error` state variable
  - [x] 1.1.6.2 Wrap `getWalk()` call in try/catch
  - [x] 1.1.6.3 Render `ErrorMessage` component when error is set
  - [x] 1.1.6.4 Keep "Walk not found" for null result
- [x] 1.1.7 Add error state to `PropertyDetail.tsx`
  - [x] 1.1.7.1 Add `error` state variable
  - [x] 1.1.7.2 Wrap `getProperty()` call in try/catch
  - [x] 1.1.7.3 Render `ErrorMessage` component when error is set
  - [x] 1.1.7.4 Keep "Property not found" for null result
- [x] 1.1.8 Add error handling to `Dashboard.tsx` spatial layer fetches
  - [x] 1.1.8.1 Replace empty `catch {}` blocks with error state
  - [x] 1.1.8.2 Show subtle toast/banner when layer fetch fails (non-blocking)
  - [x] 1.1.8.3 Allow user to retry failed layer fetches

### 1.2 EditableText Visual Affordance

Users cannot tell which fields are editable. Add clear visual indicators.

- [x] 1.2.1 Update `EditableText.tsx`
  - [x] 1.2.1.1 Add a pencil/edit icon that appears on hover (use inline SVG, not a library)
  - [x] 1.2.1.2 Add subtle bottom border or underline on hover to indicate editability
  - [x] 1.2.1.3 Change cursor to `text` on hover over editable content
  - [x] 1.2.1.4 Add a brief tooltip or `title` attribute: "Click to edit"
- [x] 1.2.2 Update `EditableText.module.css`
  - [x] 1.2.2.1 Add `.editable:hover` styles (border, background tint, icon visibility)
  - [x] 1.2.2.2 Add `.editIcon` styles (positioned, semi-transparent, visible on hover)
  - [x] 1.2.2.3 Add focus ring styles when field enters edit mode
  - [x] 1.2.2.4 Ensure styles work in both dark (nav) and light (content) contexts

### 1.3 Breadcrumbs on Detail Pages

Detail pages lack parent context. Users don't know which property a snap/inspection belongs to.

- [x] 1.3.1 Create a shared `Breadcrumb` component in `src/components/shared/`
  - [x] 1.3.1.1 Create `Breadcrumb.tsx` accepting an array of `{ label, path }` segments
  - [x] 1.3.1.2 Create `Breadcrumb.module.css` with compact styling, separator arrows
  - [x] 1.3.1.3 Final segment rendered as plain text (current page), earlier segments as links
  - [x] 1.3.1.4 Truncate long addresses with ellipsis, full text on hover
- [x] 1.3.2 Add breadcrumbs to `SnapDetail.tsx`
  - [x] 1.3.2.1 Show: Dashboard > Properties > {address} > Snaps > {snap title}
  - [x] 1.3.2.2 Use snap's `address` field to link to parent property
- [x] 1.3.3 Add breadcrumbs to `InspectionDetail.tsx`
  - [x] 1.3.3.1 Show: Dashboard > Properties > {address} > Inspections > {inspection title}
  - [x] 1.3.3.2 Use inspection's `address` field to link to parent property
- [x] 1.3.4 Add breadcrumbs to `AppraisalDetail.tsx`
  - [x] 1.3.4.1 Show: Dashboard > Properties > {address} > Appraisals > {appraisal title}
  - [x] 1.3.4.2 Use appraisal's `address` field to link to parent property
- [x] 1.3.5 Add breadcrumbs to `MonitorDetail.tsx`
  - [x] 1.3.5.1 Show: Dashboard > Properties > {address} > Monitor > {monitor title}
  - [x] 1.3.5.2 Use watched property's `address` field to link to parent property
- [x] 1.3.6 Add breadcrumbs to `WalkDetail.tsx`
  - [x] 1.3.6.1 Show: Dashboard > Walks > {walk title}
  - [x] 1.3.6.2 Walks may not have a single parent property — link to walks list only
- [x] 1.3.7 Add breadcrumbs to `PropertyDetail.tsx`
  - [x] 1.3.7.1 Show: Dashboard > Properties > {address}
  - [x] 1.3.7.2 Link activity items (snaps, inspections, etc.) to their detail pages

### 1.4 Safe Delete Pattern

Delete button is adjacent to back button — high accidental-click risk. Replace `window.confirm()` with styled modal.

- [x] 1.4.1 Create a shared `ConfirmModal` component in `src/components/shared/`
  - [x] 1.4.1.1 Create `ConfirmModal.tsx` with props: `title`, `message`, `onConfirm`, `onCancel`, `confirmLabel`, `variant` (`danger` | `default`)
  - [x] 1.4.1.2 Create `ConfirmModal.module.css` with overlay, centred card, danger-styled confirm button
  - [x] 1.4.1.3 Trap focus within modal when open (accessibility)
  - [x] 1.4.1.4 Close on Escape key press
  - [x] 1.4.1.5 Prevent background scroll when modal is open
- [x] 1.4.2 Move delete button away from back button on all detail pages
  - [x] 1.4.2.1 `SnapDetail.tsx` — move delete to bottom of page or into a "..." overflow menu
  - [x] 1.4.2.2 `InspectionDetail.tsx` — same
  - [x] 1.4.2.3 `AppraisalDetail.tsx` — same
  - [x] 1.4.2.4 `MonitorDetail.tsx` — same
  - [x] 1.4.2.5 `WalkDetail.tsx` — same
- [x] 1.4.3 Replace `window.confirm()` with `ConfirmModal` on all delete actions
  - [x] 1.4.3.1 `SnapDetail.tsx` — use `ConfirmModal` with danger variant
  - [x] 1.4.3.2 `InspectionDetail.tsx` — same
  - [x] 1.4.3.3 `AppraisalDetail.tsx` — same
  - [x] 1.4.3.4 `MonitorDetail.tsx` — same
  - [x] 1.4.3.5 `WalkDetail.tsx` — same

### 1.5 Re-analyse Progress Feedback

Users get insufficient feedback during long-running AI analysis operations.

- [x] 1.5.1 `SnapDetail.tsx` — improve re-analyse UX
  - [x] 1.5.1.1 Show a spinner or progress indicator during analysis
  - [x] 1.5.1.2 Disable the re-analyse button while analysis is in progress
  - [x] 1.5.1.3 Show success/failure feedback when analysis completes
- [x] 1.5.2 `InspectionDetail.tsx` — improve per-photo re-analyse UX
  - [x] 1.5.2.1 Highlight which photo is currently being analysed (border/overlay)
  - [x] 1.5.2.2 Show progress counter: "Analysing photo 3 of 12"
  - [x] 1.5.2.3 Show per-photo success/failure indicator as each completes
  - [x] 1.5.2.4 Disable "Re-analyse all" while any analysis is in progress
- [x] 1.5.3 `WalkDetail.tsx` — improve re-analyse UX
  - [x] 1.5.3.1 Show progress counter: "Analysing photo 3 of 8"
  - [x] 1.5.3.2 Show progress bar alongside the counter
  - [x] 1.5.3.3 Show success/failure feedback when analysis completes

### 1.6 Map Measure Tools Instructions

Users don't know how to use measurement tools (double-click to finish, Escape to cancel).

- [x] 1.6.1 Add instruction tooltip/banner when measure mode is activated
  - [x] 1.6.1.1 Show contextual help text: "Click to add points. Double-click to finish. Press Escape to cancel."
  - [x] 1.6.1.2 Position instruction near the top of the map or below the measure tool buttons
  - [x] 1.6.1.3 Auto-dismiss instruction after first successful measurement
  - [x] 1.6.1.4 Style instruction consistently with existing map controls

---

## Phase 2 — Design System Consolidation

### 2.1 Add Missing CSS Variables

Centralise all design tokens to enable global theme changes from one file.

- [x] 2.1.1 Add colour variables to `src/index.css` `:root`
  - [x] 2.1.1.1 Add `--cream: #FFFDF9`
  - [x] 2.1.1.2 Add `--charcoal: #1C1917`
  - [x] 2.1.1.3 Add `--accent: #D4653B` (alias for terracotta where used as primary accent)
  - [x] 2.1.1.4 Add `--diff-old-bg: rgba(153, 27, 27, 0.08)`
  - [x] 2.1.1.5 Add `--diff-new-bg: rgba(63, 98, 18, 0.08)`
  - [x] 2.1.1.6 Add `--diff-old-text: #991B1B`
  - [x] 2.1.1.7 Add `--diff-new-text: #3F6212`
  - [x] 2.1.1.8 Add `--status-success: #3F6212`
  - [x] 2.1.1.9 Add `--status-error: #991B1B`
- [x] 2.1.2 Add shadow variables to `src/index.css` `:root`
  - [x] 2.1.2.1 Add `--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04)`
  - [x] 2.1.2.2 Add `--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08)`
  - [x] 2.1.2.3 Add `--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12)`
- [x] 2.1.3 Add spacing variables to `src/index.css` `:root`
  - [x] 2.1.3.1 Add `--space-xs: 0.35rem`
  - [x] 2.1.3.2 Add `--space-sm: 0.5rem`
  - [x] 2.1.3.3 Add `--space-md: 0.75rem`
  - [x] 2.1.3.4 Add `--space-lg: 1rem`
  - [x] 2.1.3.5 Add `--space-xl: 1.25rem`
  - [x] 2.1.3.6 Add `--space-2xl: 1.5rem`
  - [x] 2.1.3.7 Add `--space-3xl: 2rem`
- [x] 2.1.4 Add border variables to `src/index.css` `:root`
  - [x] 2.1.4.1 Add `--border-light: 1px solid rgba(0, 0, 0, 0.06)`
  - [x] 2.1.4.2 Add `--border-standard: 1px solid rgba(0, 0, 0, 0.08)`
  - [x] 2.1.4.3 Add `--radius-sm: 8px`
  - [x] 2.1.4.4 Add `--radius-md: 12px`
  - [x] 2.1.4.5 Add `--radius-lg: 16px`

### 2.2 Replace Hardcoded Colours with CSS Variables

Systematically replace all raw hex/rgba values with CSS variable references.

- [x] 2.2.1 `src/App.module.css`
  - [x] 2.2.1.1 Replace all `#fff` / `#ffffff` with `var(--cream)` or appropriate variable
  - [x] 2.2.1.2 Replace all `#D4653B` with `var(--terracotta)` or `var(--accent)`
  - [x] 2.2.1.3 Replace all `#121110` with `var(--bg-primary)` or equivalent
  - [x] 2.2.1.4 Replace all `#e8e2d9` with `var(--text-primary)` or equivalent
  - [x] 2.2.1.5 Replace all `#a39e95` with `var(--text-secondary)` or equivalent
- [x] 2.2.2 `src/components/layout/AppLayout.module.css`
  - [x] 2.2.2.1 Replace `#FFFFFF` with `var(--cream)`
  - [x] 2.2.2.2 Replace `#D4653B` with `var(--terracotta)`
  - [x] 2.2.2.3 Replace any other hardcoded hex values
- [x] 2.2.3 `src/components/layout/AddressSearch.module.css`
  - [x] 2.2.3.1 Replace `#FFFFFF` with `var(--cream)`
  - [x] 2.2.3.2 Replace `#D4653B` with `var(--terracotta)`
- [x] 2.2.4 `src/components/map/LayerControl.module.css`
  - [x] 2.2.4.1 Replace `accent-color: #D4653B` with `accent-color: var(--terracotta)`
  - [x] 2.2.4.2 Replace all other hardcoded colour values
- [x] 2.2.5 `src/pages/Dashboard.module.css`
  - [x] 2.2.5.1 Replace all hardcoded colours with CSS variable equivalents
  - [x] 2.2.5.2 Replace hardcoded shadows with `var(--shadow-sm)` / `var(--shadow-md)`
- [x] 2.2.6 `src/pages/appraisals/AppraisalDetail.module.css`
  - [x] 2.2.6.1 Replace `#FFFDF9` with `var(--cream)`
  - [x] 2.2.6.2 Replace `#1C1917` with `var(--charcoal)`
  - [x] 2.2.6.3 Replace `#D4653B` with `var(--terracotta)`
  - [x] 2.2.6.4 Replace all other hardcoded hex values
- [x] 2.2.7 `src/components/shared/FeatureCard.module.css`
  - [x] 2.2.7.1 Replace `#FFFDF9` with `var(--cream)`
  - [x] 2.2.7.2 Replace `#1C1917` with `var(--charcoal)`
- [x] 2.2.8 `src/components/shared/InlineDiff.module.css`
  - [x] 2.2.8.1 Replace hardcoded rgba diff colours with `var(--diff-old-bg)` / `var(--diff-new-bg)`
  - [x] 2.2.8.2 Replace hardcoded diff text colours with `var(--diff-old-text)` / `var(--diff-new-text)`
- [x] 2.2.9 `src/pages/snaps/SnapDetail.module.css`
  - [x] 2.2.9.1 Replace any hardcoded colour values
- [x] 2.2.10 `src/pages/Login.module.css`
  - [x] 2.2.10.1 Replace any hardcoded colour values
- [x] 2.2.11 `src/components/shared/EditableText.module.css`
  - [x] 2.2.11.1 Verify all values use CSS variables (audit reported this is mostly clean)
- [x] 2.2.12 All remaining CSS module files
  - [x] 2.2.12.1 Search codebase for remaining hardcoded `#` hex values in `.module.css` files
  - [x] 2.2.12.2 Replace each with appropriate CSS variable
  - [x] 2.2.12.3 Verify no regressions visually

### 2.3 Replace Hardcoded Fonts

`App.module.css` hardcodes font families 8+ times instead of using CSS variables.

- [x] 2.3.1 `src/App.module.css`
  - [x] 2.3.1.1 Replace all `font-family: 'DM Serif Display', serif` with `font-family: var(--font-brand)`
  - [x] 2.3.1.2 Replace all `font-family: 'Public Sans', sans-serif` with `font-family: var(--font-body)`
  - [x] 2.3.1.3 Replace all `font-family: 'JetBrains Mono', monospace` with `font-family: var(--font-data)`
- [x] 2.3.2 Audit all other CSS files for hardcoded font families
  - [x] 2.3.2.1 Search for `'DM Serif Display'` across all `.module.css` files
  - [x] 2.3.2.2 Search for `'Public Sans'` across all `.module.css` files
  - [x] 2.3.2.3 Search for `'JetBrains Mono'` across all `.module.css` files
  - [x] 2.3.2.4 Replace all with appropriate CSS variable

### 2.4 Standardise Responsive Breakpoints

Currently 5 different breakpoints used ad hoc. Standardise to 3.

- [x] 2.4.1 Define standard breakpoints (document in `src/index.css` as comments)
  - [x] 2.4.1.1 Small (mobile): `480px`
  - [x] 2.4.1.2 Medium (tablet): `768px`
  - [x] 2.4.1.3 Large (desktop): `1024px`
- [x] 2.4.2 Audit and update `src/App.module.css`
  - [x] 2.4.2.1 Map `640px` breakpoints to `480px` or `768px` as appropriate
  - [x] 2.4.2.2 Map `900px` breakpoints to `768px` or `1024px` as appropriate
  - [x] 2.4.2.3 Map `540px` breakpoints to `480px` as appropriate
  - [x] 2.4.2.4 Test all sections at each standard breakpoint
- [x] 2.4.3 Audit and update `src/components/phone/PhoneFrame.module.css`
  - [x] 2.4.3.1 Consolidate `480px` and `540px` queries
  - [x] 2.4.3.2 Consolidate `768px` and `900px` queries
- [x] 2.4.4 Audit and update `src/components/shared/InlineDiff.module.css`
  - [x] 2.4.4.1 Change `640px` breakpoint to `480px` or `768px`
- [x] 2.4.5 Audit and update `src/pages/snaps/SnapDetail.module.css`
  - [x] 2.4.5.1 Change `640px` breakpoint to `480px` or `768px`
- [x] 2.4.6 Audit all remaining CSS module files
  - [x] 2.4.6.1 Search for `@media` queries with non-standard breakpoints
  - [x] 2.4.6.2 Update each to nearest standard breakpoint
  - [x] 2.4.6.3 Test responsive layouts at 480px, 768px, and 1024px

### 2.5 Replace Hardcoded Shadows

Multiple files repeat identical shadow values.

- [x] 2.5.1 Search all `.module.css` files for `box-shadow` declarations
  - [x] 2.5.1.1 Replace `0 1px 3px rgba(0, 0, 0, 0.04)` with `var(--shadow-sm)`
  - [x] 2.5.1.2 Replace `0 2px 8px rgba(0, 0, 0, 0.08)` with `var(--shadow-md)`
  - [x] 2.5.1.3 Replace any larger shadows with `var(--shadow-lg)`

---

## Phase 3 — Architecture Improvements

### 3.1 Split `Dashboard.tsx` (838 lines)

Extract concerns into hooks and sub-components.

- [x] 3.1.1 Extract map state logic into `src/hooks/useMapState.ts`
  - [x] 3.1.1.1 Move viewport state (zoom, centre, bounds) into hook
  - [x] 3.1.1.2 Move `handleMapMove` debounced handler into hook
  - [x] 3.1.1.3 Move 3D buildings toggle logic into hook
  - [x] 3.1.1.4 Return state + handlers from hook
  - [x] 3.1.1.5 Update `Dashboard.tsx` to consume hook
- [x] 3.1.2 Extract spatial layer logic into `src/hooks/useSpatialLayers.ts`
  - [x] 3.1.2.1 Move DA layer fetch logic into hook
  - [x] 3.1.2.2 Move train station layer fetch logic into hook
  - [x] 3.1.2.3 Move railway line layer fetch logic into hook
  - [x] 3.1.2.4 Move layer visibility state into hook
  - [x] 3.1.2.5 Return layers + visibility + error state from hook
  - [x] 3.1.2.6 Update `Dashboard.tsx` to consume hook
- [x] 3.1.3 Extract sidebar into `src/components/map/MapSidebar.tsx`
  - [x] 3.1.3.1 Move activity feed rendering into component
  - [x] 3.1.3.2 Move `groupByProperty()` logic into component or utility
  - [x] 3.1.3.3 Create `MapSidebar.module.css` with sidebar styles extracted from Dashboard
  - [x] 3.1.3.4 Accept pins/activity data as props
  - [x] 3.1.3.5 Update `Dashboard.tsx` to render `MapSidebar`
- [x] 3.1.4 Extract measurement logic into `src/hooks/useMeasureTools.ts`
  - [x] 3.1.4.1 Move measure mode state into hook
  - [x] 3.1.4.2 Move measurement point collection logic into hook
  - [x] 3.1.4.3 Move distance/area calculation logic into hook
  - [x] 3.1.4.4 Return measure state + handlers from hook
  - [x] 3.1.4.5 Update `Dashboard.tsx` to consume hook
- [x] 3.1.5 Verify `Dashboard.tsx` is under 300 lines after extraction
  - [x] 3.1.5.1 Count final line total
  - [x] 3.1.5.2 Verify no logic duplication between hooks/components
  - [x] 3.1.5.3 Test all dashboard functionality end-to-end

### 3.2 Extract Photo Gallery Component

`InspectionDetail.tsx` mixes photo gallery with report logic.

- [x] 3.2.1 Create `src/components/shared/PhotoGallery.tsx`
  - [x] 3.2.1.1 Accept props: `photos[]`, `onReanalyse`, `analysing`, `currentPhotoIndex`
  - [x] 3.2.1.2 Render photo grid with lightbox support (reuse existing `Lightbox` component)
  - [x] 3.2.1.3 Show per-photo analysis status (analysing indicator, success/fail badge)
  - [x] 3.2.1.4 Support "Re-analyse" button per photo and "Re-analyse all" button
  - [x] 3.2.1.5 Create `PhotoGallery.module.css`
- [x] 3.2.2 Refactor `InspectionDetail.tsx` to use `PhotoGallery`
  - [x] 3.2.2.1 Replace inline photo gallery rendering with `PhotoGallery` component
  - [x] 3.2.2.2 Pass re-analyse handlers as callbacks
  - [x] 3.2.2.3 Verify all existing functionality preserved
- [x] 3.2.3 Refactor `WalkDetail.tsx` to use `PhotoGallery` if applicable
  - [x] 3.2.3.1 Assess whether walk photo rendering can reuse the same component
  - [x] 3.2.3.2 Adapt or extend `PhotoGallery` props if needed

### 3.3 Create `src/hooks/` Directory

Establish pattern for shared custom hooks.

- [x] 3.3.1 Create directory and initial hooks
  - [x] 3.3.1.1 Create `src/hooks/` directory
  - [x] 3.3.1.2 Move/create `useMapState.ts` (from 3.1.1)
  - [x] 3.3.1.3 Move/create `useSpatialLayers.ts` (from 3.1.2)
  - [x] 3.3.1.4 Move/create `useMeasureTools.ts` (from 3.1.4)
- [x] 3.3.2 Consider additional shared hooks
  - [x] 3.3.2.1 `useAnalysis.ts` — shared re-analyse logic (used by Snap, Inspection, Walk)
  - [x] 3.3.2.2 `useFetchDetail.ts` — shared fetch-by-id + loading/error state pattern
  - [x] 3.3.2.3 `useConfirmModal.ts` — shared modal open/close state management

---

## Phase 4 — Landing Page Improvements

### 4.1 Hero Section Improvements

Improve conversion by making the CTA more prominent.

- [x] 4.1.1 Add waitlist/signup form to hero section
  - [x] 4.1.1.1 Duplicate or move the email signup form from footer CTA into the hero
  - [x] 4.1.1.2 Position below hero subtitle text
  - [x] 4.1.1.3 Style consistently with existing form design
  - [x] 4.1.1.4 Keep footer CTA as a secondary conversion point
- [x] 4.1.2 Add a clear "Get Started" or "Try It" CTA button in hero
  - [x] 4.1.2.1 Position prominently below subtitle or next to form
  - [x] 4.1.2.2 Use terracotta accent colour for high visibility
- [x] 4.1.3 Hide phone mockup on small mobile viewports
  - [x] 4.1.3.1 Add `@media (max-width: 480px) { .heroPhone { display: none; } }` to `App.module.css`
  - [x] 4.1.3.2 Verify hero section still looks good without phone on small screens

### 4.2 Social Proof Section

No testimonials or trust signals currently. Critical for B2B conversion.

- [x] 4.2.1 Add a social proof section between "Features" and "How It Works"
  - [x] 4.2.1.1 Create section in `App.tsx` with logos or testimonial quotes
  - [x] 4.2.1.2 Style with muted appearance (greyscale logos, subtle background)
  - [x] 4.2.1.3 Add responsive layout (horizontal scroll on mobile, grid on desktop)
  - [x] 4.2.1.4 Add CSS styles to `App.module.css`

### 4.3 Feature Copy Improvements

Current copy emphasises *what* the tool does, not *why* users should care.

- [x] 4.3.1 Rewrite feature descriptions to emphasise outcomes
  - [x] 4.3.1.1 Snap: Add time-to-value ("Capture and analyse in under 60 seconds")
  - [x] 4.3.1.2 Inspect: Add outcome focus ("Never miss a defect again")
  - [x] 4.3.1.3 Appraise: Add confidence messaging ("Data-backed valuations you can trust")
  - [x] 4.3.1.4 Monitor: Add risk reduction ("Catch changes before they become problems")
  - [x] 4.3.1.5 Explore: Add efficiency benefit ("Walk scores and insights, hands-free")
- [x] 4.3.2 Expand "How It Works" section
  - [x] 4.3.2.1 Add a 4th step showing results/outcomes
  - [x] 4.3.2.2 Add time estimates to each step ("2 minutes", "Instant", etc.)
  - [x] 4.3.2.3 Add a brief ROI or benefit statement below the steps

### 4.4 Landing Page Code Cleanup

- [x] 4.4.1 Replace hardcoded image URL in `SnapCardScreen`
  - [x] 4.4.1.1 Identify the hardcoded `rimh2.domainstatic.com.au` URL
  - [x] 4.4.1.2 Download or replace with a local asset in `src/assets/`
  - [x] 4.4.1.3 Import as a module and reference in component
- [x] 4.4.2 Extract animation timing constants to `src/theme.ts`
  - [x] 4.4.2.1 Audit all animation delays in phone screen CSS files
  - [x] 4.4.2.2 Define named constants in `theme.ts` (e.g., `animationDelays`)
  - [x] 4.4.2.3 Document the animation sequence in comments
- [x] 4.4.3 Extract inline SVG paths from screen components
  - [x] 4.4.3.1 Identify all inline SVG in `ExploreScreen.tsx` and other screen components
  - [x] 4.4.3.2 Extract to `src/assets/icons/` as `.svg` files or a shared icon component
  - [x] 4.4.3.3 Import and reference in components

---

## Phase 5 — Polish & Accessibility

### 5.1 Consistent Loading States

Loading states vary across the app — some spinner, some text, some nothing.

- [x] 5.1.1 Create a shared `LoadingSpinner` component in `src/components/shared/`
  - [x] 5.1.1.1 Create `LoadingSpinner.tsx` with props: `size` (`sm` | `md` | `lg`), `message`
  - [x] 5.1.1.2 Create `LoadingSpinner.module.css` with animation
  - [x] 5.1.1.3 Use design tokens for colours and sizing
- [x] 5.1.2 Replace all "Loading..." text with `LoadingSpinner`
  - [x] 5.1.2.1 `SnapDetail.tsx`
  - [x] 5.1.2.2 `InspectionDetail.tsx`
  - [x] 5.1.2.3 `AppraisalDetail.tsx`
  - [x] 5.1.2.4 `MonitorDetail.tsx`
  - [x] 5.1.2.5 `WalkDetail.tsx`
  - [x] 5.1.2.6 `PropertyDetail.tsx`
  - [x] 5.1.2.7 `Dashboard.tsx` (if applicable)
  - [x] 5.1.2.8 `ProtectedRoute.tsx` (auth loading spinner)

### 5.2 Keyboard Accessibility Audit

- [x] 5.2.1 `EditableText.tsx` — verify keyboard-accessible
  - [x] 5.2.1.1 Ensure Enter key triggers edit mode
  - [x] 5.2.1.2 Ensure Escape key cancels edit
  - [x] 5.2.1.3 Ensure Tab key moves focus correctly
- [x] 5.2.2 `ConfirmModal` — verify keyboard-accessible (built in 1.4.1)
  - [x] 5.2.2.1 Focus trap works correctly
  - [x] 5.2.2.2 Escape closes modal
  - [x] 5.2.2.3 Enter on confirm button triggers action
- [x] 5.2.3 Map controls — verify keyboard-accessible
  - [x] 5.2.3.1 Layer toggle checkboxes are focusable and operable
  - [x] 5.2.3.2 Measure tool buttons have clear focus indicators
- [x] 5.2.4 Navigation — verify keyboard-accessible
  - [x] 5.2.4.1 All nav links in sidebar are focusable
  - [x] 5.2.4.2 Skip-to-content link exists for keyboard users
  - [x] 5.2.4.3 Bottom nav on mobile is keyboard-accessible

### 5.3 Mobile Layout Polish

- [x] 5.3.1 Test and fix `AppraisalDetail.tsx` map layout on mobile
  - [x] 5.3.1.1 Verify map + sidebar stacks vertically on mobile
  - [x] 5.3.1.2 Ensure map controls don't overlap sidebar
  - [x] 5.3.1.3 Test comp selection workflow on touch devices
- [x] 5.3.2 Test and fix `InspectionDetail.tsx` photo grid on mobile
  - [x] 5.3.2.1 Verify photo grid wraps correctly at 480px
  - [x] 5.3.2.2 Ensure photos are tappable with sufficient touch target size (48px min)
- [x] 5.3.3 Test and fix `Dashboard.tsx` sidebar on mobile
  - [x] 5.3.3.1 Verify sidebar doesn't overlap map controls
  - [x] 5.3.3.2 Ensure sidebar is scrollable when content exceeds viewport
  - [x] 5.3.3.3 Test pin click → navigation flow on touch devices

---

## Phase 6 — AS 4349.1-2007 Alignment & Prompt Centralisation

Align AI inspection prompts with Australian Standard AS 4349.1-2007 (Inspection of buildings — Pre-purchase inspections — Residential buildings). Centralise prompts so both the iOS and web apps produce consistent, standards-aligned analysis.

### 6.0 Prompt Centralisation

The iOS codebase (`groundtruth/constants/aiPrompts.ts`) has rich, context-aware prompt builders. The web codebase (`GroundTruthWeb/src/services/aiService.ts`) has simplified inline constants that produce lower-quality, inconsistent results. Both must be unified.

- [x] 6.0.1 Create `src/constants/aiPrompts.ts` in GroundTruthWeb mirroring the iOS prompt builders
  - [x] 6.0.1.1 Copy `joinPromptSections`, `formatNullableNumber`, and `COMMON_DISCIPLINE` helpers
  - [x] 6.0.1.2 Copy `buildSnapSystemPrompt` with `SnapPromptContext` interface
  - [x] 6.0.1.3 Copy `buildInspectSystemPrompt` with `InspectPromptContext` interface
  - [x] 6.0.1.4 Copy `buildStreetscapeSystemPrompt` with `StreetscapePromptContext` interface
- [x] 6.0.2 Refactor `src/services/aiService.ts` to import from `src/constants/aiPrompts.ts`
  - [x] 6.0.2.1 Remove inline `INSPECT_SYSTEM_PROMPT`, `EXPLORE_SYSTEM_PROMPT`, `SNAP_SYSTEM_PROMPT` constants
  - [x] 6.0.2.2 Update `reanalyseSnap()` to call `buildSnapSystemPrompt()` with context
  - [x] 6.0.2.3 Update `reanalyseInspectionPhoto()` to call `buildInspectSystemPrompt()` with context
  - [x] 6.0.2.4 Update `reanalyseWalkPhoto()` to call `buildStreetscapeSystemPrompt()` with context
- [x] 6.0.3 Verify both codebases produce identical system prompts for the same inputs

### 6.1 Defect Severity — Adopt AS 4349.1 Binary Classification (P0)

**Gap**: Current prompts use three-tier severity (`"minor"`, `"moderate"`, `"major"`). AS 4349.1 defines only two levels:
- **Major defect** (s1.4.10): *"A defect of sufficient magnitude where rectification has to be carried out in order to avoid unsafe conditions, loss of utility or further deterioration of the property."*
- **Minor defect** (s1.4.11): *"A defect other than a major defect."*

- [x] 6.1.1 Update inspect prompt severity constraint in `groundtruth/constants/aiPrompts.ts`
  - [x] 6.1.1.1 Replace `'"severity" must be exactly "minor", "moderate", or "major"'` with `'"severity" must be exactly "major" or "minor" per AS 4349.1. Do not use "moderate".'`
  - [x] 6.1.1.2 Add AS 4349.1 definitions: `'- "major": rectification required to avoid unsafe conditions, loss of utility, or further deterioration of the property'` and `'- "minor": any defect other than a major defect (includes cosmetic blemishes, normal wear, weathering)'`
  - [x] 6.1.1.3 Update response shape to show `"severity": "major" | "minor"` (remove `"moderate"`)
- [x] 6.1.2 Mirror severity changes in web `src/constants/aiPrompts.ts`
- [x] 6.1.3 Update TypeScript types in both codebases
  - [x] 6.1.3.1 iOS: update defect `severity` type to `"major" | "minor"` (remove `"moderate"`)
  - [x] 6.1.3.2 Web: update defect `severity` type in `src/types/common.ts` to `"major" | "minor"`
- [x] 6.1.4 Update UI severity badge rendering in both codebases
  - [x] 6.1.4.1 iOS: remove "moderate" colour/badge variant
  - [x] 6.1.4.2 Web: remove "moderate" colour/badge in `InspectionDetail.tsx` and `SnapDetail.tsx`
- [x] 6.1.5 Handle backward compatibility: existing records with `"moderate"` severity
  - [x] 6.1.5.1 Map `"moderate"` to `"minor"` at render time as a fallback

### 6.2 Defect Type Codes — Adopt AS 4349.1 Table 3.3 (P0)

**Gap**: Current prompts use free-form `type` string. AS 4349.1 Table 3.3 defines six specific defect types:

| Code | Defect | Identifier |
|------|--------|------------|
| A | Damage | Fabric ruptured or broken |
| B | Distortion / Warping / Twisting | Element distorted or moved from intended location |
| C | Water penetration / Damp related | Moisture in unintended or unexpected locations |
| D | Material deterioration | Rusting, rotting, corrosion, or decay of material |
| E | Operational | Element does not operate as intended |
| F | Installations (including omissions) | Improper/ineffective installation, inappropriate use, or missing components |

- [x] 6.2.1 Add Table 3.3 defect type classification to inspect prompt
  - [x] 6.2.1.1 Add `AS 4349.1 DEFECT CLASSIFICATION` section to `buildInspectSystemPrompt` listing all six types with their identifiers
  - [x] 6.2.1.2 Add `defectType` field constraint: `'"defectType" must be one of "A", "B", "C", "D", "E", or "F" per AS 4349.1 Table 3.3'`
  - [x] 6.2.1.3 Update response shape: replace `"type": "<string>"` with `"defectType": "A" | "B" | "C" | "D" | "E" | "F"`
- [x] 6.2.2 Mirror in web `src/constants/aiPrompts.ts`
- [x] 6.2.3 Update TypeScript defect interface in both codebases
  - [x] 6.2.3.1 iOS: add `defectType: "A" | "B" | "C" | "D" | "E" | "F"` field
  - [x] 6.2.3.2 Web: add `defectType` to defect type in `src/types/common.ts`
- [x] 6.2.4 Update UI defect rendering to show defect type code and label
  - [x] 6.2.4.1 iOS: render defect type badge (e.g. "Type C — Moisture")
  - [x] 6.2.4.2 Web: render defect type badge in `InspectionDetail.tsx`

### 6.3 Safety Hazard Identification (P0)

**Gap**: AS 4349.1 s4.2.4.3 requires: *"The report shall identify any observed item that may constitute a present or imminent serious safety hazard."* Commentary C2.3.5 adds that the inspector has a professional duty to ensure hazards are clearly identified so they are not easily overlooked.

- [x] 6.3.1 Add `safetyHazard` boolean field to inspect prompt output requirements
  - [x] 6.3.1.1 Add instruction: `'"safetyHazard": if any defect constitutes a present or imminent serious safety hazard per AS 4349.1 s4.2.4.3, set to true and ensure the defect description clearly identifies the hazard so it is not easily overlooked.'`
  - [x] 6.3.1.2 Add `"safetyHazard": <boolean>` to response shape
- [x] 6.3.2 Mirror in web `src/constants/aiPrompts.ts`
- [x] 6.3.3 Update TypeScript types in both codebases
- [x] 6.3.4 Add prominent safety hazard alert UI
  - [x] 6.3.4.1 iOS: render a red alert banner when `safetyHazard` is true on any photo
  - [x] 6.3.4.2 Web: render a red alert banner in `InspectionDetail.tsx` when any photo has `safetyHazard: true`
- [x] 6.3.5 Add `safetyHazards` string array to snap mode prompt
  - [x] 6.3.5.1 Add instruction: items visible from the street that may constitute a present or imminent serious safety hazard (e.g. unstable balustrades, leaning retaining walls, damaged pool fencing)
  - [x] 6.3.5.2 Add `"safetyHazards": ["<string>"]` to snap response shape

### 6.4 Defect Nature Sub-Classification (P1)

**Gap**: AS 4349.1 distinguishes three defect natures (s1.4.3, s1.4.12, s1.4.14):
- **Appearance defect**: only the appearance of the element is blemished
- **Serviceability defect**: the function of the building element is impaired
- **Structural defect**: the structural performance of the building element is impaired

A single defect may have multiple natures (e.g. a crack can be both an appearance defect and a structural defect).

- [x] 6.4.1 Add defect nature sub-classification to inspect prompt
  - [x] 6.4.1.1 Add `"nature"` field instructions with AS 4349.1 definitions
  - [x] 6.4.1.2 Specify that `nature` is an array (one or more may apply)
  - [x] 6.4.1.3 Update response shape: add `"nature": ["appearance" | "serviceability" | "structural"]`
- [x] 6.4.2 Mirror in web `src/constants/aiPrompts.ts`
- [x] 6.4.3 Update TypeScript defect interface in both codebases
- [x] 6.4.4 Update UI to display defect nature tags alongside severity and type

### 6.5 Cracking Categorisation — AS 4349.1 Appendix E, Table E1 (P1)

**Gap**: The standard provides a masonry cracking categorisation scale that inspectors must reference. Current prompts have no cracking severity guidance.

| Category | Width | Typical Damage |
|----------|-------|----------------|
| 0 | <=0.1 mm | Hairline cracks |
| 1 | <=1.0 mm | Fine cracks, no repair needed |
| 2 | <=5.0 mm | Noticeable, easily filled; doors/windows stick slightly |
| 3 | >5.0 to <=15.0 mm | Repairable but wall sections may need replacement; weather-tightness impaired |
| 4 | >15.0 to <=25.0 mm | Extensive repair; walls lean/bulge; service pipes disrupted |

- [x] 6.5.1 Add cracking guidance section to inspect prompt
  - [x] 6.5.1.1 Embed Table E1 categories (0-4) with width limits and typical damage descriptions
  - [x] 6.5.1.2 Add instruction: `'When cracking is visible, estimate the category from the image if possible.'`
  - [x] 6.5.1.3 Add optional `"crackingCategory": <number> | null` to defect response shape
- [x] 6.5.2 Mirror in web `src/constants/aiPrompts.ts`
- [x] 6.5.3 Update TypeScript defect interface in both codebases
- [x] 6.5.4 Update UI to display cracking category badge when present

### 6.6 Building Element Classification — AS 4349.1 Appendix C (P1)

**Gap**: Appendix C (Normative) defines six inspection area tables (C1-C6) with specific building elements. Current prompts don't classify which building element is being assessed.

- [x] 6.6.1 Add `buildingElement` field to inspect prompt
  - [x] 6.6.1.1 Add instruction listing Appendix C element categories: interior (ceiling, wall, floor, door, window, kitchen, bathroom, laundry, stairs), exterior (wall, frame, chimney, stairs, balcony/veranda/patio/deck), roof_exterior (covering, skylight, valley, gutter, downpipe, eave/fascia), roof_space (framing, sarking, party_wall, insulation), subfloor (supports, floor, ventilation), site (outbuilding, retaining_wall, path/driveway, steps, fencing, drainage)
  - [x] 6.6.1.2 Add `"buildingElement": "<string>"` to response shape
- [x] 6.6.2 Mirror in web `src/constants/aiPrompts.ts`
- [x] 6.6.3 Update TypeScript inspection analysis interface in both codebases
- [x] 6.6.4 Update UI to display building element classification on each photo card

### 6.7 Limitations & Further Inspection Recommendations (P1)

**Gap**: AS 4349.1 s4.2.5 requires identification of areas not inspected and the preventing factor. s4.2.6 requires recommendations for specialist inspections where applicable.

- [x] 6.7.1 Add `limitations` and `furtherInspection` fields to inspect prompt
  - [x] 6.7.1.1 Add `limitations` instruction: `'list any factors visible in the image that would prevent full inspection of the element (e.g. obstructions, concealment, poor lighting, limited angle)'`
  - [x] 6.7.1.2 Add `furtherInspection` instruction: `'if the visible evidence suggests a specialist should inspect further (e.g. structural engineer for significant cracking, pest inspector for suspected timber damage, plumber for damp issues), name the specialist type'`
  - [x] 6.7.1.3 Add `"limitations": ["<string>"]` and `"furtherInspection": "<string>" | null` to response shape
- [x] 6.7.2 Mirror in web `src/constants/aiPrompts.ts`
- [x] 6.7.3 Update TypeScript inspection analysis interface in both codebases
- [x] 6.7.4 Update UI to display limitations and specialist recommendations
  - [x] 6.7.4.1 iOS: add limitations callout and specialist recommendation on photo cards
  - [x] 6.7.4.2 Web: add limitations callout and specialist recommendation in `InspectionDetail.tsx`

### 6.8 Acceptance Criteria Framing (P2)

**Gap**: AS 4349.1 s2.3.6 requires condition to be assessed relative to *"a building that was constructed in accordance with the generally accepted practice at the time of construction and which has been maintained such that there has been no significant loss of strength and serviceability."*

- [x] 6.8.1 Update inspect prompt `narrative` instruction
  - [x] 6.8.1.1 Add: `'Frame condition relative to what would be expected for a building of similar age and type that has been reasonably maintained (AS 4349.1 s2.3.6 acceptance criteria).'`
- [x] 6.8.2 Update snap prompt `condition` instruction
  - [x] 6.8.2.1 Add: `'Assess condition relative to what would be expected for a property of this apparent age and type that has been reasonably maintained.'`
- [x] 6.8.3 Mirror in web `src/constants/aiPrompts.ts`

### 6.9 Report Writer — AS 4349.1 Section 4.2 Alignment (P1)

**Gap**: The inspection report writer prompt (`groundtruth/services/ai/reportWriter.ts`) doesn't structure the report per Section 4.2 requirements.

- [x] 6.9.1 Rewrite `buildInspectionSystemPrompt()` in `reportWriter.ts` to match AS 4349.1 Section 4.2 structure:
  - [x] 6.9.1.1 Section 1 — Executive Summary (s4.2.9): overview of purpose, scope, and conclusion
  - [x] 6.9.1.2 Section 2 — Inspection Details (s4.2.3): prevailing conditions, property description
  - [x] 6.9.1.3 Section 3a — Major Defects (s4.2.4.1): each major defect with location, AS 4349.1 type (A-F), clear description, and why it qualifies as major
  - [x] 6.9.1.4 Section 3b — Minor Defects (s4.2.4.2): overall extent only, not individual items. Note that minor defects are common and expected to be rectified as normal maintenance
  - [x] 6.9.1.5 Section 3c — Safety Hazards (s4.2.4.3): clearly identified, prominent, not easily overlooked
  - [x] 6.9.1.6 Section 4 — Limitations (s4.2.5): areas not inspected and why, with recommendations to gain access
  - [x] 6.9.1.7 Section 5 — Recommendations for Further Inspection (s4.2.6): specialist inspectors where applicable
  - [x] 6.9.1.8 Section 6 — Conclusion (s4.2.8): incidence of major defects, opinion on minor defects relative to average condition of similar buildings of same age, overall condition comment
- [x] 6.9.2 Update `buildInspectionUserPrompt()` to pass defect type codes and safety hazard flags to the report writer

### 6.10 Updated TypeScript Schema (Combined)

Summary of all type changes required across both codebases:

```typescript
// Proposed defect interface (replaces current)
interface InspectionDefect {
  defectType: "A" | "B" | "C" | "D" | "E" | "F";
  severity: "major" | "minor";
  nature: Array<"appearance" | "serviceability" | "structural">;
  description: string;
  crackingCategory: 0 | 1 | 2 | 3 | 4 | null;
}

// Proposed inspection photo analysis (replaces current)
interface InspectionPhotoAnalysis {
  conditionScore: number;
  materials: string[];
  buildingElement: string;
  defects: InspectionDefect[];
  safetyHazard: boolean;
  improvements: string[];
  constructionEra: string | null;
  narrative: string;
  limitations: string[];
  furtherInspection: string | null;
}
```

- [x] 6.10.1 Update iOS type definitions to match proposed schema
- [x] 6.10.2 Update web type definitions in `src/types/common.ts` to match proposed schema
- [x] 6.10.3 Handle backward compatibility for existing database records
  - [x] 6.10.3.1 Add runtime migration: map old `type` field to closest `defectType` code
  - [x] 6.10.3.2 Add runtime migration: map `"moderate"` severity to `"minor"`
  - [x] 6.10.3.3 Default missing fields: `safetyHazard: false`, `limitations: []`, `furtherInspection: null`, `buildingElement: "unknown"`

---

## Tracking

| Phase | Items | Completed | Status |
|-------|-------|-----------|--------|
| 1. Critical UX Fixes | 33 | 33 | Complete |
| 2. Design System | 42 | 42 | Complete |
| 3. Architecture | 22 | 22 | Complete |
| 4. Landing Page | 17 | 17 | Complete |
| 5. Polish & Accessibility | 17 | 17 | Complete |
| 6. AS 4349.1 Alignment | 67 | 67 | Complete |
| **Total** | **198** | **198** | **Complete** |
