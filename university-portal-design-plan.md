# University Learning Materials Platform — Design & Build Plan

**Purpose:** Build a single-tenant platform for one specific university where students, lecturers, and TAs upload/manage academic materials (past exams, quizzes, tutorials, handouts, books, thesis), monetized via pay-per-item purchases, subscriptions, and affiliate marketing — then sell the finished product to the school with an ongoing revenue share.

This document is written to be used directly with **Claude Code Desktop**. Each "Build Prompt" section is copy-paste ready — paste it into Claude Code as-is (after filling in the `[bracketed]` placeholders with real university data) to build that part of the system.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14+ (App Router, TypeScript) | SSR for SEO on course/material pages, great DX with Claude Code |
| Styling/Animation | Tailwind CSS + GSAP + Framer Motion | Parallax, scroll-triggered storytelling, micro-interactions |
| Backend | Next.js API routes (or separate Node/Express if it grows) | Keep it in one repo for a lean solo/duo build |
| Database | MySQL (via Prisma ORM) | Relational fits the faculty→department→course→material taxonomy perfectly |
| File storage | Cloudflare R2 (S3-compatible) | Cheaper egress than AWS S3 for large PDF/book downloads |
| Auth | NextAuth.js (Credentials + Email) | Role-based access control (student/lecturer/TA/admin) |
| Payments | Paystack | Best Ghana support: cards + Mobile Money (MTN/Vodafone/AirtelTigo), subscriptions |
| Email | Resend or Postmark | Transactional + newsletter-style course alerts |
| WhatsApp (Phase 2) | WhatsApp Business API (via Twilio or Meta Cloud API) | Add after email is stable |

---

## 2. Design Direction

- Use the university's real brand colors/logo (you already have these) as the base palette — do not default to generic "edtech blue."
- Landing page should function as a **scroll-driven story**: hero → problem (scattered materials, WhatsApp chaos) → solution (the platform) → live preview of browsing → social proof/stats → CTA. This is the primary showcase for GSAP ScrollTrigger + Framer Motion page transitions.
- Course/material browse pages should feel fast and dense (students are scanning under exam pressure) — animation here should be subtle (hover states, filter transitions), not decorative.
- Admin dashboard deserves real design attention too — it's the Super Admin's daily tool and is part of what makes the product "sellable."
- When building any UI in Claude Code, **read the `frontend-design` skill first** for design tokens, typography, and layout constraints before generating components.

---

## 3. Roles & Permissions

| Role | Created by | Key permissions |
|---|---|---|
| **Super Admin** | Platform owner (initial seed) | Approve/reject student uploads, manage lecturer accounts, set/override prices, manage subscriptions, view revenue dashboard, manage taxonomy, approve boost point rules, handle content reports/takedowns |
| **Lecturer** | Added by Super Admin | Auto-publish own uploads, add up to 3 TAs, view TA activity log, approve/reject student boost-point requests for their courses, assign purchase-based points, post course announcements |
| **TA** | Added by Lecturer (max 3 per lecturer) | Identical page/permissions to their lecturer; all actions logged and surfaced to the lecturer |
| **Student** | Self sign-up | Browse/download free materials (no login required), purchase/subscribe (login required), upload (goes to review queue), request point-based grade boosts, manage notification subscriptions |

---

## 4. Database Schema (Prisma-style overview, MySQL provider)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  phone         String?
  indexNumber   String?  // student index number, optional, used for point boosts
  role          Role     // SUPER_ADMIN | LECTURER | TA | STUDENT
  addedById     String?  // for TAs: which lecturer added them; for lecturers: which admin added them
  createdAt     DateTime @default(now())
  uploads       Material[]
  purchases     Purchase[]
  subscriptions Subscription[]
  points        PointTransaction[]
  boostRequests BoostRequest[]
  notifSubs     NotificationSubscription[]
}

enum Role {
  SUPER_ADMIN
  LECTURER
  TA
  STUDENT
}

model Faculty {
  id          String       @id @default(cuid())
  name        String
  departments Department[]
}

