# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Путешествуй в КЧР** — a commercial travel website for Karachay-Cherkessia (Russia). React 18 SPA with a Vite build system, backed by a separate Express/Node.js API (`c:\git back\puteshestvuy_v_kchr_back`).

## Commands

```bash
npm run dev       # Dev server on port 3000 (proxies /uploads → localhost:5000)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint on .js/.jsx files
```

## Environment Variables

```
VITE_API_URL             # Backend API base URL (default: http://localhost:5000/api)
VITE_YANDEX_MAPS_API_KEY # Yandex Maps API key
```

## Architecture

### Tech Stack
- **React 18** + **React Router v6** (SPA routing in `src/App.jsx`)
- **Vite** (bundler), **Tailwind CSS** + **CSS Modules** (styling), **MUI** + **Emotion** (UI components)
- **Axios** (HTTP), **Framer Motion** (animations), **Swiper** (carousels), **React Quill** (rich text editor)
- **Yandex Maps** for location picking and route display

### Routing
Routes are defined in [src/App.jsx](src/App.jsx). Public pages use `PublicLayout` (Header + Footer); admin pages under `/admin` use `AdminLayout` with a sidebar. Dynamic segments follow the pattern `/routes/:slug`, `/places/:slug`, etc.

### Directory Layout

| Path | Purpose |
|---|---|
| `src/app/` | Legacy folder structure — page-level components (Home, Region, Routes, Places, News, Services, Profile, Admin panel pages) |
| `src/sections/` | Page section containers that compose multiple components into a full view |
| `src/components/` | Reusable UI components (cards, modals, map pickers, sliders, filters, rich text) |
| `src/contexts/` | React Context providers |
| `src/lib/` | Axios API layer + hooks (search, filters) |
| `src/utils/` | Generic utilities (transliteration) |

### API Layer (`src/lib/api.js`)
Single Axios instance with interceptors that auto-inject Bearer tokens and handle 401s (clears localStorage, redirects to login). All endpoints are grouped by feature:

- **Auth:** `authAPI` (login, register)
- **Public data:** `publicPlacesAPI`, `publicRoutesAPI`, `publicNewsAPI`, `publicServicesAPI`
- **Admin CRUD:** `placesAPI`, `routesAPI`, `newsAPI`, `servicesAPI`, `adminUsersAPI`
- **User:** `userAPI` (profile, favorites, constructor points)
- **Bookings:** `bookingsAPI` (user), `adminBookingsAPI` (admin)
- **Content:** `regionAPI`, `homeAPI`, `footerAPI`, `pagesAPI`
- **Media:** `mediaAPI` (file/image upload)

Image URLs from the backend are resolved through `getImageUrl(path)`.

### Context Providers
- **`AuthContext`** — auth state, login/logout, favorites toggle; tokens stored in `localStorage` (`token`, `adminToken`, `adminUser`)
- **`AuthModalContext`** — open/close state for the auth modal
- **`RouteConstructorContext`** — route builder feature: selected places, start/end points, debounced backend sync, Haversine distance calculation
- **`ToastContext`** — toast notifications (auto-dismiss after 2.5 s)

### Styling Conventions
- Tailwind for layout and utilities; custom design tokens defined in `tailwind.config.js` (`primary-50` to `primary-900`)
- CSS Modules (`.module.css`) for component-scoped styles
- Path alias `@/` → `src/` (configured in `vite.config.js` and `jsconfig.json`)
- Global base styles and `@layer` utilities in `src/index.css`

### Rich Text / Media
- Admin creates content with **React Quill**; output is rendered with **DOMPurify** sanitization via `RichTextContent`
- Image cropping handled by **React Easy Crop** before upload
- `/uploads` requests are proxied to the backend during development

## Code Guidelines

- Clean, readable, efficient, maintainable code — no over-engineering or unnecessary abstractions
- Functional components only (React)
- Small components with a single responsibility; logic in hooks/utils, UI separate
- Clear, consistent naming
- Before creating a new component, check if a similar one already exists
- No logic duplication — reuse existing code
- No new dependencies without clear necessity
- Always analyze existing structure and style before writing code; strictly follow established architecture and patterns

## Visual Style

- Analyze existing components, colors, fonts, spacing, and patterns before making UI changes
- Strictly follow the existing style in all new elements
- Do not make visual changes unless explicitly requested

## Response Style

- Think in English, respond in Russian
- No explanations of what you're doing — just do it
- No unnecessary comments or post-task summaries
- If the task is clear — don't ask for clarification
