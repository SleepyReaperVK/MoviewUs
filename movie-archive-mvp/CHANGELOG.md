# Changelog

## [Unreleased] — 2026-05-04

### Header & Navigation Overhaul

**Restored header layout to match reference commit `f66c6c4`**
- Logo restored to large size (`h-14 sm:h-16`) with `scale3d(2,2,2)` transform and `top-[3vh]` offset
- Nav bar height restored to `h-18 sm:h-22`
- Search input restored to `max-w-md` width with `py-2.5` padding and original placeholder text
- Add button reverted to original styling (removed `nav-icon-btn` class)
- Removed mobile search bar that appeared below the nav row

**Import/Export moved into profile dropdown**
- Import and Export are no longer standalone icon buttons in the nav row
- Profile avatar converted from `div` to an accessible `button`
- Clicking the avatar opens a dropdown menu containing "Import movies" and "Export movies"
- Dropdown closes on outside click and Escape key
- Added ARIA attributes: `aria-label`, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`
- Added test selectors: `data-testid="profile-menu-trigger"`, `data-testid="profile-menu"`, `data-testid="profile-menu-import"`, `data-testid="profile-menu-export"`

**Notification bell opens notifications panel**
- Clicking the bell now toggles a notifications panel
- Panel shows all received push alerts; falls back to "No notifications available." when empty
- Badge dot on the bell only renders when there are pending notifications
- Each notification has an individual dismiss button
- Panel closes on outside click and Escape key
- Added ARIA attributes: `aria-label`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`
- Added test selectors: `data-testid="notifications-trigger"`, `data-testid="notifications-panel"`

**Removed `min-width` from `.nav-icon-btn`**
- `min-width: 44px` removed from `.nav-icon-btn` in `index.css`
- Added `flex-shrink: 0` to prevent icon buttons from compressing on small screens
- `min-height: 44px` retained for touch target compliance

**Fixed bottom-center "made with ❤️ for here" badge**
- Added globally in `App.tsx` as a `MadeWithLoveBadge` component
- `position: fixed`, horizontally centered, `pointer-events: none` so it never blocks clicks
- Glassmorphism background (`backdrop-filter: blur(8px)`)
- Padding accounts for `env(safe-area-inset-bottom)` on mobile

### Push Alert System (from previous session)

**Secure API endpoint `POST /api/alert`**
- Accepts `{ title, text, time? }` in the request body (`time` in seconds)
- Authenticated via `Authorization: Bearer <key>` or `x-alert-key` header matching `ALERT_API_KEY` env var
- Returns `{ ok: true, recipients: N }` on success; `401` for bad key; `400` for invalid body
- Broadcasts the payload to all connected WebSocket clients

**WebSocket server on `/alerts`**
- Shares the Express HTTP server via `noServer: true` + `upgrade` event
- Clients connect at `ws://[api-host]/alerts` — no auth required to listen
- Auto-reconnects every 5 seconds on the frontend if the connection drops

**AlertModal component**
- Displays `title` and `text` from the received alert payload
- Auto-dismisses after `time` seconds when provided; otherwise requires manual close
- Renders at `z-[200]` — sits above all other modals
- Backdrop click also dismisses

**`useAlert` hook**
- Maintains a `notifications[]` array — new WS messages are appended
- `pushAlert` exposes the latest notification for `AlertModal`
- `dismissAlert` removes the latest; `dismissNotification(index)` removes a specific one
- WS URL derived at runtime from `VITE_API_URL` (strips `/api`, swaps `http` → `ws`/`https` → `wss`)

**`useDismissibleLayer` hook**
- Shared utility for outside-click and Escape-key dismissal
- Used by both the profile dropdown and the notifications panel

### Files Changed

| File | Change |
|------|--------|
| `web/src/components/Navbar.tsx` | Full rewrite — restored layout, profile dropdown, notifications panel |
| `web/src/hooks/useAlert.ts` | Extended to accumulate `notifications[]` array |
| `web/src/hooks/useDismissibleLayer.ts` | New — outside-click + Escape dismiss hook |
| `web/src/pages/HomePage.tsx` | Added `notifications` + `onDismissNotification` props to Navbar |
| `web/src/components/AlertModal.tsx` | New — modal overlay for push alerts |
| `web/src/App.tsx` | Added `MadeWithLoveBadge` |
| `web/src/index.css` | Removed `min-width` from `.nav-icon-btn`; added `.made-with-love-badge` |
| `web/src/components/index.ts` | Exported `AlertModal` |
| `api/index.js` | Added `POST /api/alert`, WebSocket server via `ws` package |
| `api/package.json` | Added `ws` dependency |
| `api/.env.example` | Added `ALERT_API_KEY` variable |

---

## [f66c6c4] — 2026-05-02

Refactored project structure and updated Docker configuration for production deployment.

- Added `Caddyfile` for TLS reverse proxy (Let's Encrypt)
- Updated `docker-compose.yml` with production-grade health checks and service dependencies
- Added `api/Dockerfile` and `web/Dockerfile`
- Added `.dockerignore` files for API and web
- Updated `.env.example` files for both root and `api/`
- Added `db/backups/backup.sh` for database backup automation

---

## [2f5a8e9] — Initial base stack

Initial working stack: Express API + React frontend + PostgreSQL via Prisma.
