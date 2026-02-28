# Contest Rating System

A complete competitive rating engine — percentile-based, transparent, and scalable.

---

## Architecture

```
frontend/          Next.js (TypeScript)  — /profile/[userId] page
backend/           Go (Gin) REST API
  main.go
  models/          GORM models
  rating/          Pure rating engine (zero dependencies)
  handlers/        HTTP handlers
  schema.sql       PostgreSQL DDL
  docker-compose.yml
```

---

## Rating Algorithm

| Step | Formula |
|------|---------|
| 1 | `Beaten = TotalParticipants − Rank` |
| 2 | `Percentile = Beaten / TotalParticipants` |
| 3 | Lookup percentile bracket → Standard Performance Rating |
| 4 | `RatingChange = (Performance − OldRating) / 2` |
| 5 | `NewRating = OldRating + RatingChange` |
| 6 | Derive Tier from NewRating |

### Percentile → Performance Brackets

| Percentile | Performance |
|-----------|------------|
| Top 1%    | 1800       |
| Top 5%    | 1400       |
| Top 10%   | 1200       |
| Top 20%   | 1150       |
| Top 30%   | 1100       |
| Top 50%   | 1000       |
| Below 50% | 900        |

### Tier Thresholds

| Tier        | Rating     | Color  |
|------------|-----------|--------|
| Newbie      | < 1100    | Gray   |
| Apprentice  | 1100–1149 | Green  |
| Specialist  | 1150–1199 | Blue   |
| Expert      | 1200–1399 | Purple |
| Master      | 1400–1799 | Gold   |
| Grandmaster | 1800+     | Red    |

---

## Quick Start (Docker)

```bash
cd backend
docker compose up --build
```

API will be at `http://localhost:8080`.

---

## API Endpoints

### Create User
```
POST /api/users
{ "name": "Alice" }
```

### Create Contest
```
POST /api/contests
{ "name": "Weekly 001", "date": "2025-06-01T12:00:00Z" }
```

### Finalize Contest (triggers rating updates)
```
POST /api/contests/:id/finalize
[
  { "user_id": "uuid-a", "rank": 1 },
  { "user_id": "uuid-b", "rank": 2 }
]
```

### Get User Profile
```
GET /api/users/:id
```

### Get Rating History
```
GET /api/users/:id/history
```

---

## Running Tests

```bash
cd backend
go test ./rating/...
```

---

## Frontend (Next.js)

The `contest-rating-frontend.jsx` artifact is a ready-to-use React component.

For the full Next.js page, create `pages/profile/[userId].tsx` and wire it to `GET /api/users/:id` and `GET /api/users/:id/history`.

```tsx
// pages/profile/[userId].tsx
export async function getServerSideProps({ params }) {
  const [user, history] = await Promise.all([
    fetch(`${API}/api/users/${params.userId}`).then(r => r.json()),
    fetch(`${API}/api/users/${params.userId}/history`).then(r => r.json()),
  ]);
  return { props: { user, history } };
}
```
