# Movie Watchlist API — Internet Technologies 2026

A small REST API built for VilniusTech's "Interneto technologijos" assignment. Lets an authenticated user manage a list of movies (add, edit, delete, toggle watched, filter).

- **Backend only** (no frontend in this project).
- **Stack:** Node.js + Express + SQLite + JWT + HTTPS.

---

## 1. How to run

### Prerequisites
- Node.js 18+
- `openssl` in PATH (Git Bash on Windows includes it)

### Commands

```bash
cd backend
npm install              # only the first time
node server.js
```

The server starts on **https://localhost:3000**.

First time you call the API, you'll get a cert warning because it's self-signed. In `curl` use `-k`. In Postman turn off "SSL certificate verification" for this request.

### Default login
`admin` / `admin123` (seeded by `db.js` on first run).

---

## 2. Requirements mapping (from the course PPT)

| Requirement | How we satisfy it |
|---|---|
| ≥ 5 API endpoints | **7 endpoints** — 1 auth + 6 movies |
| ≥ 2 of {POST, PUT, PATCH, DELETE} | All 4 used |
| ≥ 3 HTTP param types | **Header** `Authorization`, **query** `?status=`, **path** `/:id` |
| Framework conventions | Standard Express layout: `routes/`, `middleware/`, `db.js`, `server.js` |
| BE implements API purpose | All 6 movie endpoints read/write SQLite with proper status codes |
| HTTPS | `server.js` uses `https.createServer` with the self-signed cert |
| Authorization | JWT issued by `/api/auth/login`, verified by `middleware/auth.js` |
| Validation | Every create/update endpoint validates type & range of each field |

---

## 3. API endpoints

All `/api/movies/*` endpoints require header `Authorization: Bearer <token>`.

| # | Method | Path | What it does | Params |
|---|--------|------|--------------|--------|
| 1 | POST | `/api/auth/login` | Log in, returns `{ token }` | body `{username, password}` |
| 2 | GET | `/api/movies` | List all movies | query `?status=watched\|to-watch` (optional) |
| 3 | GET | `/api/movies/:id` | Get one movie | path `:id` |
| 4 | POST | `/api/movies` | Create a movie | body `{title, genre, year}` |
| 5 | PUT | `/api/movies/:id` | Replace a movie | path `:id` + body |
| 6 | PATCH | `/api/movies/:id/status` | Toggle watched flag | path `:id` + body `{watched: bool}` |
| 7 | DELETE | `/api/movies/:id` | Delete a movie | path `:id` |

---

## 4. Demo script (run these at the defense)

The lecturer will want to see that the API works end-to-end. Below is a complete `curl` walkthrough. Run it in Git Bash (Windows) or any Linux/Mac shell. `-k` tells curl to accept the self-signed cert.

### 4.1 Log in — get a token

```bash
curl -k -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Copy the token from the response, then save it for the next calls:

```bash
TOKEN="paste-token-here"
```

### 4.2 Reject unauthorized access

```bash
curl -k https://localhost:3000/api/movies
# → { "error": "Missing Authorization header" }   (HTTP 401)
```

Shows the `requireAuth` middleware works.

### 4.3 List movies (empty at first)

```bash
curl -k https://localhost:3000/api/movies \
  -H "Authorization: Bearer $TOKEN"
# → []
```

### 4.4 Add a movie (POST)

```bash
curl -k -X POST https://localhost:3000/api/movies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Interstellar","genre":"Sci-fi","year":2014}'
# → { "id":1, "title":"Interstellar", "genre":"Sci-fi", "year":2014, "watched":0 }   (HTTP 201)
```

### 4.5 Reject invalid body (shows validation)

```bash
curl -k -X POST https://localhost:3000/api/movies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"X","genre":"Y","year":"not-a-number"}'
# → { "error": "year must be an integer between 1880 and 2100" }   (HTTP 400)
```

### 4.6 Get one (path param)

```bash
curl -k https://localhost:3000/api/movies/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 4.7 Toggle watched (PATCH + body)

```bash
curl -k -X PATCH https://localhost:3000/api/movies/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"watched":true}'
```

### 4.8 Filter by status (query param)

```bash
curl -k "https://localhost:3000/api/movies?status=watched" \
  -H "Authorization: Bearer $TOKEN"
```

### 4.9 Replace a movie (PUT)

```bash
curl -k -X PUT https://localhost:3000/api/movies/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Interstellar (2014)","genre":"Sci-fi Drama","year":2014}'
```

### 4.10 Delete (DELETE)

