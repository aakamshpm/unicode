# Unicode

An online code evaluation platform — submit code, run it against test cases in isolated Docker containers, get a verdict. Built with a queue-based execution pipeline so the API never blocks waiting for code to finish running.

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
                                                  │  (Queue)    │     │   (Problems &   │
                                                  └─────────────┘     │   Submissions)  │
                                                                      └─────────────────┘
```

Submission comes in → gets queued in BullMQ → worker picks it up → runs each test case in a fresh Docker container → writes result back to Postgres. The API returns a `submissionId` immediately and the client polls for the result.

### Stack

- **API**: Express 5, TypeScript
- **Database**: PostgreSQL + Prisma v7
- **Queue**: Redis + BullMQ
- **Sandbox**: Docker (one container per test case execution)
- **Logging**: Pino

### Sandbox isolation

Each submission runs in an ephemeral container that gets deleted right after. The constraints per container:

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

# Migrate DB and seed problems
npx prisma migrate dev
npx prisma generate
pnpm seed:problems

# Terminal 1 — API server
pnpm dev

# Terminal 2 — execution worker
pnpm worker
```

## API

### List problems

```bash
curl http://localhost:3000/api/problems

# specific problem
curl http://localhost:3000/api/problems/1
```

### Submit solution

Returns immediately with a `submissionId`. Execution happens in the background.

```bash
curl -X POST http://localhost:3000/api/problems/1/submission \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import sys\nprint(sys.stdin.read().strip())",
    "language": "python"
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

### Poll for result

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

Possible statuses: `PENDING` → `RUNNING` → `ACCEPTED` / `WRONG_ANSWER` / `TIMEOUT` / `RUNTIME_ERROR`

## Design decisions

**Why async + polling instead of WebSockets** — the API just enqueues and returns. No persistent connections, no blocking. Workers pull at their own pace. Easier to scale both sides independently.

**Why a queue** — decouples submission volume from execution capacity. Burst of submissions during a contest? They queue up, workers drain at whatever rate they can handle without any of it hitting the API layer.

**Why a fresh container per test case** — no state leaks between runs. Malicious code in test case 1 can't affect test case 2. Each container starts clean and gets deleted with `--rm`.
