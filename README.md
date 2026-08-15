# CCTU StudyHub

A single-tenant learning-materials platform for **Cape Coast Technical University** — past exams, quizzes, handouts, tutorials, books and theses, organised by faculty → department → course → year → type, monetised with pay-per-item unlocks, a Semester Pass subscription and affiliate placements.

Built from [`university-portal-design-plan.md`](university-portal-design-plan.md); every section of that plan is implemented below.

---

## Running it locally (XAMPP)

MySQL must be running in the XAMPP control panel. Apache is not needed — Next.js serves the app.

```bash
npm install
```

```bash
npx prisma migrate deploy
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Then open <http://localhost:3000>.

`.env` already points at the XAMPP defaults (`mysql://root@127.0.0.1:3306/cctu_studyhub`). If your MySQL root user has a password, update `DATABASE_URL`.

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@cctu.edu.gh` | `ChangeMe123!` |
| Lecturer | `k.mensah@cctu.edu.gh` | `Lecturer123!` |
| Lecturer | `a.boateng@cctu.edu.gh` | `Lecturer123!` |
| Teaching Assistant | `j.owusu@cctu.edu.gh` | `Assistant123!` |
| Student | `student@cctu.edu.gh` | `Student123!` |
| Student | `kofi@cctu.edu.gh` | `Student123!` |

Change these before any real deployment.

---

## What runs without third-party accounts

The app is fully functional offline. Each integration degrades to a local equivalent and switches to the real service the moment its env vars are set — **no code changes**.

| Service | Without keys | With keys |
|---|---|---|
| **Paystack** | `/checkout/sandbox` simulates the hosted checkout and calls the same fulfilment code the webhook uses | Redirects to Paystack (cards + MTN/Telecel/AirtelTigo MoMo); `/api/paystack/webhook` fulfils |
| **Resend** | Emails print to the server console (`[email:dev]`) | Real transactional email |
| **Cloudflare R2** | Files stored under `./storage`, served via `/api/files/...` | S3-compatible R2 bucket |
| **WhatsApp** | Channel disabled | Set `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` and announcements fan out to it too |

Going live: fill in `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `RESEND_API_KEY`, and the `R2_*` block in `.env`, then point the Paystack dashboard webhook at `https://<domain>/api/paystack/webhook`.

---

## Routes

**Public** — `/` landing · `/browse` · `/material/[id]` · `/pricing` · `/policy` · `/auth/sign-in` · `/auth/sign-up`

**Student** (`STUDENT`) — `/dashboard` · `/dashboard/purchases` · `/dashboard/uploads` · `/dashboard/points` · `/dashboard/notifications` · `/upload` · `/checkout`

**Lecturer / TA** (`LECTURER`, `TA`) — `/lecturer/dashboard` · `/lecturer/materials` · `/lecturer/announcements` · `/lecturer/boost-requests` · `/lecturer/points` · `/lecturer/team`

**Admin** (`SUPER_ADMIN`) — `/admin/review-queue` · `/admin/materials` · `/admin/users` · `/admin/taxonomy` · `/admin/revenue` · `/admin/affiliate-links` · `/admin/reports`

Route protection lives in [`middleware.ts`](middleware.ts). Browsing and **free downloads never require a login** — that rule is enforced again at the file layer in [`app/api/files/[...key]/route.ts`](app/api/files/[...key]/route.ts), so a storage URL cannot be used to sidestep payment (verified: signed-out request for a paid file returns `402`).

---

## How the rules from the plan are implemented

- **Access (§5.1)** — `lib/access.ts` is the single source of truth, called by both the material page and the file route.
- **Verification (§5.2)** — one upload entry point (`app/actions/upload-actions.ts`); staff uploads are `APPROVED + autoPublished`, student uploads are `PENDING`. Duplicate detection matches filename + course + type.
- **Notifications (§5.3)** — `lib/messaging.ts` defines a channel interface; email is live, WhatsApp is a ready-to-enable channel. Announcements fan out to course *and* lecturer subscribers, de-duplicated.
- **TA system (§5.4)** — max 3 per lecturer, TAs inherit their lecturer's course scope via `lecturerScopeId()`, and every action writes a `TAActivityLog` row surfaced (unseen) on the lecturer's dashboard.
- **Points (§5.5)** — an append-only ledger. Verified uploads award points automatically; purchase points are awarded manually by a lecturer/TA. Redeeming writes a *negative* row on approval, so nothing can be spent twice. **No code anywhere changes a grade.**
- **Monetisation (§5.6)** — `PaymentIntent` links a Paystack reference to buyer + item; `lib/fulfillment.ts` is idempotent and shared by the webhook, the redirect callback and the sandbox.
- **Compliance (§5.7)** — "Report this content" on every material, `/admin/reports` with an uphold-and-takedown action, and a public `/policy` page.

## Design

Brand palette is taken from the CCTU crest in `media/` — torch gold `#FFC907` and shield blue `#1580DE` (`tailwind.config.ts`). Type is **Inter** for the interface and **Fraunces** for display, loaded via `next/font` (self-hosted at build time, no layout shift).

Motion follows a single set of rules, defined once in [globals.css](app/globals.css):

- Custom easing curves (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`) — the built-in CSS easings are too weak to read as intentional. `ease-in` is never used on entering UI.
- Everything pressable scales to `0.97` on `:active`; hover treatments are gated behind `@media (hover: hover) and (pointer: fine)` so touch taps don't trigger them.
- UI transitions stay under 300ms. Long-form storytelling on the landing page is the only place durations go higher.
- Entrances start from `scale(0.95)` / `translateY`, never from `scale(0)`.
- Lists stagger at 45ms per item, via CSS keyframes rather than JS so the cascade stays smooth while the page hydrates.

The landing page is the scroll-driven story from §2 (GSAP ScrollTrigger for scrubbed parallax, Framer Motion for entrances and the shared-layout nav indicator); browse and dashboard motion is deliberately limited to hover and filter transitions. All motion is wrapped in `gsap.matchMedia()` / `useReducedMotion` and respects `prefers-reduced-motion` — which reduces movement while keeping opacity and colour transitions that aid comprehension.

---

## Still open before launch (§9 of the plan)

1. **Real taxonomy** — the seeded faculty/department/course list is provisional. Replace `FACULTIES` in `prisma/seed.ts` with the registrar's official list, or enter it through `/admin/taxonomy`.
2. **Academic sign-off on points → grade boosts**, including the maximum permitted impact (the plan recommends 2–3%). The feature records requests and decisions only, but the policy must exist before it is used in a live semester.
3. **Upload liability & takedown policy** — `/policy` is drafted for the university to adopt; it needs formal approval.
4. **Revenue share** percentage and payout terms.
5. **WhatsApp Business API** budget and approval for Phase 2.

## Scripts

```bash
npm run dev
```

- `npm run build` / `npm start` — production build and serve
- `npm run typecheck` — `tsc --noEmit`
- `npm run db:migrate` / `db:seed` / `db:studio` — Prisma tooling