model Department {
  id        String   @id @default(cuid())
  name      String
  facultyId String
  faculty   Faculty  @relation(fields: [facultyId], references: [id])
  courses   Course[]
}

model Course {
  id           String     @id @default(cuid())
  code         String     // e.g. CENG 301
  title        String
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  lecturerId   String?    // primary lecturer
  materials    Material[]
  notifSubs    NotificationSubscription[]
}

model Material {
  id            String       @id @default(cuid())
  title         String
  type          MaterialType // PAST_EXAM | QUIZ | HANDOUT | TUTORIAL | BOOK | THESIS
  courseId      String
  course        Course       @relation(fields: [courseId], references: [id])
  uploadedById  String
  uploadedBy    User         @relation(fields: [uploadedById], references: [id])
  lecturerName  String?      // for filtering past exams by lecturer
  academicYear  String?      // e.g. 2023/2024
  semester      String?
  isFree        Boolean      @default(true)
  price         Decimal?     // null if free
  fileUrl       String
  status        MaterialStatus // PENDING | APPROVED | REJECTED
  autoPublished Boolean      @default(false) // true for lecturer/TA uploads
  createdAt     DateTime     @default(now())
}

enum MaterialType {
  PAST_EXAM
  QUIZ
  HANDOUT
  TUTORIAL
  BOOK
  THESIS
}

enum MaterialStatus {
  PENDING
  APPROVED
  REJECTED
}

model Purchase {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  materialId String
  amount     Decimal
  paystackRef String
  createdAt  DateTime @default(now())
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  plan      String   // e.g. "Semester Pass"
  startedAt DateTime
  expiresAt DateTime
  status    String   // ACTIVE | EXPIRED | CANCELLED
}

model PointTransaction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  source      String   // UPLOAD_VERIFIED | PURCHASE_AWARDED
  courseId    String?
  materialId  String?
  points      Int
  awardedById String?  // lecturer who awarded, if purchase-based
  createdAt   DateTime @default(now())
}

model BoostRequest {
  id           String   @id @default(cuid())
  studentId    String
  student      User     @relation(fields: [studentId], references: [id])
  courseId     String
  pointsUsed   Int
  status       String   // PENDING | APPROVED | REJECTED
  decidedById  String?  // lecturer
  decidedAt    DateTime?
  createdAt    DateTime @default(now())
}

model NotificationSubscription {
  id        String  @id @default(cuid())
  studentId String
  student   User    @relation(fields: [studentId], references: [id])
  courseId  String?
  course    Course? @relation(fields: [courseId], references: [id])
  lecturerId String?
  active    Boolean @default(true)
}

model Announcement {
  id          String   @id @default(cuid())
  authorId    String   // lecturer or TA
  courseId    String
  title       String
  body        String
  sentViaEmail Boolean @default(false)
  createdAt   DateTime @default(now())
}

