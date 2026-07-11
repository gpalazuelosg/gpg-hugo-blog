# MVP Acceptance Criteria — Technical Blog & Reviews Site

**Derived from:** [reviewed-prd.md](./reviewed-prd.md) v2.3
**Status:** Binding — the spec is closed; every MUST item below gates MVP ship
**How to use:** Every criterion is a pass/fail check with a stated verification method. The MVP ships when every MUST item passes. Anything failing is a bug against the spec; anything desirable but absent from this list is an Iteration 1+ candidate, not a fix.

---

## A. Walking Skeleton (PRD §0)

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| A1 | A published blog article is reachable at `https://palazuelos.dev/blog/<slug>/` on the production domain over HTTPS. | Open the URL in a browser; view page source shows rendered article content (not client-side fetched). | §0.1 |
| A2 | Editing the article in Sanity Studio and hitting Publish results in the change being live in production within ≤5 minutes, with no manual step. | Timed test: edit title in Studio → Publish → stopwatch until change visible in prod. | §0.2, §3.1 |
| A3 | A preview environment exists that reflects unmerged changes: opening a PR against `main` produces a Vercel Preview URL rendering that branch. | Open a trivial PR (e.g., footer text change); confirm the Vercel preview URL shows the change while prod does not. | §0.3, §3.2 |
| A4 | Privacy Policy and Affiliate Disclosure pages are live at `/privacy/` and `/disclosure/`. | Open both URLs in prod; both linked from the site footer. | §0.4, §2.1 |
| A5 | **Anti-goal check:** no search, no analytics dashboards beyond the chosen provider, no click tracking, no reviews pages, no affiliate-links pages exist in the MVP. | Manual sweep of nav, footer, and sitemap.xml for out-of-scope routes. | §0.5, §0 anti-goals |

## B. Public Pages (PRD §2.1)

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| B1 | Home page shows author intro, latest 3 published posts, and social links. | Visual check; publish a 4th post and confirm the oldest drops off the home list on next deploy. | §2.1 |
| B2 | `/blog/` lists all published posts in reverse-chronological order by `publishedAt`. No category/tag filters present. | Visual check with ≥2 posts having different `publishedAt`. | §2.1 |
| B3 | A blog post page renders every Portable Text block type in the schema: paragraph, headings, code block with syntax highlighting language, image, list. | Author one test post containing all block types; inspect rendered output. | §2.1, §2.3 |
| B4 | Requesting a non-existent URL returns HTTP 404 with the site's 404 page. | `curl -I https://palazuelos.dev/does-not-exist/` → 404; page renders with site chrome. | §2.1 |
| B5 | A post in draft state (no `publishedAt`, or `publishedAt` in the future) does not appear anywhere on the public site. | Create a draft post; confirm absent from home, `/blog/`, sitemap, and RSS after a deploy. | §2.2, §2.3 |

## C. Authoring, Auth & Authorization (PRD §2.2)

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| C1 | Sanity Studio is deployed at `studio.palazuelos.dev` (or `/studio`) and requires login. | Open Studio URL in a private browser window → login wall, no content visible. | §2.2 |
| C2 | The Sanity project member list contains exactly one member: the confirmed admin email, with `administrator` role. | Screenshot / check `sanity.io/manage` members page. | §2.2.1-1 |
| C3 | A Google account that is **not** a project member can authenticate with Google SSO but sees "no access" — it cannot read or write content. | Test with a second Google account. | §2.2.1 |
| C4 | The admin Google account has a passkey or hardware security key enrolled as 2FA. | Check Google account security settings. | §2.2.1-2 |
| C5 | The public Hugo site contains no login form, registration form, or password reset anywhere. | Manual sweep + grep built output for `<form` occurrences other than none expected. | §2.2.1-5 |
| C6 | Access revocation works: removing a member in `sanity.io/manage` terminates their access on next Studio load. | Rehearse once with a test member (or defer to documented procedure check in G2). | §2.2.1-4 |

