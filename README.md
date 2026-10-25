# English Speaking Practice Manager

A production-ready web application for organizing, managing, and tracking ChatGPT conversations used to practice spoken English with the **English Speaking Coach Prompt** (5-Minute B2 TED Talk & Echo Mode).

Built on the official **Sites-compatible Vinext starter** for **Cloudflare Workers** and **Cloudflare D1**.

---

## 1. Project Purpose & Scope

- **Primary Goal:** Manage conversation links, topics, statuses, and speaking-practice results (PassCount, FailCount, derived Score) generated during ChatGPT practice sessions.
- **Separation of Responsibilities:**
  - Speaking practice takes place directly inside ChatGPT.
  - The application manages links, tracks progress, and provides one-click access to unfinished sessions.
  - The app **does not** replace ChatGPT, make paid OpenAI API calls, or run server-side speech recognition.
  - Scores are derived purely from user-reported PassCount and FailCount counters.
- **English & Dark Mode Exclusively:**
  - Standard dark palette: `#212121` (Background), `#262626` (Cards/Dialogs), `#1A1A1A` (Inputs), `#ECECEC` (Primary Text), `#FFFFFF` (Primary Buttons).
  - Status Accents: Yellow (`PLANNED`), Blue (`IN_PROGRESS`), Green (`COMPLETED`), Red (`Destructive`).
  - No light mode toggle; zero flashes of light background.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS (v4) |
| Framework | Official Sites-compatible Vinext starter (`vinext`, `@openai/sites-vite-plugin`) |
| Backend | TypeScript API Route Handlers (Next.js App Router format) |
| Runtime | Cloudflare Workers Edge Runtime (`nodejs_compat`) |
| Database | Cloudflare D1 (SQLite-compatible) + Drizzle ORM |
| Validation | Zod |
| Unit Testing | Vitest (34 passing tests) |
| E2E Testing | Playwright (7 passing end-to-end tests) |
| Package Manager | npm |
| Deployment | ChatGPT Sites (`.openai/hosting.json`) |

---

## 3. Mathematical Scoring Engine

`Score = 10 × PassCount / (PassCount + FailCount)`

- PassCount & FailCount must be non-negative integers (`>= 0`).
- Rounding: Mathematically rounded to 1 decimal place (`Math.round(score * 10) / 10`).
- Zero denominator: When `PassCount + FailCount === 0` (no attempts recorded), the score evaluates to `null` and displays as `—` (distinguished from a `0.0/10` fail score).
- Verified Test Matrix:
  - 48 Pass, 12 Fail ➜ **8.0/10**
  - 50 Pass, 0 Fail ➜ **10.0/10**
  - 0 Pass, 10 Fail ➜ **0.0/10**
  - 7 Pass, 3 Fail ➜ **7.0/10**
  - 2 Pass, 1 Fail ➜ **6.7/10**
  - 0 Pass, 0 Fail ➜ **—** (Unavailable)

---

## 4. Key Application Pages

1. **Dashboard (`/`):**
   - High-level KPI cards: Total Sessions, Planned, In Progress, Completed, Average Score (completed), Total Pass attempts, Total Fail attempts.
   - Quick access to unfinished sessions (`PLANNED` or `IN_PROGRESS`) with prominent **Continue in ChatGPT** action.
   - Recent practice sessions summary.
   - Global actions: Add Session, View All Sessions, Copy Coach Prompt, Open ChatGPT.
2. **Sessions Library (`/sessions`):**
   - Responsive layout: Dynamic table on desktop, touch-friendly cards on mobile.
   - Real-time search by topic, notes, and tags.
   - Filter by status (`ALL`, `PLANNED`, `IN_PROGRESS`, `COMPLETED`).
   - Multi-field sorting: Recently Updated, Recently Created, Oldest Created, Topic A–Z, Topic Z–A, Highest Score, Lowest Score.
   - CRUD actions: Add, Edit, Delete (with confirmation dialog), Record Results, Copy Link, Open ChatGPT.
3. **Session Details (`/sessions/:id`):**
   - Dedicated view displaying topic, saved link, status, score metrics, pass/fail counters, accuracy %, notes, and timestamps (formatted in `Asia/Ho_Chi_Minh` ICT timezone).
   - Primary action for unfinished practice: **Continue in ChatGPT**.
4. **Coach Prompt (`/coach-prompt`):**
   - Displays authoritative 5-Minute B2 TED Talk & Echo Mode prompt verbatim in English and Vietnamese.
   - Copy Prompt button with instant feedback toast.
   - Direct link to open `https://chatgpt.com/`.
   - Local editable custom prompt version storage while preserving original as read-only default.
   - Available offline without requiring external network requests.
5. **Settings & Data Management (`/settings`):**
   - **JSON Export:** Download complete versioned JSON backup.
   - **CSV Export:** Download spreadsheet-compatible CSV protected against CSV formula injection.
   - **JSON Restore / Import:** Validate imported JSON, detect duplicate links, choose duplicate strategy (*Skip* vs. *Update/Overwrite*), with confirmation dialog.

---

## 5. Local Development on Windows 11

### Prerequisites
- **Node.js:** `v22.13.0` or higher (verified on Node `v24.19.0`).
- **npm:** `v10` or higher (verified on npm `11.6.1`).
- **Git**

### Installation & Setup

1. **Clone and enter the directory:**
   ```bash
   cd "English speaking manager"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate database schema:**
   ```bash
   npm run db:generate
   ```

4. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3200](http://localhost:3200) in your browser.

5. **One-click launcher (Windows):**
   Double-click `start-local.bat`.

---

## 6. Testing & Quality Assurance

### Unit Tests (Vitest)
Runs 34 tests covering URL validation, normalization, scoring math, zero-denominator rules, negative number rejection, timezone formatting, and prompt integrity:
```bash
npm test
```

### End-to-End Tests (Playwright)
Runs 7 critical workflow tests covering Dashboard, Sessions CRUD, duplicate URL rejection, score calculations, mobile viewport (390px iPhone), keyboard dialogs (Escape key), and JSON backup export/import:
```bash
npm run test:e2e
```

### TypeScript Type-Checking
Ensures 100% strict type safety:
```bash
npm run typecheck
```

### Production Build
Builds Cloudflare Worker client and server bundles:
```bash
npm run build
```

---

## 7. ChatGPT Sites Deployment Workflow

1. **Verify configuration in `.openai/hosting.json`:**
   ```json
   {
     "d1": "DB",
     "r2": null
   }
   ```
2. **Database binding:**
   The application uses Cloudflare D1 with binding name `DB` declared in `.openai/hosting.json` and `wrangler.jsonc`.
3. **Automatic migrations:**
   Database tables (`practice_sessions` and `custom_prompts`) and composite indexes (`user_normalized_url_idx`) automatically initialize on first connection via `lib/db-init.ts`, while versioned Drizzle migrations are stored in `./drizzle`.
4. **Deploy:**
   Build and deploy using ChatGPT Sites platform tooling.

---

## 8. License

Private personal application for English speaking practice. Free open-source local stack.
