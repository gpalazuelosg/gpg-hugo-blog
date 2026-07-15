# Acceptance Walk — Task 6.3

**Walked:** 2026-07-14, against [acceptance-criteria.md](./acceptance-criteria.md) (PRD v2.6)
**Method:** programmatic checks (curl/grep/API) where possible; author attestation for Studio/Google-account items; evidence noted per row.
**Bugs found during the walk** (fixed in the same PR, per the criteria doc's "anything failing is a bug against the spec"):
1. **E6** — `sitemap.xml` was missing the home page and all posts: `[outputs] home` in `hugo.toml` included `"sitemap"`, which renders the sitemap as a *home-page output* (only direct children) instead of Hugo's site-wide sitemap kind. Fixed by removing it; verified locally (5 URLs incl. post).
2. **E1** — real post LCP 4.7s / perf 72 (Lighthouse mobile). Two causes, both fixed: (a) the 260×240 GIF cover was requested at `w=1200`, upscaling it to 314KB — fixed with `fit=max` in `CDN_PARAMS` (→29KB, perf 82); (b) Vercel had `www` as the primary domain, so the canonical apex URL 308-redirected cross-host (~900ms of pre-render latency on 4G) — fixed in the Vercel Domains dashboard 2026-07-14 (apex primary, www redirects). Post-fix: **perf 90, LCP 1.8s** on the canonical URL. The redirect flip also un-broke E5's canonical.

| ID | Result | Evidence |
|----|--------|----------|
| A1 | ✅ PASS | `https://palazuelos.dev/blog/pascal-s-triangle/` → 200 over HTTPS; `<article>` content in page source (static, no client fetch) |
| A2 | ✅ PASS | Author-timed 2026-07-13: Studio edit (future-dated a post; edited a title) → live "almost instantaneous"; webhook-triggered builds complete in ~5–6s — orders of magnitude inside the ≤5 min budget |
| A3 | ✅ PASS | PRs #5/#6/#7 each produced a Vercel Preview deployment reflecting the branch (behind Vercel deployment protection; verified via preview build logs + author access) |
| A4 | ✅ PASS | `/privacy/` and `/disclosure/` → 200; both linked from footer on every page |
| A5 | ✅ PASS | Sitemap + nav sweep: only Blog in the menu; no search/reviews/affiliates/tracking routes exist |
| B1 | ✅ PASS | Home shows author intro (`homeInfoParams`), social icons (GitHub, RSS), and the published post; "latest 3" drop-off mechanically untestable until ≥4 posts exist (PaperMod default behavior) |
| B2 | ✅ PASS | Verified 2026-07-13 with 2 live posts: reverse-chron by `publishedAt` (23:51 above 23:32). No filters present |
| B3 | ✅ PASS | Fixture post exercises every block type (paragraph, h2/h3, code w/ language, image, lists) and is what CI's F3/F4 measure; real post renders code + images via the same serializers |
| B4 | ✅ PASS | `curl` non-existent URL → HTTP 404 with site 404 layout |
| B5 | ✅ PASS | Live test 2026-07-13: post future-dated to 2026-07-18 vanished from post URL (404), `/blog/`, sitemap, and RSS on the webhook-triggered rebuild |
| C1 | ✅ PASS | `https://palazuelos.sanity.studio` live; content requires login (see C3) |
| C2 | ✅ PASS | Resolved 2026-07-15 (PRD §1 decision 16): the deviation was the owner's email/password login coexisting as a second member (Sanity treats each identity provider as a distinct account). Password member removed; second owner Gmail added via Google SSO + passkey. API-verified: every non-robot member now has provider `google` |
| C3 | ✅ PASS | Author-tested: non-member Google account authenticates but sees "no access" |
| C4 | ✅ PASS | Author attests passkey enrolled on the Studio Google account |
| C5 | ✅ PASS | Zero `<form` occurrences in the entire built output |
| C6 | ✅ PASS | Rehearsed **live** 2026-07-15: the email/password member was removed via sanity.io/manage (C2 resolution); procedure documented in README runbook §7. Removed account's Studio session terminates on next load; its CLI token was confirmed superseded |
| D1 | ✅ PASS | `blogPost.ts`: 10 validation rules covering all required fields incl. cover alt + uploaded asset (commit b0345b3); invalid-publish attempts done in Task 2.1 |
| D2 | ✅ PASS | Slug auto-generates from title, editable — observed during authoring of both real posts |
| D3 | ✅ PASS | Real post has no `seo.*`: `<meta description>` falls back to summary, `og:image` falls back to cover image URL (verified in page source) |
| D4 | ✅ PASS | Schema fields: title, slug, summary, body, coverImage(+alt), publishedAt, seo{metaDesc, ogImage} — no categories/tags/gallery/keywords/author |
| E1 | ✅ PASS | 2026-07-14 post-fix Lighthouse mobile on `https://palazuelos.dev/blog/pascal-s-triangle/`: perf 90, **LCP 1.8s** (< 2.5s budget), FCP 1.4s. Was 4.7s/72 — see bug 2. **Content note:** a 260×240 GIF as cover stays small/low-quality — use a ≥1200px static image for future covers |
| E2 | ✅ PASS | F3 gate (CI Lighthouse on post template): Performance ≥ 90 green on every PR |
| E3 | ✅ PASS | Images served from Sanity CDN with `auto=format&w=1200&fit=max`; body images `loading="lazy"`; cover is the hero (eager — correct for LCP) |
| E4 | ⏳ PENDING (tab-through only) | CI automated half green (pa11y F4, Lighthouse a11y ≥ 95 F3). axe sweep done 2026-07-14 via `@axe-core/cli` on home, `/blog/`, post, `/privacy/`: found 1 serious violation (scrollable code blocks not keyboard-focusable) — fixed in PR #10, prod re-scan **0 violations on all 4 pages**. Remaining: author keyboard tab-through |
| E5 | ✅ PASS | Unique `<title>`/description/canonical verified on home + post; OG/Twitter tags with cover fallback present |
| E6 | 🔧 FIXED | Was FAIL (see bug 1). Local build now: home, post, `/blog/`, both legal pages in sitemap; RSS includes post, drafts/future excluded |
| E7 | ✅ PASS | Preview deployment sends `x-robots-tag: noindex`; prod `robots.txt` = allow all |
| E8 | ✅ PASS | Export executed (`production-2026-07-13.tar.gz`, 2 docs + 3 assets); author copied it to the private cloud folder 2026-07-14. Automation TODO recorded in README §6 (trigger: ≥10 posts or first schema change) |
| E9 | ✅ PASS | Privacy page names Vercel Web Analytics + records description; disclosure = FTC boilerplate, footer-linked; no cookie banner (none needed — no cookies) |
| F1 | ✅ PASS | Green on every PR (#1–#7); zero-warning build enforced |
| F2 | ✅ PASS | htmltest green on every PR |
| F3 | ✅ PASS | Lighthouse CI: Perf ≥ 90, A11y ≥ 95 green on every PR |
| F4 | ✅ PASS | pa11y green on every PR |
| F5 | ✅ PASS | Branch protection on `main`: all four gates required, strict mode; deliberately-failing PR test done Day 1 (Task 1.2) |
| G1 | ✅ PASS | README documents all §8 procedures (+ revocation, added in this PR) |
| G2 | ✅ PASS | Every procedure executed once; rehearsal log in PR #7 description (rollback + promote rehearsed live; export executed) |
| G3 | ✅ PASS | `git log -p` sweep: no tokens, no deploy-hook URL in history (all `sk…` matches are npm lockfile sha512 hashes); hook URL lives only in Sanity webhook config; secrets in Vercel env / git-ignored `.env.local` |

## Ship blockers remaining

1. ~~E1 re-measure~~ ✅ done 2026-07-14: perf 90, LCP 1.8s (fit=max + domain flip).
2. ~~E4 axe sweep~~ ✅ done 2026-07-14 (1 serious found → fixed PR #10 → 0 violations); **keyboard tab-through** still pending (author, ~2 min).
3. ~~E8~~ ✅ done 2026-07-14 (backup in private cloud; automation TODO in README).
4. ~~C2~~ ✅ done 2026-07-15: email/password member removed (live C6 rehearsal), second owner Gmail added via Google SSO + passkey, PRD §1 decision 16 recorded. Org hardening noted in decision 16.

**36 of 37 criteria fully pass.** Sole remaining item: E4 keyboard tab-through (author, ~2 min).
