# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Путешествуй в КЧР** — a commercial travel website for Karachay-Cherkessia (Russia). React 18 SPA with a Vite build system, backed by a separate Express/Node.js API (`c:\git back\puteshestvuy_v_kchr_back`).

## Commands

```bash
npm run dev       # Dev server on port 3000 (proxies /uploads → localhost:5000)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint on .js/.jsx files
```

There are no tests in this project.

## Environment Variables

```
VITE_API_URL             # Backend API base URL (default: http://localhost:4000/api)
VITE_YANDEX_MAPS_API_KEY # Yandex Maps API key
```

The dev server proxies `/uploads` → `http://localhost:5000` (static file server separate from the API).

## Architecture

### Tech Stack
- **React 18** + **React Router v6** (SPA routing in [src/App.jsx](src/App.jsx))
- **Vite** (bundler), **Tailwind CSS** + **CSS Modules** (styling), **MUI** + **Emotion** (UI components)
- **Axios** (HTTP), **Framer Motion** (animations), **Swiper** (carousels), **React Quill** (rich text editor)
- **Yandex Maps** for location picking and route display

### Routing
All routes are in [src/App.jsx](src/App.jsx). Public pages use `PublicLayout` (Header + Footer); `/admin/*` uses `AdminLayout` with a sidebar; `/admin/login` has no layout. Dynamic segments: `/routes/:slug`, `/places/:slug`, `/news/:slug`, `/services/:slug`, `/admin/places/:id`, etc.

### Directory Layout

| Path | Purpose |
|---|---|
| `src/app/` | Page-level components. Uses bracket naming (`[id]`, `[slug]`) as a convention — **not** Next.js filesystem routing |
| `src/sections/` | Page section containers that compose multiple components into a full view |
| `src/components/` | Reusable UI components (cards, modals, map pickers, sliders, filters, rich text) |
| `src/contexts/` | React Context providers |
| `src/lib/` | Axios API layer + hooks (search, filters) |
| `src/utils/` | Generic utilities (transliteration) |

### API Layer (`src/lib/api.js`)
Single Axios instance. Request interceptor injects `Bearer` token from `localStorage` (`token` or `adminToken`). Response interceptor on 401 clears all tokens, fires `user-unauthorized` custom event, and redirects admin paths to `/login?returnUrl=…`.

All endpoints are grouped by feature:

| Export | Prefix | Purpose |
|---|---|---|
| `authAPI` | `/auth` | login, register |
| `userAPI` | `/users` | profile, avatar, favorites, constructor points |
| `userRoutesAPI` | `/users/routes` | user-saved custom routes |
| `publicPlacesAPI` | `/places` | public places list + filters + reviews |
| `publicRoutesAPI` | `/routes` | public routes list + filters + reviews |
| `publicNewsAPI` | `/news` | public news list |
| `publicServicesAPI` | `/services` | public services list + reviews |
| `publicRegionAPI` | `/region` | region page content |
| `publicHomeAPI` | `/home` | home page content |
| `publicFooterAPI` | `/footer` | footer content |
| `publicPagesAPI` | `/pages/:name` | static pages content |
| `placesAPI` | `/admin/places` | admin CRUD for places |
| `routesAPI` | `/admin/routes` | admin CRUD for routes |
| `newsAPI` | `/admin/news` | admin CRUD for news |
| `servicesAPI` | `/admin/services` | admin CRUD for services |
| `placeFiltersAPI` | `/admin/place-filters` | manage place filter groups/values |
| `routeFiltersAPI` | `/admin/route-filters` | manage route filter groups/values |
| `reviewsAPI` | `/admin/reviews` | admin review moderation |
| `adminUsersAPI` | `/admin/users` | admin user management (role, ban) |
| `adminBookingsAPI` | `/admin/bookings` | admin bookings |
| `adminSuggestionsAPI` | `/admin/suggestions` | admin: review user-submitted place suggestions |
| `bookingsAPI` | `/bookings` | user booking creation + busy dates |
| `suggestionsAPI` | `/suggestions/places` | user: submit a place suggestion |
| `regionAPI` | `/admin/region` | admin: edit region page |
| `homeAPI` | `/admin/home` | admin: edit home page |
| `footerAPI` | `/admin/footer` | admin: edit footer |
| `pagesAPI` | `/admin/pages/:name` | admin: edit static pages |
| `mediaAPI` | `/admin/media` | file / image / video / document upload |
| `statsAPI` | `/admin/stats` | dashboard statistics |
| `feedbackAPI` | `/footer/feedback` | contact form in footer |

`getImageUrl(path)` resolves relative backend paths to full URLs using `BASE_URL` (derived from `VITE_API_URL`).

### Context Providers
- **`AuthContext`** — auth state, login/logout, favorites toggle; tokens in `localStorage` (`token`, `adminToken`, `adminUser`)
- **`AuthModalContext`** — open/close state for the login/register modal
- **`RouteConstructorContext`** — route builder: selected places list, start/end points, Haversine distance, debounced sync to `userRoutesAPI`
- **`ToastContext`** — toast notifications (auto-dismiss 2.5 s)

### Service Detail Templates
`src/sections/Services/ServiceDetail/templates/` contains a template per service type, rendered polymorphically via `ServiceTemplateByType`. Current templates: `Hotel`, `Activities`, `Cafe`, `EquipmentRental`, `Fire`, `GasStation`, `Guide`, `Medical`, `Museum`, `Police`, `RoadsidePoint`, `RoadsideService`, `Shop`, `Souvenirs`, `TourOperator`, `Transfer`, `Toilets`. Add new templates here and register them in `index.jsx`.

### Styling Conventions
- Tailwind for layout and utilities; custom design tokens in `tailwind.config.js` (`primary-50` → `primary-900`)
- CSS Modules (`.module.css`) for component-scoped styles
- Path alias `@/` → `src/` (configured in both `vite.config.js` and `jsconfig.json`)
- Global base styles in `src/index.css`

### Rich Text / Media
- Admin creates content with **React Quill**; rendered via `RichTextContent` component (DOMPurify sanitization)
- Image cropping via **React Easy Crop** before upload

## Code Guidelines

- Functional components only (React)
- Small components with a single responsibility; logic in hooks/utils, UI separate
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
