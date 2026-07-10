# Reviewed PRD — Technical Blog & Reviews Site

**Document Version:** 2.1
**Last Updated:** 2026-07-10
**Supersedes:** [initial-technical-website-specification.md](./initial-technical-website-specification.md) (v1.0, 2026-01-20)
**Project Status:** MVP scoping
**Author:** Gerardo Palazuelos

---

## 0. Guiding Principle: Walking Skeleton

The MVP is not a feature-complete product. It is the **thinnest possible end-to-end slice** that goes from *idea in head → published article in production*, plus the pipes needed to iterate on that slice safely.

**MVP is done when:**

1. A single published blog article is live on the production domain.
2. The author can edit content in the CMS and see it live within one deploy cycle (≤5 min).
3. There is a preview environment that reflects unmerged changes.
4. Basic legal pages (privacy, affiliate disclosure) exist.
5. Search, analytics, click tracking, reviews, and affiliate-links pages are **not required for MVP** — they are Iteration 1 candidates.

**Anti-goals for the MVP:**

- Do not build features whose success cannot be measured after one published article.
- Do not model content types that will not be authored in week 1 (reviews, affiliate links).
- Do not optimize for scale, multi-author, or content volume.

---

## 1. Scope Decisions (Resolves Ambiguities From v1.0)

The v1.0 spec left several decisions open or contradictory. These are now closed:

| # | Decision                       | v2.0 Choice                                                                                                             | Rationale                                                                                            |
| - | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1 | CMS                            | **Sanity**                                                                                                              | Hosted studio (no server to run), free tier fits solo use, first-class Hugo integration via GROQ/CDN |
| 2 | Deployment model               | **Git-based auto-deploy via Vercel + Sanity webhook**, no manual trigger                                                | "Manual trigger" contradicted the "CI/CD with staging" goal; auto-deploy is the walking skeleton     |
| 3 | Staging                        | **Vercel Preview Deployments** per PR + a persistent `preview` branch                                                   | Free, no extra infra, matches Git-based workflow                                                     |
| 4 | Login / auth                   | **Sanity project member allowlist + Google SSO for identity**, hosted at `studio.<domain>` (or `/studio` subpath)        | Allowlist (not open SSO) satisfies "approved users only" without writing auth code — see §2.2       |
| 5 | Affiliate click tracking       | **Deferred to Iteration 2.** MVP uses plain `rel="sponsored nofollow"` links                                            | Click tracking on a static site requires a serverless redirect; out of MVP scope                     |
| 6 | Search                         | **Deferred to Iteration 1.** MVP has no search                                                                          | With <10 posts, browsing beats searching                                                             |
| 7 | Reviews & Affiliate Links      | **Content models defined but not implemented in MVP.** Only Blog Article is authored in week 1                          | Walking skeleton needs one content type, not three                                                   |
| 8 | Analytics                      | **Plausible (hosted) or Vercel Web Analytics**                                                                          | Privacy-friendly, no cookie banner needed in EU                                                      |
| 9 | RSS                            | **Included** (Hugo generates it for free)                                                                                | v1.0 said "not required" but cost is zero and it aids discovery                                      |
| 10 | Related posts                  | **Deferred to Iteration 1.** Hugo's `.Related` is cheap to add later                                                    | Not blocking first post                                                                              |

---

## 2. MVP Feature Set (Week 1)

### 2.1 Public Pages

- **Home** — Author intro, latest 3 posts, social links. Static content in Hugo config, no CMS field for now.
- **Blog listing** (`/blog/`) — Chronological list of published posts. No category/tag filters yet.
- **Blog post** (`/blog/{slug}/`) — Rendered from Sanity content via GROQ query at build time.
- **404 page** — Static, Hugo-generated.
- **Privacy Policy** (`/privacy/`) — Static Markdown, hand-written.
- **Affiliate Disclosure** (`/disclosure/`) — Static Markdown, FTC-compliant boilerplate. Required even if MVP has no affiliate links yet, because future links will need it.

### 2.2 Private / Authoring

- Sanity Studio deployed to `studio.<domain>` (or subpath).
- One content type: `blogPost`.
- Draft/publish workflow (Sanity native).
- Preview URL from Studio → Vercel Preview environment.

