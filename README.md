# Unicode

A production-grade online code evaluation platform built to handle 10,000 concurrent users submitting code simultaneously during timed contests. This project implements the core system design principles of platforms like LeetCode — async execution pipelines, message queue buffering, Docker-sandboxed code execution, and real-time leaderboards backed by Redis sorted sets.

### What this handles

- **10k concurrent submissions** - the API never blocks. Submissions queue in BullMQ and workers drain at their own pace
- **Untrusted code execution** - every test case runs in a fresh, locked-down Docker container (`--cap-drop=ALL`, `--network=none`, `--read-only`)
- **Real-time contest leaderboards** - Redis sorted sets maintain rankings at insert time, no SQL sorts needed
- **Async result delivery** - clients poll for results instead of holding open WebSocket connections
- **Composite scoring** - points + time + penalties packed into a single ZSET score using a big multiplier formula
- **Fail-safe worker isolation** - leaderboard failures never corrupt submission status, zombie containers cleaned on startup

## How it works

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Client    │───▶│   Problems Service   │────▶│  Message    │────▶│ Code Execution  │
│  (Browser)  │     │   (Express + TS)     │     │   Queue     │     │    Workers      │
└─────────────┘     └──────────────────────┘     │ (BullMQ)    │     │ (Docker Sandbox)│
                                                  └─────────────┘     └─────────────────┘
                                                           │                    │
                                                           ▼                    ▼
                                                  ┌─────────────┐     ┌─────────────────┐
                                                  │   Redis     │     │   PostgreSQL    │
                                                  │  (Queue +   │     │   (Problems &   │
                                                  │  Leaderboard) │     │   Submissions)  │
                                                  └─────────────┘     └─────────────────┘
```

A submission comes in → gets queued in BullMQ → worker picks it up → runs each test case in a fresh Docker container → writes result back to Postgres. If the problem belongs to an active contest, the worker updates the Redis leaderboard automatically. The API returns a `submissionId` immediately and the client polls for the result.

### Stack

- **API**: Express 5, TypeScript
- **Database**: PostgreSQL + Prisma v7
- **Queue**: Redis + BullMQ
- **Sandbox**: Docker (one container per test case execution)
- **Leaderboard**: Redis Sorted Sets (ZSET) with pipeline-optimized reads
- **Logging**: Pino

### Sandbox isolation

Each submission runs in an ephemeral container that gets deleted right after. Constraints per container:

- `--cpus=0.5` / `--memory=512M` — resource caps
- `--cap-drop=ALL` — no Linux capabilities
- `--network=none` — no network access at all
- `--read-only --tmpfs /tmp` — read-only filesystem
- `--user <host-uid>:<host-gid>` — matches host UID so bind-mount writes work without giving the container any additional host permissions

## Setup

### Prerequisites

- Node.js 20+
- pnpm
- Docker + Docker Compose

### Running locally

```bash
# Install dependencies
pnpm install

# Start Postgres + Redis
docker compose up -d

# Environment variables
cp .env.example .env

# Migrate DB and seed problems + contest
npx prisma migrate dev
npx prisma generate
pnpm seed:problems

# Terminal 1 — API server
pnpm dev

# Terminal 2 — execution worker
pnpm worker
```

## API

### Problems

```bash
# List all problems
curl http://localhost:3000/api/problems

# Get specific problem
curl http://localhost:3000/api/problems/1
```

### Submit solution

Returns immediately with a `submissionId`. Execution happens in the background.

```bash
curl -X POST http://localhost:3000/api/problems/1/submission \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import sys\nprint(sys.stdin.read().strip())",
    "language": "python",
    "userId": "user_1"
  }'
```

```json
{
  "success": true,
  "data": {
    "submissionId": 1,
    "status": "PENDING"
  }
}
```

### Poll for results

```bash
curl http://localhost:3000/api/submissions/1/status
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ACCEPTED",
    "results": [
      {
        "testCaseId": 1,
        "status": "ACCEPTED",
        "executionTime": 245,
        "output": "[0, 1]"
      }
    ],
    "totalTests": 4,
    "passedTests": 4
  }
}
```

Possible statuses: `PENDING` → `RUNNING` → `ACCEPTED` / `WRONG_ANSWER` / `TIMEOUT` / `RUNTIME_ERROR` / `COMPILATION_ERROR`

### Contests

```bash
# List all contests
curl http://localhost:3000/api/contests