```bash
curl -k -X DELETE https://localhost:3000/api/movies/1 \
  -H "Authorization: Bearer $TOKEN"
# → (empty body, HTTP 204)
```

### 4.11 404 for missing id

```bash
curl -k https://localhost:3000/api/movies/999 \
  -H "Authorization: Bearer $TOKEN"
# → { "error": "Movie not found" }   (HTTP 404)
```

### Tip: use Postman instead

If you prefer clicking over typing, use **Postman** (free). Import each endpoint as a request, put the token in an environment variable, and demo from there. Same results, nicer UI for the defense.

---

## 5. What each file does

- **`backend/package.json`** — lists npm dependencies. `npm install` reads this.
- **`backend/config.js`** — the JWT secret and the port. One place to change them.
- **`backend/db.js`** — opens SQLite, creates `movies` + `users` tables, seeds the admin user.
- **`backend/middleware/auth.js`** — Express middleware. Reads the `Authorization` header, verifies the JWT, and either calls `next()` or returns 401.
- **`backend/routes/auth.js`** — the login endpoint. Checks the bcrypt password hash and signs a JWT.
- **`backend/routes/movies.js`** — the 6 movie endpoints. Each validates its input and talks to SQLite.
- **`backend/server.js`** — puts it all together: JSON body parser, API routes, HTTPS server.

---

## 6. Node.js syntax cheat sheet (for the oral defense)

If you know Java, these are the JS patterns you'll see in this project.

### Imports & exports
```js
const express = require('express');          // like: import express.*;  (CommonJS)
module.exports = router;                      // like: public class X (makes it importable)
const { JWT_SECRET } = require('./config');   // destructuring: grab one field
```

### Functions
```js
function add(a, b) { return a + b; }          // regular function
const add = (a, b) => a + b;                  // arrow function (lambda)
const handler = (req, res) => { res.json({}); }; // arrow with block body
```

### Objects & destructuring
```js
const movie = { title: 'X', year: 2024 };
const { title, year } = movie;                // same as: const title = movie.title; const year = movie.year;
```

### Express patterns
```js
const router = express.Router();
router.get('/', (req, res) => { ... });        // GET /...
router.post('/', (req, res) => { ... });       // POST /...
router.get('/:id', (req, res) => {             // path param
  const id = req.params.id;                    // /movies/7 → '7'
});
router.get('/', (req, res) => {
  const status = req.query.status;             // ?status=...
  const auth   = req.headers['authorization']; // header (lowercase key)
  const body   = req.body;                     // JSON body
  res.status(201).json({ ok: true });
});
app.use('/api/movies', requireAuth, movieRoutes); // mount router behind middleware
```

### `req.params` / `req.query` / `req.body` / `req.headers` — the 4 places data comes in
- `req.params` → path params: `/movies/:id` → `req.params.id`
- `req.query` → querystring: `?status=watched` → `req.query.status`
- `req.body` → JSON body (only after `app.use(express.json())`)
- `req.headers` → request headers, always lowercase keys

### Middleware
A middleware is a function `(req, res, next) => { ... }`. It either:
- Calls `next()` → continue to the next middleware / handler
- Calls `res.status(...).json(...)` → respond and stop (do NOT call `next()`)

### SQLite via `better-sqlite3`
```js
db.prepare('SELECT * FROM movies WHERE id = ?').get(id);   // one row or undefined
db.prepare('SELECT * FROM movies').all();                  // array of rows
db.prepare('INSERT INTO movies (...) VALUES (?, ?, ?)').run(a, b, c); // → { lastInsertRowid, changes }
```
The `?` placeholders prevent SQL injection.

### Ternary
```js
condition ? valueIfTrue : valueIfFalse
req.body.watched ? 1 : 0
```
Same syntax as Java. Produces a value (unlike `if/else` which is a statement).

### Template literals
```js
const msg = `Listening on port ${PORT}`;       // same as: "Listening on port " + PORT
```
Backticks, not regular quotes.

---

## 7. Folder structure

```
InternetTechnologies/
├── backend/
│   ├── certs/             # self-signed HTTPS cert (generated, gitignored)
│   ├── middleware/
│   │   └── auth.js
│   ├── node_modules/      # downloaded libs (gitignored)
│   ├── routes/
│   │   ├── auth.js
│   │   └── movies.js
│   ├── config.js
│   ├── db.js
│   ├── data.db            # SQLite file (auto-created, gitignored)
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

---

## 8. Regenerating the HTTPS cert (if you ever need to)

```bash
cd backend
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem -out certs/cert.pem \
  -days 365 -subj "/CN=localhost"
```
