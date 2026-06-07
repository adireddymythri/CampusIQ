# StudyHub

Production-style full-stack starter for **StudyHub** (AI-powered college learning platform).

## Folder structure

- `frontend/` — React + Vite + Tailwind v4 UI (dark glass theme)
- `backend/` — Node.js + Express + MongoDB (JWT auth, email verification, Cloudinary upload, Socket.IO)

## Run locally (recommended first run)

### 1) Backend

From `backend/`:

- Copy `backend/.env.example` to `backend/.env`
- Set **at least**:
  - `MONGODB_URI` (MongoDB Atlas recommended; local MongoDB also works)
  - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (required in production; optional in dev)

Then:

```bash
npm install
npm run dev
```

The server will start on the first free port in the range \(default `8090-8099`\). Hit `GET /health` to verify.

### 2) Frontend

From `frontend/`:

- Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to the backend URL.

Then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Current implemented modules

- **Frontend**: Landing page, login/signup UI, dashboard shell (sidebar + analytics cards) matching the premium dark glass theme.
- **Backend**:
  - `POST /api/auth/signup` (college email gating + email code)
  - `POST /api/auth/verify-email`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/notes/upload` (Cloudinary upload scaffold)
  - `POST /api/ai/summarize` (AI scaffold)
  - Socket.IO hello event

## Next steps

- Wire Google OAuth routes and frontend auth state.
- Implement Notes CRUD with search/filter/pagination + viewer endpoints.
- Add AI: PDF parsing + OpenAI summarization + quiz generation.
- Add remaining REST modules (discussions, quizzes, notifications, admin, analytics).