model AffiliateLink {
  id          String   @id @default(cuid())
  label       String   // e.g. "Summarize with [AI Tool]"
  targetUrl   String
  placement   String   // e.g. "post-download"
  clicks      Int      @default(0)
  conversions Int      @default(0)
}
```

---

## 5. Feature Specs

### 5.1 Access Rules
- Free materials: downloadable by **anyone**, no login required.
- Paid materials: **must be logged in**; unlock via one-time purchase or active subscription.

### 5.2 Verification Pipeline
- Lecturer and TA uploads: **auto-publish** immediately, tagged to the course.
- Student uploads: enter a **review queue**; Super Admin approves/rejects with an optional reason sent back to the student.
- Basic duplicate detection recommended (match on filename + course + material type) to keep the queue clean.

### 5.3 Notifications (Newsletter-style)
- Students can subscribe/unsubscribe at any time to a specific **lecturer** or **course**.
- Subscribing requires phone number and/or email on file.
- Lecturers/TAs post announcements → sent via **email now**, WhatsApp Business API in Phase 2.
- All subscription toggles live on the student's profile/dashboard, changeable anytime.

### 5.4 TA System
- A lecturer can add up to **3 TA accounts**.
- TA accounts get an identical dashboard/page and permissions to their lecturer (uploads, announcements, assigning purchase points).
- Every TA action is logged and surfaced as a notification on the **lecturer's** dashboard — lecturers always see what's happened under their name.

### 5.5 Points & Grade Boost (lecturer-gated, not automatic)
- **Earning points:**
  - Upload verified by Super Admin → student earns upload points.
  - Student purchases paid material for a course → lecturer (or TA) may optionally assign purchase points for that transaction.
  - Both flows ask for the student's **name and index number (optional)** — required only if the student later wants to redeem points for a boost.
- **Redeeming points:**
  - Student submits a boost request from their profile, selecting a course and how many accumulated points to use.
  - The course's lecturer sees the request on their dashboard and **approves or rejects it individually** — nothing is automatic.
  - Student is notified of the outcome.
- **Recommendation to relay to the school:** cap the maximum grade impact of any boost (e.g. 2-3%) and get this policy formally approved by the university's academic board before launch — this is an academic integrity decision, not just a product feature.

### 5.6 Monetization
- **Pay-per-item**: one-time unlock per material, priced by Super Admin.
- **Subscription**: semester pass for unlimited access, managed via Paystack recurring billing.
- **Affiliate**: contextual placement after a paid or free download (e.g., "Summarize this with [AI Tool]"), tracked for clicks/conversions, feeding the admin revenue dashboard.

### 5.7 Legal / Compliance
- Add a **"Report content"** flag on every material, visible to Super Admin, for takedown requests (especially important for books/thesis with third-party copyright).
- Confirm with the school who owns upload liability — recommend a simple published policy page.

---

## 6. Sitemap

**Public / Student-facing**
- `/` — Landing page (scroll storytelling)
- `/browse` — Faculty → Department → Course → Year → Type, with search/filter
- `/material/[id]` — Material detail (preview, price/free badge, lecturer, date, download/purchase)
- `/checkout` — Paystack (one-time or subscription)
- `/dashboard` — Student dashboard (purchases, uploads, subscriptions, points, boost requests, notification settings)
- `/upload` — Student upload flow → review queue
- `/auth/sign-in`, `/auth/sign-up`

**Lecturer / TA**
- `/lecturer/dashboard` — Uploads, stats, TA management, TA activity log, boost request queue, announcements

**Admin**
- `/admin/review-queue`
- `/admin/users` (lecturers, students, TAs)
- `/admin/taxonomy` (faculties, departments, courses)
- `/admin/revenue` (sales, subscriptions, affiliate performance)
- `/admin/affiliate-links`
- `/admin/reports` (content takedown requests)

---

## 7. Claude Code Build Prompts

Use these in order, in Claude Code Desktop, inside your project folder. Fill in `[UNIVERSITY NAME]`, `[BRAND COLORS]`, and real taxonomy data where noted.

### Prompt 1 — Project scaffold
```
Set up a new Next.js 14 project (App Router, TypeScript, Tailwind CSS) for a university
learning materials platform called "[PLATFORM NAME]" for [UNIVERSITY NAME].
Install and configure: Prisma with MySQL, NextAuth.js, GSAP, Framer Motion,
Paystack node SDK, Resend for email. Set up the folder structure for:
app/(public), app/(student-dashboard), app/(lecturer), app/(admin), lib/, prisma/.
Read the frontend-design skill before creating any UI files.
```

### Prompt 2 — Database schema
```
Using Prisma, implement the following schema in prisma/schema.prisma: [paste Section 4 above].
Generate the migration and seed the database with placeholder faculties, departments,
and courses using this structure: Faculty > Department > Course (code + title) > Year/Level.
Also seed one Super Admin user.
```

### Prompt 3 — Auth & roles
```
Implement NextAuth.js with email/credentials sign-in. Add role-based middleware so that
STUDENT, LECTURER, TA, and SUPER_ADMIN each only access their respective route groups
(app/(student-dashboard), app/(lecturer), app/(admin)). Public browse and free material
downloads must remain accessible without login.
```

### Prompt 4 — Browse & material pages
```
Build the /browse page: faculty > department > course > year > material type filtering,
with search. Build /material/[id] detail page showing title, type, lecturer, academic
year/semester, price or free badge, and a download/purchase button. Free materials
download immediately with no login gate; paid materials redirect to /auth/sign-in
if not logged in, otherwise to /checkout.
```

### Prompt 5 — Upload flows
```
Build /upload for students: form with material metadata (course, type, lecturer name,
academic year, semester, file), submits with status PENDING. Build the lecturer/TA
equivalent upload flow that submits with status APPROVED and autoPublished=true.
```

### Prompt 6 — Admin review queue & taxonomy management
```
Build /admin/review-queue: list of PENDING materials with approve/reject actions and
an optional rejection reason sent to the uploader. Build /admin/taxonomy for CRUD on
faculties, departments, and courses. Build /admin/users for managing lecturer accounts
(add/remove) and viewing student/TA accounts.
```

### Prompt 7 — Payments
```
Integrate Paystack for: (1) one-time material purchases, (2) a "Semester Pass"
subscription plan. On successful payment webhook, create a Purchase or Subscription
record and unlock access to the relevant material(s). Build /admin/revenue showing
total sales, active subscriptions, and revenue over time.
```

### Prompt 8 — TA system
```
On the lecturer dashboard, allow adding up to 3 TA accounts (invite by email).
Give TA accounts an identical dashboard and permissions to their lecturer, scoped
to the same courses. Log every TA action (upload, announcement, point assignment)
and surface it as a notification on the lecturer's dashboard.
```

### Prompt 9 — Notifications & announcements
```
Build a NotificationSubscription system: students can subscribe/unsubscribe to a
specific lecturer or course from their dashboard, toggleable anytime, requiring
phone/email on file. Build an Announcement flow for lecturers/TAs to post updates
per course, which triggers an email via Resend to all active subscribers for that
course. Structure the email-sending code so a WhatsApp Business API sender can be
added later without changing the announcement model.
```

### Prompt 10 — Points & boost requests
```
Implement PointTransaction records for (a) Super Admin verifying a student upload,
(b) a lecturer/TA assigning points after a student's purchase, both optionally
capturing student name + index number. Build a BoostRequest flow: student selects
a course and submits a request using accumulated points; it appears in a queue on
that course's lecturer dashboard for approve/reject; student is notified of the
outcome. Do not auto-apply anything to any grade — this system only tracks
requests and lecturer decisions.
```

### Prompt 11 — Affiliate links
```
Build an AffiliateLink model and admin management page. After a material download
(free or paid), show a contextual card recommending a linked AI summarization tool,
tracked for clicks. Log conversions if the affiliate program supports a postback/webhook.
```

### Prompt 12 — Landing page & motion design
```
Read the frontend-design skill, then build the landing page (/) as a scroll-driven
story using GSAP ScrollTrigger and Framer Motion: hero section, problem section
(scattered materials/WhatsApp chaos), solution section, live browse preview,
stats/social proof, and CTA. Use [UNIVERSITY NAME]'s brand colors: [BRAND COLORS].
Keep animation on the /browse and dashboard pages subtle — filter/hover transitions
only, not decorative.
```

---

## 8. Suggested Build Order / Timeline (single university, 2-3 months achievable)

1. **Weeks 1-2:** Scaffold, schema, auth/roles (Prompts 1-3)
2. **Weeks 3-5:** Browse, material pages, upload flows, admin review queue (Prompts 4-6)
3. **Weeks 6-7:** Payments, TA system (Prompts 7-8)
4. **Weeks 8-9:** Notifications, points/boost requests, affiliate links (Prompts 9-11)
5. **Weeks 10-12:** Landing page motion design, polish, real taxonomy data import, QA (Prompt 12 + real data)

---

## 9. Open Items to Confirm With the School Before Launch

- Formal academic policy sign-off on the points → grade boost feature, including any cap on grade impact.
- Content ownership/liability policy for uploaded books, theses, and past exams (report/takedown process).
- Real faculty/department/course list to replace placeholder taxonomy.
- Revenue share percentage and payout terms for the ongoing deal structure.
- WhatsApp Business API budget/approval timeline for Phase 2.
