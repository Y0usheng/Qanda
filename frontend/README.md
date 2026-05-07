# Qanda Frontend

A single-page forum app built with **vanilla JavaScript** — no frameworks, no bundler. All DOM is created and managed by hand using ES modules served directly to the browser.

## Tech Stack

- HTML5 + CSS3
- Vanilla JS (ES modules via `<script type="module">`)
- Fetch API for backend communication
- `localStorage` for JWT persistence

## Setup

No install step is required — the frontend is plain static files. Just serve the directory with any static server.

```bash
# from frontend/
npx http-server . -p 3000
# or
python -m http.server 3000
```

Then open `http://localhost:3000`.

### Backend URL

Edit [src/config.js](src/config.js) to point at your backend:

```js
export const BACKEND_BASE_URL = 'https://qanda-x9l8.onrender.com';
// or for local dev: 'http://localhost:5005'
```

All HTTP calls and image URLs (`/storage/...`) are resolved against `BACKEND_BASE_URL`.

## Project Layout

```
frontend/
├── index.html           # Shell: header, <main>, footer
├── styles/
│   └── global.css       # Global styles
└── src/
    ├── main.js          # Entry point + dashboard rendering
    ├── config.js        # BACKEND_BASE_URL
    ├── api.js           # Wrapper around fetch for all backend endpoints
    ├── auth.js          # Login / register / logout screens
    ├── thread.js        # Thread list + create / view / edit / delete
    ├── comment.js       # Comment list, nested replies, edit, like
    ├── profile.js       # User profile view + update + admin toggle
    ├── helpers.js       # Notifications, image upload helper
    └── utils.js         # DOM helpers (clear, button factory, etc.)
```

## App Flow

1. On load, [main.js](src/main.js) checks `localStorage.authToken`.
   - If present → render dashboard.
   - If missing → render the login form.
2. The **dashboard** shows the paginated thread list (left, ≤400px wide) and the currently selected thread (main area).
3. Clicking a thread renders the individual thread screen, which lazy-loads its comments.
4. Shared **callbacks** (back, profile, open-thread, refresh, reload-comments) are threaded through the views so any child view can navigate.

## Features Implemented

- Login / Register / Logout with JWT stored in `localStorage`
- Create / view / edit / delete threads (with public / private / locked states)
- Pagination / infinite scroll over the thread list
- Like and watch threads
- Nested comments with reverse-chronological sort and relative timestamps
- Reply / edit / like on comments
- Profile view, profile edit (email, password, name, image upload)
- Admin: promote / demote other users
- Polling-based live updates for threads and comments
- Error popups for failed requests

## Notes

- Because there is no build step, all code must be browser-compatible ES modules. Do not add anything that requires transpilation.
- Images are uploaded as base64 data URLs via the `image` field on `PUT /user` — see `helpers.js` for the file-to-data-URL helper.
