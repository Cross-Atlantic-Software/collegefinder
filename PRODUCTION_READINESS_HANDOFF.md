# UniTracko — One-Click Form Filling: Production-Readiness Handoff

**Repo:** `Cross-Atlantic-Software/collegefinder` · **Branch:** `feature/one-click-form-filling`
**Status at handoff:** Both client features delivered and live-verified on the Pearl Academy form; demo flow works end-to-end. **Not yet production-ready** — the gaps are operational/onboarding plumbing and a few build/correctness issues, not the features themselves. This doc lists exactly what stands between "works on the original dev machine" and "shippable," in priority order.

---

## 0. First question answered: "Why can't I see the adapters?"

**Adapters are not in git. They are rows in Postgres.** Everything in the working demo — Pearl, UPES, Bennett, NATA, SRM, KIITEE — lives only in the original developer's **local Docker Postgres**. None of it was seeded or committed. A fresh checkout gets all the *code* and **none of the data**, so the Form Adapters list shows only whatever that DB happens to contain (e.g. a lone SSC CGL draft).

Adapter data lives across four tables:

| Table | Holds | Role |
|---|---|---|
| `exam_adapters` | The JSON field-mapping the extension uses | Form-filling logic |
| `exams_taxonomies` | Exam identity (name, code) | Dashboard listing |
| `exam_eligibility_criteria` | Eligibility row | Required for dashboard visibility |
| `exam_dates` | Application window (start/close) | Required for the Apply button to activate |

This is itself a production problem (see §3.1): **there is no reproducible source of truth for adapter data.** For production you do *not* copy the dev demo data over — it's demo-shaped (test profile `sharmaharsh634@gmail.com` woven through, hand-built fixtures). Production adapters get created in the production environment via the extension's AI Builder, or via a proper seed/import path that does not yet exist.

### To get a working environment *for inspection only*

If you just need to run the app and see the existing work while you assess it, export the demo data from the original dev DB and load it into yours. **This is demo data for review, not a production seed.**

```bash
# On the dev machine that has the data — export the four tables
docker compose exec postgres pg_dump -U postgres -d collegefinder_db \
  -t exam_adapters -t exams_taxonomies -t exam_eligibility_criteria -t exam_dates \
  --data-only --column-inserts > adapters_dump.sql

# On your machine — load it
docker compose exec -T postgres psql -U postgres -d collegefinder_db < adapters_dump.sql

# Verify it landed
docker compose exec postgres psql -U postgres -d collegefinder_db \
  -c "SELECT exam_id, version, approval_status, status FROM exam_adapters;"
```

---

## 1. What is DONE and verified (do not re-do)

**Both client requests are complete, committed, and tested live on Pearl.**

| Commit | What it delivers |
|---|---|
| `6b45d5f` | **Client A** — unmapped portal fields surfaced in admin validation review. During an admin validation run, fields present on the form but absent from the adapter are listed for review with map / add-new-field / leave-blank controls. |
| `a2f0fd0` | **Client B** — manual-only fields flagged to students. CAPTCHA/OTP/photo/signature/upload fields show in the student panel under "Complete these yourself" with a count, so the student knows what to finish by hand. |
| `0770d42` | **Bug fix** — `leave_blank` fields with an unapproved/`null` source were being silently dropped on save (`sanitizeField` discarded any field whose source failed validation *before* the `leave_blank` flag was applied). Now preserved. |
| `2ab942c` | **Bug fix** — the `taxonomy_exam_id` migration on `automation_applications` existed on disk but was never registered in the migration run-list (lost in the `main` merge). Registering it fixed the dashboard "Apply" 500 error. |

The two features connect by design: a field an admin flags as leave-blank (Client A) flows through to the student as a "do this yourself" item (Client B).

**Prior session (already on the branch):** the full `main` merge (credit system integrated, 7 conflicts resolved — commits `b062398`, `4661c36`, `3aa700e`), plus publish-toggle and adapter-draft-load fixes (`cb8f709`, `d706438`).

---

## 2. PRODUCTION BLOCKERS (hard gates — cannot ship until cleared)

### 2.1 Production `next build` is broken
The credit-module TypeScript errors introduced by the `main` merge (`api/admin/credits`, `UtCreditsWallet`, `Applications`) fail a production build. The **dev server tolerates them; a prod build will not.** This is the first thing to fix because nothing ships until `next build` is clean.
- **Action:** run `npm run build` at repo root, resolve the credit-module type errors. They are pre-existing from the merge, not from this session's work.

### 2.2 "Register New Exam" does not create catalog rows (the most important onboarding gap)
Registering an exam creates only the `exam_adapters` row — **not** `exams_taxonomies` + `exam_eligibility_criteria` + `exam_dates`. Consequences, both proven during testing:
- A newly-registered exam **does not appear on the student dashboard** (needs an `exams_taxonomies` row + an `exam_eligibility_criteria` row).
- Even if it appears, its **Apply button stays disabled** ("Apply Soon") until an `exam_dates` row with an open application window exists.

