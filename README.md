# Motion Lite (Google Calendar + Auto-scheduler)

A zero-cost, no-LLM personal scheduler: add tasks, fetch your Google Calendar free/busy, auto-pack tasks into free slots, and create events.

## Features
- Next.js App Router
- Google OAuth via NextAuth (scopes: Calendar read/write)
- Free/Busy fetch and event creation (`/api/gcal/...`)
- Rule-based scheduler (urgency × priority × effort)
- Prisma + SQLite (ready, though MVP keeps data in-memory on UI for simplicity)
- Codespaces-ready devcontainer

## One-time Setup (Google)
1. Go to https://console.cloud.google.com/ → Create a project
2. Enable **Google Calendar API**
3. OAuth consent screen: External → Add your Gmail as a test user
4. Create OAuth client: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - If deploying to Vercel, add: `https://<your-vercel-domain>/api/auth/callback/google`
5. Copy **Client ID** and **Client Secret**

## Local (or Codespaces) Setup
1. **Clone in Codespaces** (recommended) or locally:
   ```bash
   npm install
   cp .env.example .env.local
   # set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / NEXTAUTH_SECRET
   npx prisma generate
   npm run dev
   ```
2. Open `http://localhost:3000`
3. **Sign in** (header → Sign in) with Google.
4. Set a time range and click **Fetch Free/Busy**, add tasks, then **Pack into Free Windows**, then **Create Calendar Events**.

## Deploy (Vercel)
- Import the repo in Vercel
- Set ENV vars from `.env.example` (including NEXTAUTH_URL to your prod URL)
- Deploy

## Notes
- This MVP stores tasks client-side; Prisma schema is included for expansion (persistent tasks).
- The scheduler is deterministic and explainable. You can tune weights in `lib/scheduler.ts`.
- No LLMs or paid APIs used.

## Security
- Only your browser session has your tokens; server creates events via Google APIs using those tokens.
- For production, consider database session storage and CSRF hardening per NextAuth docs.
