# 🦄 UNICODE: Project Master Plan & System Architecture

**Project Name:** Unicode (LeetCode Clone)
**User:** @aakamshpm
**Date:** 2025-11-21
**Status:** Phase 1 (Initialization) Complete

---

## 🤖 AI Assistant Instructions
**Role:** You are the Lead System Architect and Senior Full-Stack Developer for "Unicode".
**Objective:** Build a production-grade, scalable, and secure competitive programming platform.
**Constraint:** Do NOT use "code-first" guessing. Always reference this architecture plan. If a step involves a complex system design choice (like the execution engine), explain the "WHY" before generating code.

---

## 1. 📚 References & Core Resources
- **Primary Architecture Source:** [System Design School: LeetCode Architecture](https://systemdesignschool.io/problems/leetcode/solution)
- **Repository Structure:** Monorepo (NestJS Backend + React/Vite Frontend)
- **Infrastructure:** Docker-based execution, AWS (future deployment).

---

## 2. 🏗️ System Architecture

### High-Level Data Flow
1.  **Client (React)** sends code submission → **API Gateway (NestJS)**
2.  **API** validates auth & input → Pushes job to **RabbitMQ** (Queue: `submission_queue`)
3.  **Worker Service** (Node.js) consumes job → Spins up **Docker Container**
4.  **Docker Container** executes code against **Hidden Test Cases** (secure sandbox)
5.  **Worker** captures `stdout`/`stderr` → Updates **Redis** & **Postgres**
6.  **API** pushes result to Client via **WebSocket**

### Technology Stack
-   **Backend:** NestJS (Node.js), TypeScript, TypeORM
-   **Frontend:** React, Vite, TypeScript, Monaco Editor, TailwindCSS
-   **Database:** PostgreSQL (Primary Data), Redis (Cache, Leaderboards, Pub/Sub)
-   **Message Queue:** RabbitMQ (Asynchronous Job Processing)
-   **Infrastructure:** Docker Compose (Dev), Docker (Sandboxing)
-   **Auth:** OAuth 2.0 (Google/GitHub) + JWT

---

## 3. 🗄️ Database Schema (PostgreSQL)

The AI Assistant must implement these entities strictly using TypeORM.

### A. Users (`users`)
-   `id`: UUID (PK)
-   `email`: String (Unique)
-   `username`: String (Unique)
-   `oauth_provider`: String ('google', 'github')
-   `stats`: JSONB (Use denormalized columns for `easy_solved`, `medium_solved`, `hard_solved`)

### B. Problems (`problems`)
-   `id`: UUID (PK)
-   `slug`: String (Unique URL friendly)
-   `title`: String
-   `description`: Text (Markdown)
-   `difficulty`: Enum ('easy', 'medium', 'hard')
-   `templates`: JSONB (Starter code for each language)
-   `constraints`: Text

### C. Test Cases (`test_cases`)
-   `id`: UUID (PK)
-   `problem_id`: UUID (FK)
-   `input`: Text (JSON)
-   `expected_output`: Text (JSON)
-   `is_hidden`: Boolean (False = Example case, True = Evaluation case)

### D. Submissions (`submissions`)
-   `id`: UUID (PK)
-   `user_id`: UUID (FK)
-   `problem_id`: UUID (FK)
-   `code`: Text
-   `language`: Enum ('python', 'javascript', 'c')
-   `status`: Enum ('pending', 'running', 'accepted', 'wrong_answer', 'tle', 're')
-   `runtime_ms`: Integer
-   `memory_kb`: Integer

### E. Contests (`contests`)
-   `id`: UUID (PK)
-   `start_time`: Timestamp
-   `duration_min`: Integer
-   `problems`: Many-to-Many relation with Problems table

---

## 4. 🚀 Implementation Phases (Your Roadmap)

### ✅ Phase 1: Project Initialization (COMPLETED)
-   Monorepo created (`backend`, `frontend`).
-   Dependencies installed.

### 🚧 Phase 2: Backend Configuration (START HERE)
**Goal:** Connect NestJS to Postgres, Redis, and RabbitMQ.
1.  **Docker Compose:** Ensure `postgres`, `redis`, `rabbitmq` services are defined in root `docker-compose.yml`.
2.  **Env Config:** Setup `@nestjs/config` and validate `.env` variables.
3.  **Database:** Configure `TypeOrmModule` in `app.module.ts`.
4.  **Health Check:** Create a test endpoint to verify connectivity to all 3 services.

### ⏳ Phase 3: Authentication & Users
**Goal:** Secure the platform.
1.  Implement **OAuth 2.0** (Passport.js with Google/GitHub strategies).
2.  Create `UsersModule` to save user profiles on first login.
3.  Implement **JWT Guards** to protect private routes.

### ⏳ Phase 4: Problem Management (CRUD)
**Goal:** Admins can add problems, Users can view them.
1.  Create `ProblemsModule`.
2.  Seed database with 5 dummy LeetCode problems (Two Sum, Reverse Integer, etc.).
3.  Create API: `GET /problems`, `GET /problems/:slug`.

### ⏳ Phase 5: The Execution Engine (CRITICAL)
**Goal:** Securely run user code.
1.  **Submission Flow:**
    -   `POST /submissions` -> Saves to DB (Status: PENDING) -> Pushes to RabbitMQ.
2.  **Worker Service:**
    -   Create a dedicated Consumer that listens to RabbitMQ.
    -   **Docker Sandbox Strategy:**
        -   Use `dockerode` or raw `child_process.exec` to spawn ephemeral containers.
        -   Mount code as volume or pass via stdin.
        -   Set limits: `--memory 256m --cpus 0.5 --network none`.
3.  **Result Handling:** Update DB with Pass/Fail/Error.

### ⏳ Phase 6: Frontend & Real-time
**Goal:** Connect React to Backend.
1.  **Monaco Editor:** Integrate into React.
2.  **Submission UI:** Show "Pending..." -> "Accepted" using Polling or WebSockets.
3.  **Problems List:** Fetch and display from API.

---

## 5. ⚠️ Critical Development Rules for AI

1.  **Security First:** Never allow user code to run directly on the host machine. ALWAYS use Docker isolation.
2.  **Strict Typing:** Use TypeScript Interfaces/DTOs for everything. No `any`.
3.  **Configuration:** Do not hardcode secrets. Use `ConfigService`.
4.  **Validation:** Use `class-validator` on all API inputs.
5.  **Error Handling:** Wrap critical logic in try/catch and use proper HTTP exceptions.

---