**In production this means no admin can onboard a new exam end-to-end through the UI** — every new exam requires a developer running SQL by hand. This is the single biggest barrier to the product being self-serviceable.
- **Action:** extend the "Register New Exam" handler to create the catalog row, eligibility row, and an `exam_dates` row alongside the adapter, in one step. Until this is done the product is not operable by non-developers.

### 2.3 Razorpay has never been tested against live keys
The credit/payment system is integrated but only ever exercised with a SQL-seeded wallet — **no real gateway transaction has ever run.** The standard for payment code is that a real transaction is the test, not a clean boot.
- **Action:** configure live Razorpay keys, run a real end-to-end payment (purchase → credit ledger write → receipt), and verify the ledger row, GST receipt, and reversal/refund paths against the real gateway.

### 2.4 `deleteSection` will throw in production (works only locally by accident)
In `examfill-extension/background/background.js`, `deleteSection` calls a bare `${API_BASE}` constant. `API_BASE` only exists in the **skip-worktree'd/stashed localhost line** that is deliberately kept out of commits — so it is `undefined` in committed code and the function throws in any non-local environment. It *appears* to work locally only because the stashed localhost line is present on the dev machine.
- **Action:** change `deleteSection` to resolve the base via `await apiBase()` like the rest of the file. Small, but it is a real production crash. **Note:** `background.js` is skip-worktree'd and handled manually (see §6) — coordinate this edit carefully.

---

## 3. PRODUCTION-CRITICAL CORRECTNESS BUGS (will mis-behave on real applications)

### 3.1 No reproducible adapter data / no seed
Adapters exist only as hand-created rows in individual dev databases. There is no seed file, migration, or fixture that recreates them, and no import path in the admin UI. For production this means adapter creation is entirely manual and per-environment.
- **Action:** decide the production model — either (a) adapters are built in the production environment via the AI Builder workflow and that is documented as the process, or (b) build a proper seed/import mechanism so adapter configuration is reproducible and versioned. Option (b) is strongly preferred for a maintainable production system.

### 3.2 Country/nationality substring mis-fill ("British Indian Ocean Territory" bug)
On `<select>` fields, the fill matches an option by text containing the profile value as a **substring**. Profile value "India" matches the option "British Indian Ocean Territory [+246]" because it contains "India." This was observed live during demo prep — country code filled with the wrong territory. (Same family as the historic "SharmaIndian" last-name concatenation bug on UPES.)
- **Action:** tighten select-option matching to exact / value-based match rather than substring. Affects any country/nationality/state dropdown on real student applications.

### 3.3 Un-tick-leave-blank → `null`-source fill error
When a field that was only ever a leave-blank field (no real source) has its leave-blank flag **removed**, the filler tries to resolve a `null` source and errors ("No data in profile for 'null'"). Found during demo prep.
- **Action:** when leave-blank is unticked, either require a source before saving or skip the field cleanly — do not attempt to fill from a null source.

---

## 4. MIGRATIONS & DEPLOYMENT INTEGRITY (verify before first prod boot)

### 4.1 Confirm the full migration chain runs clean on an EMPTY database
At least one migration was missing from the run-list until `2ab942c` (today). A fresh production database is the real test of whether the registration list (`backend/src/config/database.js`) is complete. Boot a clean DB and confirm every migration applies with no error.
- **Known runner bug:** the SQL migration runner **splits files on semicolons** unless the file contains `$$`. Any migration with semicolons inside string literals or function bodies (without `$$`) can break. Watch for this when adding migrations.
- **Verification standard:** a clean boot is not proof a migration worked — confirm the resulting schema with `\d <table>`, and for data-affecting migrations, confirm rows. (`node --check` / a clean container start proves parse/boot, not behavior; on Windows-to-container bind mounts, `docker compose up -d --force-recreate backend` is the reliable way to force a reload.)

### 4.2 Extension API base for production
`background.js` carries a skip-worktree'd `API_BASE = http://localhost:5001/api` for local dev, kept out of commits. The committed code resolves the base via `apiBase()`. For production you must confirm the extension points at the **production API URL**, not localhost — and that every call (including the `deleteSection` fix in §2.4) goes through the resolving function, not the bare constant.

### 4.3 Extension distribution
The Chrome extension (`examfill-extension/`) is MV3. Decide and document the production distribution path (Chrome Web Store listing vs. enterprise/unlisted distribution), and confirm `manifest.json` host permissions cover the production API domain and the supported exam portals.

---

## 5. SECURITY & HOUSEKEEPING

