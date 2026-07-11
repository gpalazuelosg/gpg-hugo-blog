# Implementation Plan — Technical Blog & Reviews Site MVP

**Derived from:** [reviewed-prd.md](./reviewed-prd.md) v2.4 (spec closed)
**Revision note:** v1.2 (2026-07-11) — PR flow becomes mandatory from Day 3 per PRD §1 decision 13; v1.1 restructured repo to `src/site` + `src/studio` per PRD §1 decision 11.
**Verifies against:** [acceptance-criteria.md](./acceptance-criteria.md)
**Status:** Draft for review — becomes binding once committed
**Rule of the road:** if implementation forces a decision this plan doesn't cover, record it in the PRD §1 decisions table *first*, then build it.

---

## 1. Target Repository Layout

One repo, two deployable units (Hugo site on Vercel, Sanity Studio hosted by Sanity):

Repo root holds orchestration; both deployable units live under `src/` (PRD §1 decision 11):

```
/
├── README.md                     # Runbook (Day 6, PRD §8)
├── package.json                  # Build orchestration: fetch content → hugo -s src/site
├── vercel.json                   # Build command, output dir, headers
├── .env.example                  # Names of required env vars, no values
├── .gitignore                    # .env.local, src/site/public*, node_modules
├── .htmltest.yml                 # F2 gate config
├── lighthouserc.json             # F3 gate config
├── documents/                    # Specs: PRD, acceptance criteria, this plan
│
├── scripts/
│   └── fetch-content.mjs         # GROQ fetch → Portable Text → Markdown → src/site/content/blog/*.md
│
├── .github/workflows/
│   └── ci.yml                    # The four PRD §7 gates
│
└── src/
    ├── site/                     # Hugo source — all hugo commands take -s src/site
    │   ├── hugo.toml             # Site config: author, social links, menus, PaperMod params
    │   ├── archetypes/
    │   ├── assets/css/extended/  # PaperMod's sanctioned CSS override point
    │   ├── content/
    │   │   ├── privacy.md        # Hand-written (PRD §2.1)
    │   │   ├── disclosure.md     # Hand-written, FTC boilerplate (PRD §2.1)
    │   │   └── blog/             # GENERATED at build time — git-ignored except _index.md + fixture
    │   │       └── _index.md
    │   ├── layouts/              # Minimal overrides only (see §4 below)
    │   ├── static/robots.txt     # Allow production crawling (PRD §4.3)
    │   └── themes/PaperMod/      # Git submodule (PRD §9.3 resolution)
    │
    └── studio/                   # Sanity Studio — separate npm package (Day 2)
        ├── package.json
        ├── sanity.config.ts
        ├── sanity.cli.ts
        └── schemaTypes/
            ├── index.ts
            └── blogPost.ts       # The one MVP content type (PRD §2.3)
```

## 2. PRD Section → Artifact Map

| PRD § | Requirement | Artifact(s) | Acceptance IDs |
|-------|-------------|-------------|----------------|
| §2.1 | Home, listing, post, 404, legal pages | `hugo.toml` (home profile mode), PaperMod defaults, `content/privacy.md`, `content/disclosure.md` | A4, B1–B4 |
| §2.2 | Studio + draft/publish | `studio/` package, deployed via `sanity deploy` | C1 |
| §2.2.1 | Auth: member allowlist | Manual config in sanity.io/manage (no code); documented in README | C2–C6 |
| §2.3 | `blogPost` content model | `studio/schemaTypes/blogPost.ts` with validation rules | D1–D4, B5 |
| §3.1 | Build-time content pipeline | `scripts/fetch-content.mjs`, `package.json` build script | A1, A2, B3 |
| §3.2 | Environments | Vercel project settings (main→prod, PR→preview) | A3 |
| §3.3 | Secrets | Vercel env vars, `.env.example`, `.gitignore` | G3 |
| §4.1 | Performance | Sanity image URL params in fetch script, `loading="lazy"` in render, PaperMod defaults | E1–E3 |
| §4.2 | Accessibility | Schema-level alt validation, PaperMod semantic markup (verify), focus states in `assets/css/extended/` | E4 |
| §4.3 | SEO/RSS/sitemap | PaperMod OG/Twitter partials (verify), Hugo built-in sitemap/RSS, `static/robots.txt` | E5–E7 |
| §4.4 | Backups | `sanity dataset export` procedure in README | E8, G2 |
| §4.5 | Legal | Content files + footer links | A4, E9 |
| §5 | Timeline | Task breakdown in §6 below | — |
| §7 | CI | `.github/workflows/ci.yml` + branch protection | F1–F5 |
| §8 | Runbook | `README.md` | G1–G2 |