# Get contest details with its problems
curl http://localhost:3000/api/contests/weekly-contest-1

# Create a new contest
curl -X POST http://localhost:3000/api/contests \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Contest 2",
    "slug": "weekly-contest-2",
    "description": "4 problems, 2 hours",
    "startTime": "2026-05-25T10:00:00Z",
    "endTime": "2026-05-25T12:00:00Z",
    "isActive": true
  }'

# Add a problem to a contest
curl -X POST http://localhost:3000/api/contests/1/problems \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": 1,
    "points": 500,
    "order": 1
  }'
```

### Leaderboard

```bash
# Get top 50 rankings for a contest
curl http://localhost:3000/api/contests/1/leaderboard

# Custom limit (max 50)
curl http://localhost:3000/api/contests/1/leaderboard?limit=10
```

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "user_1",
      "points": 1500,
      "effectiveTime": 45,
      "solvedCount": 2,
      "solvedProblems": [
        { "title": "Two Sum", "slug": "two-sum" },
        { "title": "Longest Substring...", "slug": "longest-substring-without-repeating-characters" }
      ]
    },
    {
      "rank": 2,
      "userId": "user_2",
      "points": 1000,
      "effectiveTime": 55,
      "solvedCount": 1,
      "solvedProblems": [
        { "title": "Longest Substring...", "slug": "longest-substring-without-repeating-characters" }
      ]
    }
  ]
}
```

## Contests & Scoring

Each contest has a fixed time window and a set of problems with assigned point values. When a user submits code for a problem that belongs to an active contest, the system automatically tracks their progress and updates the leaderboard.

### Scoring model

Rankings are based on three factors:

| Factor | Purpose |
|--------|---------|
| **Points** | Primary sort — harder problems worth more |
| **Finish time** | Tie-breaker — who solved faster |
| **Penalties** | Each wrong submission adds 5 minutes |

```
User solves:
- Problem A (500 pts) at min 10, 0 wrong attempts
- Problem B (1000 pts) at min 35, 2 wrong attempts → penalty: 10 min
Total: 1500 points, effective time: 35 + 10 = 45 min
```

### How the leaderboard stays fast

SQL would need to scan, group, and sort thousands of rows on every request. Instead, Unicode uses Redis sorted sets (ZSET), which maintain sorted order automatically at insert time. Getting the top 50 is a single range read operation — no sorting, no joins, no full table scans.

Each user's cumulative data (total points, last solved time, total penalties, solved problems) is stored in a Redis hash. When a submission is accepted, the composite score is recalculated from these totals and `ZADD` updates their position in the leaderboard. Fetching the leaderboard uses a Redis pipeline to batch all user lookups into one round trip.

## Design decisions

**Why async + polling instead of WebSockets** — the API just enqueues and returns. No persistent connections, no blocking. Workers pull at their own pace. Easier to scale both sides independently.

**Why a queue** — decouples submission volume from execution capacity. A burst of submissions during a contest? They queue up, workers drain at whatever rate they can handle without any of it hitting the API layer.

**Why a fresh container per test case** — no state leaks between runs. Malicious code from test case 1 can't affect test case 2. Each container starts clean and gets deleted with `--rm`.

**Why Redis ZSET for leaderboard** — sorted sets keep rankings ordered at insert time using a skip list internally. `ZREVRANGE 0 49` returns the top 50 in O(log n + 50) instead of O(n log n) for a SQL sort. The data is ephemeral anyway - it only matters during the contest - so in-memory storage is the right fit.

**Why composite score encoding** — Redis ZSET only accepts one numeric score per member. I packed points + time into a single number using a big multiplier: `score = (points * 1_000_000) - effectiveTime`. Higher points dominate, lower time breaks ties. Decoding uses `Math.ceil` to reverse the operation cleanly.
