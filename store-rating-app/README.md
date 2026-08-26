# Store Rating Platform — FullStack Intern Coding Challenge

A full-stack web app where users rate stores (1–5), with three roles:
**System Administrator**, **Normal User**, and **Store Owner**, all sharing
a single login system.

**Stack:** Express.js · PostgreSQL (Sequelize ORM) · React

---

## Project structure

```
store-rating-app/
├── backend/
│   ├── config/db.js            Sequelize/Postgres connection
│   ├── models/                 User, Store, Rating + associations
│   ├── controllers/            auth, admin, user, storeOwner
│   ├── middleware/auth.js      JWT auth + role-based authorization
│   ├── routes/                 /api/auth, /api/admin, /api/stores, /api/store-owner
│   ├── seeders/seedAdmin.js    creates the first Admin account
│   ├── server.js               app entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.js       axios instance w/ JWT interceptor
    │   ├── context/AuthContext.js
    │   ├── components/         Navbar, StarRating, ProtectedRoute
    │   └── pages/               Login, Signup, per-role dashboards
    └── .env.example
```

## Data model

- **User**: name (20–60 chars), email (unique), password (hashed), address (≤400 chars), role (`ADMIN` / `NORMAL_USER` / `STORE_OWNER`)
- **Store**: name, email (unique), address, `owner_id` → User (nullable, for `STORE_OWNER` accounts)
- **Rating**: `value` (1–5), `user_id`, `store_id` — unique on `(user_id, store_id)` so a re-submission **updates** the existing rating rather than creating a duplicate (this is how "modify a submitted rating" is implemented).

Password rule (enforced both client- and server-side): 8–16 characters, at least one uppercase letter, at least one special character.

## Setup

### 1. Database
Create a PostgreSQL database:
```bash
createdb store_rating_db
```

### 2. Backend
```bash
cd backend
cp .env.example .env      # edit DB credentials + JWT_SECRET
npm install
npm run seed               # creates the first Admin (see .env for credentials)
npm run dev                 # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env       # point REACT_APP_API_URL at your backend
npm install
npm start                   # starts on http://localhost:3000
```

### Default admin login (from `npm run seed`)
- Email: `admin@storerating.com`
- Password: `Admin@1234`

(Change these in `backend/.env` before seeding, or update the password after logging in.)

## How each role works

- **Normal User** — signs up at `/signup`, browses/searches stores by name or address at `/stores`, clicks stars to submit or change a rating, and can update their password.
- **Store Owner** — created by an Admin (via "Add store" → "Also create a Store Owner account"), logs in and lands on `/store-owner`, seeing their average rating and the list of users who rated them.
- **Admin** — logs in and lands on `/admin`: dashboard stats, `/admin/users` (create admins/users, filter by name/email/address/role, sort columns, view details), `/admin/stores` (create stores with an optional owner account, filter, sort by rating).

## Notes on design choices

- A **single JWT-based login** (`POST /api/auth/login`) is used for all three roles; the token's `role` claim drives route protection on both backend (`authorize()` middleware) and frontend (`ProtectedRoute`).
- Store Owners don't get a public signup form — they're provisioned by an Admin alongside their store, since a store needs to exist for them to "own." Admin accounts are also created by an existing Admin (via `/admin/users`), not through public signup.
- All list/filter/sort endpoints run server-side so results, in principle, scale beyond what's convenient to sort client-side.
