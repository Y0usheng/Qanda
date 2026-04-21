# Qanda Backend

Express-based REST API for the Qanda forum, backed by MongoDB (via Mongoose). Provides authentication, thread/comment CRUD, likes, watches, and user management.

## Tech Stack

- **Node.js** with ES modules (`"type": "module"`)
- **Express 4** — HTTP server
- **Mongoose 9** — MongoDB ODM
- **jsonwebtoken** — JWT-based auth
- **swagger-ui-express** — interactive API docs
- **express-rate-limit** — basic rate limiting
- **Jest + Supertest** — tests

## Setup

```bash
npm install
```

Create a `.env` file in [backend/](.):

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
PORT=5000
JWT_SECRET=your-secret-here
```

## Scripts

| Script          | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `npm start`     | Run the server (`node src/server.js`)               |
| `npm run dev`   | Run with nodemon (auto-reload on change)            |
| `npm test`      | Run the Jest test suite (`test/main.test.js`)       |
| `npm run reset` | Reset the test database                             |
| `npm run lint`  | Lint `src/*.js` with ESLint                         |
| `npm run clear` | Delete the local `database.json` snapshot           |

## Project Layout

```
backend/
├── src/
│   ├── server.js      # Express app + route handlers
│   ├── service.js     # Business logic (auth, threads, comments, users)
│   ├── models/        # Mongoose schemas
│   ├── config.js      # Default port and static config
│   └── error.js       # InputError / AccessError classes
├── public/storage/    # Uploaded images (served at /storage)
├── swagger.json       # OpenAPI spec rendered at /docs
├── test/              # Jest tests
└── package.json
```

## API Overview

All authenticated routes expect a JWT in the `Authorization` header.

### Auth
- `POST /auth/login` — email + password → token
- `POST /auth/register` — email + password + name → token

### Threads
- `GET /threads?start=&limit=&sortBy=` — paginated list
- `GET /thread?id=` — single thread
- `POST /thread` — create
- `PUT /thread` — edit (title, content, isPublic, lock)
- `DELETE /thread` — delete
- `PUT /thread/like` — toggle like
- `PUT /thread/watch` — toggle watch

### Comments
- `GET /comments?threadId=` — list comments for a thread
- `POST /comment` — create (with optional `parentCommentId`)
- `PUT /comment` — edit
- `DELETE /comment` — delete
- `PUT /comment/like` — toggle like

### Users
- `GET /user?userId=` — profile
- `PUT /user` — update own email / password / name / image
- `PUT /user/admin` — admin-only: toggle admin on another user

Full schema with request/response examples is available at `http://localhost:<PORT>/docs` once the server is running.

## Errors

- `400` — `InputError` (validation failures)
- `403` — `AccessError` (permission denied)
- `500` — unexpected server error

## Rate Limiting

1000 requests per IP per 15 minutes, applied globally.