## D. Content Model (PRD §2.3)

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| D1 | `blogPost` schema enforces required fields: `title`, `slug`, `summary` (≤200 chars), `body`, `coverImage` with required alt text, `publishedAt`. Publishing without any of them is blocked by Studio validation. | Attempt to publish a post missing each required field in turn. | §2.3 |
| D2 | `slug` auto-generates from title and remains editable. | Create post in Studio, observe slug field. | §2.3 |
| D3 | `seo.metaDesc` and `seo.ogImage` are optional; when absent, rendered pages fall back to `summary` and `coverImage` respectively. | Publish a post without SEO fields; inspect `<meta name="description">` and `og:image` in output. | §2.3 |
| D4 | **Anti-goal check:** schema has no categories, tags, gallery, keywords, or author fields. | Review schema file. | §2.3 deferred |

## E. Non-Functional (PRD §4)

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| E1 | LCP < 2.5s on simulated 4G mobile for the blog post template. | Lighthouse mobile run (CI or manual) on a real post. | §4.1 |
| E2 | Lighthouse Performance ≥ 90 on the blog post template, measured in CI. | Lighthouse CI report on PR. | §4.1, §7.3 |
| E3 | Post images are served through Sanity's image pipeline with format negotiation (WebP/AVIF), and non-hero images have `loading="lazy"`. | Inspect `<img>` tags and response `Content-Type` in devtools. | §4.1 |
| E4 | Public pages pass axe with no critical/serious violations; semantic landmarks (`<main>`, `<nav>`, `<article>`) present; visible focus states. | axe DevTools manual pass on home, `/blog/`, one post, one legal page + keyboard tab-through. | §4.2 |
| E5 | Every page has a unique `<title>`, `<meta description>`, and canonical URL; posts have Open Graph + Twitter Card tags falling back to cover image. | View source on home, listing, post. | §4.3 |
| E6 | `sitemap.xml` and RSS (`/index.xml`) exist in production and include the published post; drafts excluded. | Fetch both URLs. | §4.3 |
| E7 | Preview deployments are not indexable (`X-Robots-Tag: noindex` header on Vercel previews); production is indexable via `robots.txt`. | `curl -I` a preview URL and prod URL, compare headers/robots.txt. | §4.3 |
| E8 | A Sanity dataset export has been run at least once and stored in the designated private cloud folder; procedure documented. | Confirm export file exists; runbook section G2. | §4.4 |
| E9 | Privacy Policy names the chosen analytics vendor; Affiliate Disclosure is FTC-compliant boilerplate linked from footer; no cookie banner present (and none needed). | Read both pages; confirm analytics choice matches. | §4.5 |

## F. CI Gates (PRD §7) — enforced on every PR

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| F1 | `hugo --minify --gc` completes with zero warnings. | CI job status. | §7.1 |
| F2 | Internal link check (`htmltest` or similar) passes. | CI job status. | §7.2 |
| F3 | Lighthouse CI on the post template: Performance ≥ 90, Accessibility ≥ 95. | CI job status. | §7.3 |
| F4 | Automated a11y scan (`pa11y` or axe-cli) passes on one representative page. | CI job status. | §7.4 |
| F5 | CI runs on every PR and blocks merge on failure. | Branch protection settings + a deliberately failing test PR. | §7 |

## G. Operations & Runbook (PRD §8)

| ID | Criterion | Verify by | PRD ref |
|----|-----------|-----------|---------|
| G1 | `README.md` at repo root documents: local dev, creating a post, previewing a draft, manual rebuild, rollback, backup export. | Read README against the §8 list. | §8 |
| G2 | Each runbook procedure has been executed once successfully — including an actual rollback via Vercel (previous deployment → Promote) and one backup export. | Rehearsal log noted in README or PR description. | §8, §4.4 |
| G3 | The Sanity→Vercel webhook is secured with `SANITY_WEBHOOK_SECRET`, and all secrets live in Vercel env vars / git-ignored `.env.local` — none committed to the repo. | `git log -p` grep for token patterns; check Vercel dashboard. | §3.3 |

---

## Out of scope (do not build, do not fix)

Search, categories/tags, related posts, reading time, reviews, affiliate links pages, click tracking, newsletter, comments, multi-author, content scheduling UI. See PRD §6 for the iteration each belongs to.
