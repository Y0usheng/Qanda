# Qanda

A UNSW-themed forum application inspired by [EdStem](https://edstem.org). Users can register, log in, create threads (public or private), comment (with nested replies), like, watch, and manage profiles. Admins can promote other users.

This repository contains both the frontend (vanilla JS + HTML/CSS) and the backend (Express + MongoDB).

## Project Structure

```
qanda/
├── backend/     # Express API server (Node.js, MongoDB via Mongoose)
├── frontend/    # Vanilla JS single-page app (no framework)
└── util/        # Utility scripts
```

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for the details of each.

## Quick Start

1. **Backend** — from [backend/](backend/):
   ```bash
   npm install
   # create .env with MONGO_URI and (optionally) PORT / JWT_SECRET
   npm run start
   ```
   The API will listen on `http://localhost:5000` (or `PORT`). Swagger docs are served at `/docs`.

2. **Frontend** — from [frontend/](frontend/):
   ```bash
   # serve the folder with any static server, e.g.
   npx http-server . -p 3000
   ```
   Then open `http://localhost:3000`. Make sure [frontend/src/config.js](frontend/src/config.js) points `BACKEND_PORT` at your running backend.

## Features

- **Auth** — register / login with JWT.
- **Threads** — create, edit, delete, like, watch; public / private / locked.
- **Comments** — nested replies, edit, delete, like; sorted reverse-chronologically.
- **Users** — profile view, profile edit (email, password, name, image), admin promotion.
- **Infinite scroll** on the thread list.
- **Live polling** for thread updates and comments.

## API Reference

The backend exposes REST endpoints under `/auth`, `/thread(s)`, `/comment(s)`, and `/user`. Full schema is served by the backend at `/docs` (Swagger UI).

## License

ISC