#### 2.2.1 Authentication & Authorization

**Model:** Sanity project **member allowlist** (invite-only, no public registration path exists anywhere on the site). Identity is verified via Google SSO; authorization is controlled by the project member list in `sanity.io/manage`.

**Why not open Google SSO / self-registration:** Sanity's Google SSO button verifies *who* the user is, but access is granted only if their email is already an invited member of the project. Non-members who authenticate see "no access." There is no code path that promotes an unknown Google account into the project — adding a member is a manual action in `sanity.io/manage`.

**Why not Magic Link (email OTP):** For a solo admin whose Sanity account maps to a `@gmail.com` inbox, Magic Link's security root reduces to the same Google account anyway, while the link itself becomes a bearer token in the inbox — weaker phishing resistance than a passkey-protected Google login.

**MVP requirements:**

1. Sanity project members list contains only `<redacted-admin-email>` at launch. Role: `administrator`.
2. That Google account has a **hardware security key or passkey enrolled as 2FA** — this is the single strongest control and closes the phishing vector.
3. Recommended: enroll the Google account in [Google Advanced Protection Program](https://landing.google.com/advancedprotection/) for aggressive phishing filters and OAuth app restrictions.
4. **Access revocation procedure:** remove the member from `sanity.io/manage` → session terminates on next Studio load. Documented in the Day-6 runbook (§8).
5. **No secondary auth surface anywhere on the site.** The public Hugo site has no login form, no registration form, no password reset. All authoring happens inside Sanity Studio.

**Adding future admins (post-MVP):** invite by email from `sanity.io/manage`. New members must also have 2FA on their identity provider before being granted `administrator` role; `editor` role is sufficient for content-only collaborators.

### 2.3 Blog Post Content Model (MVP)

| Field           | Type              | Required | Notes                                                              |
| --------------- | ----------------- | -------- | ------------------------------------------------------------------ |
| `title`         | string            | ✅       |                                                                    |
| `slug`          | slug              | ✅       | Auto-generated from title, editable                                |
| `summary`       | text (max 200ch)  | ✅       | Used for listing + `<meta description>` fallback                   |
| `body`          | Portable Text     | ✅       | Blocks: paragraph, heading, code (with language), image, list      |
| `coverImage`    | image + alt       | ✅       | Alt text required (a11y)                                           |
| `publishedAt`   | datetime          | ✅       | Distinct from Sanity's system `_createdAt`                         |
| `status`        | derived           | —        | `published` = has `publishedAt <= now`, else draft                 |
| `seo.metaDesc`  | text              | ⛔        | Optional; falls back to `summary`                                  |
| `seo.ogImage`   | image             | ⛔        | Optional; falls back to `coverImage`                               |

**Deliberately deferred fields** (add when needed, not before): categories, tags, image gallery, keywords array, custom author. Author is hard-coded in Hugo config for MVP — there is exactly one author.

---

## 3. Architecture (Walking Skeleton)

```
┌──────────────┐       ┌──────────────┐       ┌───────────────┐
│ Sanity Studio│──────▶│  Sanity API  │◀──────│  Hugo Build   │
│  (studio.*)  │       │   (GROQ)     │       │  (on Vercel)  │
└──────────────┘       └──────┬───────┘       └───────┬───────┘
       ▲                      │                        │
       │                      │ webhook on publish     │ static output
       │                      ▼                        ▼
   Google SSO           ┌──────────────┐        ┌──────────────┐
   (1 user)             │Vercel Deploy │───────▶│   CDN + DNS  │
                        │   Hook       │        │              │
                        └──────────────┘        └──────────────┘
```

### 3.1 Data Flow

1. Author edits in Sanity Studio, hits Publish.
2. Sanity fires a webhook to a Vercel Deploy Hook URL.
3. Vercel runs `hugo --minify` after fetching content via GROQ.
4. Deploy replaces the live site (typically <60s for a small site).

### 3.2 Environments

| Env         | Sanity dataset | Vercel branch  | URL                       |
| ----------- | -------------- | -------------- | ------------------------- |
| Production  | `production`   | `main`         | `<domain>.com`            |
| Preview     | `production`   | any PR branch  | `pr-N.<domain>.vercel.app`|
| Local dev   | `production` (read-only) | local  | `localhost:1313`          |

Single dataset for MVP. Split into `production` / `staging` datasets **only if** the author starts wanting to test schema changes without touching live content — that's an Iteration 2 concern.

### 3.3 Secrets

Stored in Vercel env vars, never in the repo:

- `SANITY_PROJECT_ID` (public, but centralized here)
- `SANITY_DATASET`
- `SANITY_API_READ_TOKEN` (read-only, for build)
- `SANITY_WEBHOOK_SECRET` (validates incoming webhook)

Local dev uses a `.env.local` (git-ignored) with the same names.

---

## 4. Non-Functional Requirements (MVP-realistic)

### 4.1 Performance

- **LCP < 2.5s** on 4G mobile (Core Web Vitals "good" threshold — replaces vague "page load < 2s")
- **Lighthouse Performance ≥ 90** on the blog post template (measured in CI)
- Images served via Sanity's image pipeline with `w`/`h`/`auto=format` params → WebP/AVIF where supported
- `loading="lazy"` on all non-hero images

### 4.2 Accessibility

- **Target: WCAG 2.1 AA on all public pages.**
- Alt text required at the CMS field level (validated in schema).
- Semantic landmarks (`<main>`, `<nav>`, `<article>`).
- Visible focus states on interactive elements.
- Verified by axe DevTools before launch (manual, one-time for MVP).

### 4.3 SEO

- Per-page `<title>`, `<meta description>`, canonical URL.
- Open Graph + Twitter Card tags with fallback to cover image.
- `sitemap.xml` (Hugo default).
- `robots.txt` allowing production, disallowing preview deployments (via `X-Robots-Tag` header on Vercel).
- RSS feed at `/index.xml` (Hugo default).

### 4.4 Backups

- **Sanity content:** `sanity dataset export production` run manually **before every schema change**, and via a monthly cron once ≥10 posts exist. Store exports in a private cloud folder.
- **Repo:** GitHub is authoritative.

### 4.5 Legal / Compliance

- Privacy Policy referencing analytics vendor (Plausible = no personal data, so short).
- Affiliate Disclosure page linked from footer, per FTC 16 CFR Part 255.
- No cookie banner needed while using Plausible/Vercel Analytics (no cookies set).

---

## 5. Timeline (Week 1)

Aggressive but achievable **because scope is now one content type, no search, no click tracking, no reviews**.

| Day     | Deliverable                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------- |
| Day 1   | Hugo project scaffold, domain purchased, Vercel connected to GitHub repo, "hello world" in prod      |
| Day 2   | Sanity project created, `blogPost` schema, Studio deployed, Google SSO restricted to owner email     |
| Day 3   | GROQ query + Hugo data pipeline (build fetches Sanity content into `content/blog/*.md` or `data/`)   |
| Day 4   | Templates: home, blog listing, blog post, 404. Basic responsive CSS. Legal pages authored            |
| Day 5   | Sanity → Vercel webhook wired. First real article published end-to-end. Lighthouse/axe pass          |
| Day 6   | Buffer / polish. Wire Plausible. Write README with runbook. Verify RSS + sitemap                     |
| Day 7   | Slack — post publicly, iterate on real feedback                                                      |

If a day slips, cut polish first, then the home page's "latest posts" section (leave it static), then the 404 design.

---

## 6. Iteration Roadmap (post-MVP)

Ordered by cost/value. Each iteration should ship independently in 1–3 days.

### Iteration 1 — "Make it findable" (~3 days)

- Pagefind integration (build step + `<input>` on `/blog/`)
- Categories + tags on `blogPost` (schema migration + taxonomy pages)
- Related posts on blog post template (Hugo `.Related`)
- Reading time estimate

### Iteration 2 — "Add reviews" (~4 days)

- `itemReview` content type (title, summary, body, pros, cons, itemType, coverImage)
- `/reviews/` listing + `/reviews/{slug}/` detail
- Reviews indexed by search

### Iteration 3 — "Add affiliate links + click tracking" (~3 days)

- `affiliateLink` content type (URL, description, vendor, image)
- `/affiliates/` listing page
- **Redirect endpoint** via Vercel serverless function: `/go/[slug]` → 302 to affiliate URL, logs to Plausible custom event
- Embed component in Portable Text for inline affiliate refs from posts/reviews

### Iteration 4 — "Reader engagement" (~parked, evaluate after 10 posts)

- Newsletter (Buttondown or Beehiiv embed)
- Comments (giscus via GitHub Discussions — no moderation infra)

### Iteration 5+ — Speculative

- Multi-author (only if invited author appears)
- A/B testing affiliate placements
- Content scheduling (Sanity supports via `publishedAt` in future — most of this is already possible)

---

## 7. Testing & CI

Minimum viable CI on every PR:

1. `hugo --minify --gc` builds without warnings
2. `htmltest` (or similar) checks for broken internal links
3. Lighthouse CI on the blog post template, budget: Performance ≥ 90, A11y ≥ 95
4. `pa11y` or axe-cli on one representative page

No unit tests for MVP — there is no application logic, only templates.

---

## 8. Runbook (to be written as `README.md` at repo root during Day 6)

Must document:

- How to run locally (`hugo server` + Sanity Studio dev)
- How to create a new post (link to Studio)
- How to preview a draft (Studio → preview URL)
- How to trigger a manual rebuild if webhook fails
- How to roll back (Vercel dashboard → previous deployment → Promote)
- How to export Sanity backup

---

## 9. Open Questions (must resolve before Day 1)

1. **Domain name** — is it registered? Where?
2. **Google SSO email** — confirm `<redacted-admin-email>` is the sole admin.
3. **Design direction** — greenfield CSS, Tailwind, or a Hugo theme (e.g., PaperMod) as starting point? Recommendation: fork a minimal theme for MVP, rewrite in Iteration 2 if it constrains.
4. **First post** — is content drafted? Without a real post, the walking skeleton has nothing to walk.

---

## 10. What Was Removed From v1.0 (and Why)

For traceability against the initial spec:

| Removed / deferred                                | Reason                                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Manual deployment workflow                        | Contradicted CI/CD goal; auto-deploy is faster and safer                                  |
| "Login page" as a public Hugo route               | Sanity Studio owns auth; Hugo doesn't render a login form                                 |
| Strapi as an option                               | Requires hosting a Node server — violates walking-skeleton "no servers" principle          |
| Search in MVP                                     | Not useful with <10 posts; free to add later                                              |
| Reviews & affiliate links content types in MVP    | Not authored in week 1; adding them delays first-publish                                  |
| Click tracking in MVP                             | Needs serverless function; deferred to Iteration 3 with the affiliate feature it serves   |
| Image gallery, categories, tags in blog post MVP  | Not needed for first post; each is a cheap additive migration later                       |
| Rating system                                     | v1.0 already excluded; keeping excluded                                                   |
| "Success metric: indexed within 48h"              | Not directly controllable, removed as a spec requirement (still a nice outcome)           |
| RSS "not required"                                | Hugo generates it for free; keeping                                                       |

---

## Appendix A — Tech Stack (locked)

- **SSG:** Hugo (latest stable)
- **Styling:** TBD Day 1 (see §9.3)
- **CMS:** Sanity (hosted studio)
- **Hosting:** Vercel (Hobby tier is sufficient for MVP)
- **DNS:** wherever the domain was registered; Vercel handles the cert
- **Analytics:** Plausible (hosted) or Vercel Web Analytics — pick on Day 6
- **Version Control:** GitHub, single repo
- **Backups:** Sanity CLI export → private cloud storage

## Appendix B — Cost Estimate (MVP, monthly)

| Service           | Tier                 | Cost                     |
| ----------------- | -------------------- | ------------------------ |
| Vercel            | Hobby                | $0                       |
| Sanity            | Free (3 users, 10k docs) | $0                    |
| Domain            | ~$12/yr amortized    | ~$1                      |
| Plausible         | Starter (if chosen)  | $9                       |
| **Total**         |                      | **~$0–10/mo**            |

Free tiers cover the walking skeleton indefinitely; Plausible is the only likely paid line item and is optional.