## 3. Key Interfaces & Technical Decisions

### 3.1 Content pipeline (the load-bearing piece — Day 3)

`scripts/fetch-content.mjs`, run as the first step of every build:

1. **Fetch** via Sanity HTTP API (GROQ), using `SANITY_API_READ_TOKEN`:
   ```groq
   *[_type == "blogPost" && defined(publishedAt) && publishedAt <= now()]{
     title, "slug": slug.current, summary, body, publishedAt,
     coverImage{ asset->{url}, alt }, seo
   }
   ```
   The `publishedAt <= now()` filter **is** the draft/scheduled-post gate (acceptance B5) — drafts never reach the build.
2. **Convert** Portable Text `body` → Markdown/HTML. Library: `@portabletext/to-html` rendering into the Markdown file as raw HTML blocks (Hugo passes them through). Custom serializers for: `code` blocks (emit `<pre><code class="language-X">` for PaperMod/Chroma highlighting), inline `image` blocks (Sanity CDN URL with `?auto=format&w=1200` + required alt + `loading="lazy"`).
3. **Write** `src/site/content/blog/<slug>.md` with Hugo front matter (`title`, `summary`, `date: publishedAt`, `cover.image`, `cover.alt`, `description: seo.metaDesc ?? summary`).
4. **Fail the build** (non-zero exit) on: API error, missing required field, or zero posts *after* Day 5 (a `MIN_POSTS` env guard, default 0 until first publish).

Build command (Vercel + local + CI): `node scripts/fetch-content.mjs && hugo -s src/site --minify --gc`.

### 3.2 Webhook (Day 5)

Sanity webhook (filter: `_type == "blogPost"`, on publish/unpublish) → **Vercel Deploy Hook URL**.
⚠️ **Spec deviation to record when implemented:** Vercel Deploy Hooks don't validate a signature header — the hook URL itself is the capability secret. PRD §3.3's `SANITY_WEBHOOK_SECRET` therefore has no MVP consumer; it becomes relevant in Iteration 3 (serverless functions). Log this in PRD §1 on Day 5.

### 3.3 Theme strategy (PRD §9.3: fork PaperMod)

Add as **git submodule** first (cheapest); convert to a vendored fork only when the first real upstream-divergent patch is needed. Customization order of preference: `hugo.toml` params → `assets/css/extended/*.css` → `layouts/` override of a single partial. Never edit inside `themes/PaperMod/` while it's a submodule.

### 3.4 Environments & secrets

| Var | Where | Notes |
|-----|-------|-------|
| `SANITY_PROJECT_ID` | Vercel (all envs), `.env.local` | Public but centralized |
| `SANITY_DATASET` | same | `production` (single dataset, PRD §3.2) |
| `SANITY_API_READ_TOKEN` | same, **secret** | Viewer-role token, read-only |
| `MIN_POSTS` | Vercel prod only | `1` after Day 5; guards against empty-content deploys |

Preview noindex (E7): Vercel sets `X-Robots-Tag: noindex` on preview deployments automatically — Day 1 task verifies rather than builds this; add a `vercel.json` header rule only if verification fails.

### 3.5 CI (`.github/workflows/ci.yml`) — built on Day 1, not Day 5

Runs on every PR (branch protection makes it blocking, F5). Content fetch is **skipped in CI** (no secrets on fork PRs; deterministic builds) — CI builds with committed content + a fixture post at `content/blog/fixture-post.md` (git-tracked, `draft: true` in prod builds, enabled in CI via `HUGO_ENV`... simpler: CI passes `--buildDrafts`). The fixture post contains every Portable Text block type's rendered output, so Lighthouse/pa11y measure the real post template (F3, F4) from Day 1 — before Sanity even exists.

| Job | Tool | Gate (PRD §7) |
|-----|------|----------------|
| build | `hugo -s src/site --minify --gc --buildDrafts` | zero warnings (F1) |
| links | `htmltest` on `public/` | no broken internal links (F2) |
| lighthouse | `lhci autorun` against `hugo server` or static serve of fixture post | Perf ≥ 90, A11y ≥ 95 (F3) |
| a11y | `pa11y-ci` on fixture post | no errors (F4) |

## 4. Task Breakdown (one branch/PR per task)

Verification = the acceptance-criteria IDs the PR must demonstrate, plus CI green.

**Workflow discipline (PRD §1 decision 13):**
- **Days 1–2:** direct-to-`main` allowed for bootstrap scaffolding (Hugo scaffold, CI wiring, Studio scaffold). These commits don't touch Hugo's build path so the F1–F4 gates are not meaningful gates for them.
- **Day 3 onward:** every code change lands via PR. Merge requires all 4 CI gates green (F1–F4). Admin bypass of branch protection is reserved for genuine emergencies and must be justified in the commit body.
- Dashboard-only tasks (Vercel/Sanity config) remain out of Git and continue as-is.

