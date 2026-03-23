# ELONODE System Architecture

Welcome to the architectural overview of **Elonode**, a real-time, high-octane competitive programming and coding duel platform.

Elonode is built with a decoupled architecture, leveraging a modern TypeScript frontend, a highly concurrent Go backend, and specialized microservices for code execution and problem fetching.

---

## 1. High-Level System Overview

- **User Entry:** Browser (`elonode.online`)
- **Authentication:** Clerk (JWT, Webhooks, Admin Roles)
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Go, Gin (REST), Gorilla/WebSocket (Real-time)
- **Database:** Supabase (PostgreSQL)
- **Code Execution Engine:** Judge0
- **Problem Data:** LeetCode GraphQL API
- **Deployment Infrastructure:** Vercel (Frontend) & Render (Go Backend)

---

## 2. Frontend Architecture (Next.js 14)

The frontend is built for low-latency interactions and a "Sci-Fi Esports" aesthetic.

### Key Modules:

- **Core Pages:** Home, Arena, Profile, Leaderboard, Contests, History, Docs, Admin Panel.
- **Duel Room (1v1):** \* Integrated **Monaco Editor** supporting 8 languages.
  - Features: 3-2-1 Countdown, Timer, Collapsible problem panel.
  - UX/UI safeguards: Leave warnings, Forfeit modals, 10-minute rejoin window, Confetti on victory.
- **Real-time UI & State:**
  - Custom WebSocket hooks & context providers.
  - Live online/offline badges, incoming challenge toast notifications.
  - Difficulty & mode selectors, Live Arena banner.
- **Profile & Dashboard:**
  - Rating charts powered by **Recharts**.
  - Activity heatmap, Win/loss mastery ring.
  - Recent skirmishes log, Badges, and Tier display.
- **3v3 ICPC Arena (New):**
  - Match configuration dashboard (Lobby params, target slugs, time allocation).
  - Team Faction Setup (Node assignments, Captain overrides).
  - Live Match Dashboard with Admin Override terminal and Real-time ICPC Leaderboard.

---

## 3. Backend Architecture (Go)

The backend handles heavy lifting, state management for duels, and complex ELO/ICPC calculations.

### REST API (20+ Routes)

- `GET` users, contests, stats, history, random problems.
- `POST` contests, finalize matches, update users.
- `DELETE` contests (Admin only).

### Real-Time WebSocket Hub (Gorilla)

Manages the entire lifecycle of a 1v1 duel:

- `join`, `online_users`, `leave`, `opponent_left`
- `challenge`, `challenge_response`
- `ready`, `ready_update`, `duel_start`
- `won`, `opponent_won`

### ICPC Evaluation Engine

- Strict implementation of ICPC rules for 3v3 matches.
- **Ranking Logic:** Primary metric is `Problems Solved` (Desc), Secondary is `Penalty Time` (Asc).
- **Penalty Calculation:** `Solved Minute + (20 mins * Wrong Submissions)`. Intelligently ignores Compilation Errors (`CE`).

### Custom Middleware & Security

- Strict CORS policies.
- Clerk JWT Verification.
- Admin role checking via Clerk public metadata.
- Graceful shutdown mechanisms.
- Database connection pooling.

---

## 4. External Integrations & Services

### Judge0 (Code Execution)

- Supported languages: Python3, JavaScript, TypeScript, C++, C, Java, Go, Rust.
- Custom **Auto Code Wrapper** (`codewrapper.ts`) to inject hidden test code.
- Checks `stdin`, `stdout`, and `stderr`.
- Includes built-in `TreeNode` and `ListNode` helpers for complex data structure problems.

### LeetCode GraphQL API (Problem Fetcher)

- Fetches: Slug, Title, Content, Difficulty, Starter code, Code snippets, Tags, Metadata, Examples.
- Dynamic Time Limits: Easy (15m), Medium (25m), Hard (45m).
- Contest-scoped problem caching to prevent rate-limiting.

---

## 5. Database Schema (Supabase / PostgreSQL)

**Core Tables:**

- `users`, `badges`, `user_badges`
- `contests`, `contests_played`
- `rating_history`, `leaderboard`
- `wins`, `losses`, `global_rank`

**3v3 ICPC Tables:**

- `team_contests`: Match parameters and state.
- `team_contest_teams`: Faction data (Team Alpha, Beta).
- `team_contest_members`: Maps users to teams and assigns Captain roles.
- `team_contest_problems`: Target problem slugs and positions.
- `team_contest_submissions`: Tracks timestamps, team IDs, and verdicts (AC, WA, TLE, RE, CE).

---

## 6. ELO Rating Engine & Tiers

The proprietary rating engine updates user ELO in `O(1)` time upon match completion.

**Calculation Logic:**

- `Beaten = Total - Rank`
- Percentile maps to Performance.
- `Change = (Performance - Old Rating) / 2`
- `New Rating = Old Rating + Change`

**Rating Tiers:**

1.  **Newbie:** `< 1100`
2.  **Apprentice:** `1100 - 1149`
3.  **Specialist:** `1150 - 1199`
4.  **Expert:** `1200 - 1399`
5.  **Master:** `1400 - 1799`
6.  **Grandmaster:** `1800+`
7.  **O(1) Algo:** Top elite tier.
