# Push Alert System — How It Works

## Overview

A secure push-alert feature that lets you fire a notification from anywhere (a script, curl, another service) and have it appear as a modal overlay on any open browser tab of the website.

---

## The Flow

```
You → POST /api/alert (with secret key)
         ↓
   Express validates + broadcasts
         ↓
   WebSocket server pushes to all connected browsers
         ↓
   Modal appears on screen (auto-dismisses if time is set)
```

---

## API Endpoint

### `POST /api/alert`

Accepts a JSON body and broadcasts the alert to all connected browsers.

**Authentication:** Include your secret key as a Bearer token:
```
Authorization: Bearer your-secret-key
```
Or as a header:
```
x-alert-key: your-secret-key
```

**Request body:**

| Field   | Type   | Required | Description                                      |
|---------|--------|----------|--------------------------------------------------|
| `title` | string | Yes      | Modal heading                                    |
| `text`  | string | Yes      | Modal body text                                  |
| `time`  | number | No       | Auto-dismiss after this many seconds. Omit for manual dismiss only. |

**Example — manual dismiss:**
```bash
curl -X POST http://localhost:4000/api/alert \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "Heads up", "text": "Something happened on the server."}'
```

**Example — auto-dismiss after 8 seconds:**
```bash
curl -X POST http://localhost:4000/api/alert \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "Heads up", "text": "This closes in 8 seconds.", "time": 8}'
```

**Responses:**

| Status | Meaning                                  |
|--------|------------------------------------------|
| 200    | `{ ok: true, recipients: N }` — sent to N browsers |
| 400    | Missing/invalid `title`, `text`, or `time`         |
| 401    | Wrong or missing API key                 |
| 500    | `ALERT_API_KEY` not set in server env    |

---

## WebSocket Connection

The browser connects automatically to `ws://[api-host]/alerts` when the page loads. No authentication is required to listen — the WebSocket is read-only for browsers.

The connection auto-reconnects every 5 seconds if it drops (e.g. server restart).

---

## Environment Variable

Set this in `api/.env`:

```
ALERT_API_KEY=your-long-random-secret-here
```

Use a strong random string. Anyone with this key can push alerts to all open browser tabs.

---

## Files Added / Changed

| File | What changed |
|------|--------------|
| `api/index.js` | Added `ws` WebSocket server on `/alerts` path; added `POST /api/alert` endpoint |
| `api/package.json` | Added `ws` dependency |
| `api/.env` / `.env.example` | Added `ALERT_API_KEY` variable |
| `web/src/hooks/useAlert.ts` | New hook — manages WebSocket connection, exposes `pushAlert` state |
| `web/src/components/AlertModal.tsx` | New modal component — renders alert, handles auto-dismiss timer |
| `web/src/pages/HomePage.tsx` | Wired in `useAlert` hook and `AlertModal` component |
| `web/src/components/index.ts` | Exported `AlertModal` |
