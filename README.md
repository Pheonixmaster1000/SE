# Auction Hub

Role-based online auction demo: **buyer**, **seller**, **admin**, and **support**, with a **Node.js (Express)** API, **session authentication**, **bcrypt** password hashes, **Joi** request validation, **in-memory caching** over JSON files, and a **vanilla JS** frontend.

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env — set SESSION_SECRET (required for production)
npm run seed
npm start
```

Open `http://localhost:3000`.

### Seeded credentials

| User      | Password                                      |
|-----------|-----------------------------------------------|
| `buyer1`  | `Auction123!` (or `SEED_PASSWORD` if set)     |
| `seller1` | same as buyer1                                |
| `admin`   | `admin`                                       |
| `support` | `support`                                     |

## Architecture

```
├── server.js              # HTTP server, middleware, route mounting
├── lib/
│   ├── config.js          # dotenv + SESSION_SECRET checks
│   ├── db.js              # Atomic JSON writes + write queue (race-safe)
│   ├── cache.js           # In-memory snapshot cache (invalidated on write)
│   ├── store.js           # Users / bcrypt / createUser
│   ├── bidding.js         # Pure bid rules (unit-tested)
│   ├── stockImages.js     # Keyword + hash-based stock image mapping
│   ├── imageUrl.js        # URL validation + resolved image for API
│   ├── validation.js      # Joi schemas + validateBody middleware
│   ├── scheduler.js       # Interval job to end past-due auctions
│   └── logger.js          # Structured-style logging helpers
├── middleware/            # asyncHandler, errorHandler, rate limits
├── routes/                # auth, auctions, tickets, admin
├── data/                  # users.json, auctions.json, tickets.json (gitignored in real deploy)
├── public/                # static UI + js/core (api, toast)
└── tests/                 # node:test — bidding + auth
```

### Data layer

- **Atomic writes**: write to `*.tmp` then rename (see `lib/db.js`).
- **Concurrency**: a **promise chain** serializes `writeJsonSafe` so concurrent requests do not interleave reads/writes.
- **Cache**: after each successful write, the affected file’s cache key is cleared so the next read reloads from disk.

### Security notes

- Set a long random **`SESSION_SECRET`** in `.env`; production startup **fails** if it is missing or too short.
- **Rate limits** apply to login, registration, bidding, and global `/api` traffic.
- Passwords are **never** stored in plain text; only **bcrypt** hashes in `users.json`.

## Scripts

| Command        | Description                              |
|----------------|------------------------------------------|
| `npm start`    | Run the server                           |
| `npm run seed` | Reset `data/*.json` with demo accounts   |
| `npm test`     | Run unit tests (`node --test`)           |

## Environment variables

See `.env.example` for `PORT`, `SESSION_SECRET`, optional `SEED_PASSWORD`, and `AUCTION_CLOSE_INTERVAL_MS`.

## API errors

JSON error bodies look like `{ "error": "message", "code": "SOME_CODE" }`. The UI shows **toast notifications** for many failures instead of silent `alert()`s.

## License

Educational / demo project.