### Day 1 — Skeleton in production
| # | Task | Branch | Verify |
|---|------|--------|--------|
| 1.1 | Scaffold Hugo + PaperMod submodule + `hugo.toml` + fixture post + legal page stubs | `feat/scaffold` | Local `hugo server` renders home/listing/post/404 |
| 1.2 | CI workflow with all four gates + branch protection on `main` | `feat/ci` | F1–F5 (deliberately-failing test PR) |
| 1.3 | Vercel project: connect repo, build command, env var names, custom domain + DNS (**needs domain name from Gerardo**) | — (dashboard) | A3, E7; hello-world live in prod |

### Day 2 — Studio
| # | Task | Branch | Verify |
|---|------|--------|--------|
| 2.1 | `studio/` package: Sanity project init, `blogPost.ts` schema with all §2.3 validations | `feat/studio` | D1, D2, D4 (attempt invalid publishes) |
| 2.2 | `sanity deploy` to hosted studio; member list = sole admin; passkey 2FA check | — (dashboard) | C1–C5 |

### Day 3 — Content pipeline
| # | Task | Branch | Verify |
|---|------|--------|--------|
| 3.1 | `fetch-content.mjs` per §3.1 above + `package.json` build orchestration | `feat/content-pipeline` | B3, B5, D3 (test post w/ all block types; draft stays invisible) |

### Day 4 — Templates & content
| # | Task | Branch | Verify |
|---|------|--------|--------|
| 4.1 | Home profile config, footer (legal links), CSS polish in `extended/`, 404 | `feat/templates` | B1, B2, B4, A4, E4 partial (axe sweep) |
| 4.2 | Author real privacy + disclosure text | same PR | E9 |
| 4.3 | **Parallel (Gerardo):** write first post draft | — | feeds 5.1 |

### Day 5 — End-to-end publish
| # | Task | Branch | Verify |
|---|------|--------|--------|
| 5.1 | Wire Sanity webhook → Vercel deploy hook; record §3.2 secret deviation in PRD §1; set `MIN_POSTS=1`; author + publish first real post in Studio | `feat/webhook` + dashboard | **A1, A2** (timed ≤5 min), E1–E3, E5, E6 |

### Day 6 — Ops & polish
| # | Task | Branch | Verify |
|---|------|--------|--------|
| 6.1 | Analytics: pick Plausible vs Vercel Web Analytics (decision → PRD §1), wire it, update privacy page | `feat/analytics` | E9 |
| 6.2 | README runbook, all six §8 procedures; rehearse rollback + `sanity dataset export` | `feat/runbook` | G1, G2, E8 |
| 6.3 | Full acceptance-criteria walk: check every ID, record results in the checklist file | `chore/acceptance` | All 35 |

### Day 7 — Ship
Announce publicly; feedback → Iteration 1 backlog (PRD §6).

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Portable Text → Markdown edge cases (nested lists, marks inside code) | Day 3 slip | Fixture post exercises every block type; custom serializers kept minimal — reject exotic blocks at schema level rather than render them |
| PaperMod doesn't meet Lighthouse A11y ≥ 95 out of the box | CI gate blocks Day 1 | Measured on Day 1 with fixture post — worst case, fix in `extended/` CSS or drop to documented override |
| First post not written by Day 5 | A1 unverifiable with real content | Parallel track flagged (PRD §9.4); fallback: publish skeleton with a short real post, expand after |
| Vercel preview noindex assumption wrong | E7 fails | Verified Day 1; `vercel.json` header rule as fallback |
| Free-tier Vercel Hobby limits (build minutes) | none expected at this scale | Monitor; PRD Appendix B already accepts $0 tier |
| `npm audit` findings in `src/studio` (17 vulns: 10 mod / 4 high / 3 crit as of 2026-07-11) — `decompress` (crit, via `@sanity/cli`), `glob` (high, via `@architect/*`), `prismjs` (mod, via `@sanity/code-input`), `uuid` (mod, via Sanity internals) | None exploitable in this project's threat model: Studio is single-admin behind Google SSO + passkey (C4); `decompress`/`glob` are dev-CLI or unused transitive; `prismjs` DOM Clobbering and `uuid` bounds check both require attacker-controlled input Studio doesn't expose | **Accept and document.** Do not run `npm audit fix` (breaks Sanity resolution) or `--force` (would jump `@sanity/code-input` to v7 — unverified vs `sanity ^3`). Revisit trigger: next Sanity major bump, or when `@sanity/code-input` v7 is compatible with our pinned range |
