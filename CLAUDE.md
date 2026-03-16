# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (Vite)
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# TypeScript type checking (no emit)
npx tsc --noEmit
```

No test framework is configured.

## Architecture

React 19 + Vite SPA with Supabase backend. Deployed on Vercel. TypeScript strict mode enabled (`noUnusedLocals`, `noUnusedParameters`).

### Routing (src/main.tsx)

React Router v7. Public routes: `/` (landing), `/login`. All app routes live under `/app` wrapped in `ProtectedRoute` → `AppLayout`. Six feature modules: snaps, inspections, appraisals, monitor, walks, properties. Each has list + detail pages at `/app/{module}` and `/app/{module}/:id`.

### State Management

No state library — React Context only. `AuthContext` provides auth state and Supabase auth methods. Feature pages use local `useState`. `useAuth()` hook for accessing auth context.

### Services (src/services/)

- **api.ts** — All Supabase CRUD. Functions return typed results, mapping snake_case DB columns to camelCase via mapper functions. All functions guard against null `supabase` client (returns empty data).
- **aiService.ts** — Calls Supabase Edge Functions for vision analysis (snap, inspection, explore, appraisal photos).
- **daService.ts** — Development application geospatial queries from a separate DA Supabase instance.
- **trainStationService.ts** — Railway/station layer data.

### Types (src/types/common.ts)

All shared interfaces live here. Maps Supabase snake_case to camelCase. Key types: `Snap`, `Inspection`, `Appraisal`, `WatchedProperty`, `WalkSession`, `GroupedProperty`, `MapPin`, `FeatureType`.

### Styling

CSS Modules (`.module.css` per component). Dark theme by default. Design tokens in `src/theme.ts` (`colours`, `fonts`) and CSS custom properties in `src/index.css`. Three font families: DM Serif Display (brand), Public Sans (body), JetBrains Mono (data). No Tailwind.

### Map

Mapbox GL via `react-map-gl`. Dashboard (`src/pages/Dashboard.tsx`) renders full-screen map with property pins, walk routes, DA layer, train stations, and 3D buildings. Map components: `LayerControl`, `MapLegend`, `MeasureTools`.

### Landing Page

`src/App.tsx` is a marketing landing page with animated iPhone mockups using `PhoneFrame` + screen components in `src/components/phone/`.

### Environment Variables

Requires `.env` with: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, plus optional DA Supabase credentials (`VITE_DA_SUPABASE_URL`, `VITE_DA_SUPABASE_ANON_KEY`). Supabase client is defensive against missing env vars.

## Code Style & Conventions

### British English

All code must use British English spelling:

```typescript
// ✅ Correct
colours, organised, recognised, optimised, centralised

// ❌ Incorrect
colors, organized, recognized, optimized, centralized
```

Applies to variable/function names, comments, UI text. **Exception:** GIS/mapping terms retain American spelling (`center`, `centerLng`, `centerLat`) for consistency with Mapbox/mapping APIs.

### TypeScript Standards

- Eliminate `any` types — use proper typing or generics
- Never use type suppression comments (`@ts-expect-error`, `@ts-ignore`, `eslint-disable`, `@ts-nocheck`)
- Fix TypeScript errors properly rather than suppressing them
- Check `src/types/common.ts` for existing types before creating new ones
- Prefix unused variables/args with `_` to satisfy the linter

### Memory Management

Every `useEffect` with side effects must clean up:

```typescript
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

Required cleanups: event listeners, timers, subscriptions, map layers. Guard async state updates to avoid updates after unmount.

### Forbidden Patterns

- Type suppression comments (`@ts-expect-error`, `@ts-ignore`, `eslint-disable`)
- TODO, FIXME, HACK, XXX comments
- Commented-out code blocks
- Tutorial-style comments ("First, we fetch...", "Now let's update...")
- Hardcoded API keys or credentials — use `import.meta.env.VITE_*`
- `dangerouslySetInnerHTML` without sanitisation

### Code Quality

- Self-documenting code — comments explain "why", not "what"
- Target <30 lines per function; split complex functions into smaller, focused functions
- Target ≤500 lines per file; split into smaller components/utilities if exceeded
- Check for existing utilities in `src/services/` and `src/components/shared/` before creating new ones
- Use design tokens from `src/theme.ts` and CSS custom properties — don't hardcode design values

## Continuous Learning & Knowledge Capture

This document should evolve as we work together. When important patterns, gotchas, or insights specific to this codebase are discovered, they should be captured here.

Before adding any new learning or insight to this file, always ask for approval first.