- **The repository is public.** For a client project heading to production this is worth raising with the client/owner before launch — code, internal logic, and any committed configuration are visible.
- **`npm audit`:** 7 moderate / 2 high vulnerabilities reported (pre-existing, not introduced this session). **Do not** run `npm audit fix --force` — it pulls breaking changes. Review deliberately.
- **Credit-system ownership.** The credit system was built in parallel by two developers and merged; this session and the prior one both spent time on merge-drift artifacts from that (a clobbered controller, two incompatible `credit_transactions` schemas, the missing migration). A team conversation on ownership is needed to stop future divergence. The canonical decision already made: `main`'s `credit_transactions` schema (`amount` / `reference_type` / `reference_id` / `description` / `idempotency_key NOT NULL UNIQUE` / `metadata`, enum `{purchase, deduction, refund}`) is authoritative; the local `CreditLedger.js` was rewritten onto it.

---

## 6. KEY ARCHITECTURAL FACTS (so you don't rediscover them painfully)

**Stack & environment**
- Frontend: Next.js / React / TypeScript / Tailwind / TanStack Query, at repo root.
- Backend: Node/Express with raw `pg` (no ORM) + Dockerized Postgres, in `backend/`.
- Extension: Chrome MV3 in `examfill-extension/` (`content/`, `sidebar/`, `background/`).
- Dev: Windows. Docker service is `postgres`, database `collegefinder_db`. DB shell: `docker compose exec postgres psql -U postgres -d collegefinder_db` (run from `backend/`).

**Load-bearing contracts**
- **Adapter ↔ catalog join is case-sensitive:** `exams_taxonomies.code = exam_adapters.exam_id`.
- **Dashboard visibility:** an exam shows only if it has BOTH an `exams_taxonomies` row AND an `exam_eligibility_criteria` row.
- **Apply button activation:** requires an `exam_dates` row whose window is currently open (`start ≤ today ≤ close`). Approval status alone is not enough — these are two independent gates (approval gate, then window gate).
- **"Adapter not ready / Build adapter with AI"** appears whenever the adapter is not `approved` + `published` + `is_active = true`.
- **Extension panel does not auto-open** (MV3 user-gesture constraint) — it must be opened via the toolbar icon.
- **`student.email` is intentionally excluded** from the profile sync-back writable map — it is the login identity and must not be overwritten by form data.

**The `background.js` / `manifest.json` discipline (do not delegate or shortcut)**
- Both files are `skip-worktree`'d. `background.js` hides the local `API_BASE = http://localhost:5001/api`.
- Editing them requires the manual dance: `git update-index --no-skip-worktree` → make the change → stage handler hunks but **decline the localhost line** (`git add -p`) → verify `git diff --staged` shows no localhost line → commit → `git update-index --skip-worktree` → push. Skipping this leaks `localhost` into commits or loses the skip-worktree guard.

**Stale-process / reload gotcha**
- On Windows bind-mounts, the backend may not hot-reload. "Check passed, behavior unchanged" is the signature of a stale process. Reliable fix: `docker compose up -d --force-recreate backend`.
- For the **extension**, staged code is not loaded code: after any change, reload at `chrome://extensions` AND refresh the portal tab (content scripts inject on page load). Testing without both is the most common false-negative.

---

## 7. RECOMMENDED ORDER OF WORK

1. **Get a clean `next build`** (§2.1) — unblocks everything else; nothing ships otherwise.
2. **Fix "Register New Exam" to create catalog + eligibility + dates rows** (§2.2) — makes the product operable by admins without SQL. The highest-leverage fix.
3. **Fix `deleteSection`'s `API_BASE`** (§2.4) and **confirm the extension's production API base** (§4.2) — straightforward production crashes/config.
4. **Real Razorpay test against live keys** (§2.3) — payment must be exercised for real before launch.
5. **Fix the two fill bugs** — country substring match (§3.2) and untick-leave-blank null source (§3.3) — correctness on real applications.
6. **Verify the full migration chain on a clean DB** (§4.1) and **establish a reproducible adapter seed/import path** (§3.1) — deployment integrity and maintainability.
7. **Raise the public-repo concern** (§5) and **schedule the credit-system ownership conversation** (§5).

**Engineering discipline that kept the recent work clean (carry forward):** verify against the running system over any "done" summary; for payment/schema code a real write is the test, not a clean boot; read live code before assuming structure; stage by explicit path and verify with `git diff --staged --stat` before every commit (never `git add -A`); take a backup branch before any risky git operation.

---

*The two client features are done and demo-verified. The work ahead is making it operable, buildable, and correct for production — concentrated in onboarding plumbing (§2.2), the build gate (§2.1), payments (§2.3), and a handful of fill/deploy bugs. None of it is large individually; the order above front-loads the things that unblock the rest.*
