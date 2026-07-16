# Iteration 1 Plan — "Make it findable"

**Derived from:** [reviewed-prd.md](./reviewed-prd.md) v2.8 §6 Iteration 1, plus two ops gaps found during the MVP acceptance walk
**Status:** Draft for review — becomes binding once merged
**Budget:** ~3 days (PRD §6). Every code change lands via PR with the four F1–F4 gates green (PRD §1 decision 13 continues to apply).
**Rule of the road:** unchanged — new decisions land in PRD §1 before they're built. Decisions 17–19 (this iteration's) are already recorded.

## 1. Scope

From PRD §6 Iteration 1:

1. **Search** on the site — PaperMod's built-in Fuse.js search (PRD §1 decision 17 amends §6's original "Pagefind").
2. **Categories + tags** on `blogPost` — schema migration + taxonomy pages.
3. **Related posts** on the post template (Hugo `.Related`).
4. **Reading time** estimate on posts.

Ops carry-ins (both triggered by MVP findings, both now PRD §1 decisions):

5. **Backup automation** (decision 18): monthly GitHub Actions export to a private backups repo. The tags/categories schema change is the agreed trigger; the pre-migration export doubles as the workflow's first rehearsal.
6. **Daily rebuild cron** (decision 19): closes the scheduled-post gap — future-dated posts appear within 24h of their `publishedAt` without manual action.

**Out of scope** (unchanged from PRD §6): reviews, affiliate links, click tracking, newsletter, comments, multi-author.

## 2. Task Breakdown (one branch/PR per task)

### Day 1 — Ops rails first (before any schema change)

| # | Task | Branch | Verify |
|---|------|--------|--------|
| 1.1 | `.github/workflows/backup.yml`: monthly cron + `workflow_dispatch`; runs `sanity dataset export production`, pushes the archive to the private `gpg-blog-backups` repo. Secrets: `SANITY_EXPORT_TOKEN` (existing Viewer robot token suffices — read access to all datasets), `BACKUP_REPO_PAT` (fine-grained PAT, contents:write on the backups repo only). **Gerardo:** create the private repo + PAT | `feat/backup-automation` | I6: one successful `workflow_dispatch` run; archive visible in private repo |
| 1.2 | `.github/workflows/daily-rebuild.yml`: daily cron POSTs `$VERCEL_DEPLOY_HOOK` (Actions secret — same capability-secret trust level as Sanity's webhook config, decision 14). Schedule ~06:00 UTC | `feat/daily-rebuild` | I7: manual dispatch → Vercel deploy appears. Live test: Docker post self-appears on 2026-07-18 |
| 1.3 | **Pre-migration export** via the new backup workflow (satisfies PRD §4.4 "export before every schema change") | — (workflow run) | Archive dated pre-migration exists in backups repo |

### Day 2 — Content model + pipeline

| # | Task | Branch | Verify |
|---|------|--------|--------|
| 2.1 | Schema: add `tags` and `categories` to `blogPost` — both **optional** arrays of strings (tag-style input). No other schema changes | `feat/taxonomies-schema` | I2: authorable in Studio; publish works with both absent |
| 2.2 | Pipeline + site: GROQ + front matter emit `tags`/`categories`; `hugo.toml` re-enables taxonomies (remove `disableKinds`, add `[taxonomies]`); PaperMod renders tag chips + `/tags/`, `/categories/` term pages. Tag the fixture post so CI's F3/F4 measure the taxonomy-bearing template. **Amend acceptance-criteria.md anti-goal rows A5/B2/D4 in the same PR** (they currently prohibit categories/tags/filters — superseded per PRD §6) | `feat/taxonomies` | I3; F1–F4 green; MVP walk rows stay valid |

### Day 3 — Findability features + close-out

| # | Task | Branch | Verify |
|---|------|--------|--------|
| 3.1 | Search: add `"JSON"` to `[outputs] home` (⚠️ *not* `"sitemap"` — see the E6 lesson in `hugo.toml`'s comment), `content/search.md` with `layout: search`, Search entry in the main menu. PaperMod's Fuse.js does the rest | `feat/search` | I1 |
| 3.2 | Related posts: `[related]` config in `hugo.toml` (indices: tags, categories, date) + minimal template override rendering `.Related` links at the end of a post. Reading time: `ShowReadingTime = true` (param already staged with an Iteration-1 comment) | `feat/related-reading` | I4, I5 |
| 3.3 | Iteration acceptance walk: verify I1–I8, record results in this file (new section), mark iteration complete | `chore/iteration-1-walk` | All I-criteria |

## 3. Acceptance Criteria (binding for this iteration)

| ID | Criterion | Verify by |
|----|-----------|-----------|
| I1 | Site search reachable from the main menu; querying a distinctive word from a published post returns that post; empty/garbage queries degrade gracefully | Manual query on prod |
| I2 | `tags` and `categories` are optional Studio fields; publishing without them still works (no new required-field regressions) | Studio publish test |
| I3 | Post pages show their tags; `/tags/<term>/` lists all posts with that term; term pages excluded from "no out-of-scope routes" sweeps | Browser + sitemap check |
| I4 | A post sharing ≥1 tag with another shows it under related posts; posts with no shared tags fall back to date-based relatedness | Two tagged posts on prod |
| I5 | Posts display an estimated reading time | Visual check |
| I6 | Backup workflow: ≥1 successful run with the archive stored in the private backups repo; monthly cron enabled; pre-migration export exists dated before the schema change | Workflow run log + private repo contents |
| I7 | A future-dated post appears on prod within 24h of its `publishedAt` with no manual action (live test: Docker post, 2026-07-18) | Check prod on/after 07-18 |
| I8 | All MVP gates (F1–F4) stay green throughout; MVP criteria remain satisfied except A5/B2/D4, which are amended (not violated) per PRD §6 | CI + spot-check of MVP walk rows |

## 4. Walk Results (task 3.3, 2026-07-16)

All six build tasks shipped: PRs #16 (daily rebuild), #17 (backup workflow), #18 (schema), #19 (taxonomies), #20 (search), #21 (related + reading time). All F1–F4 gates green on every PR.

| ID | Result | Evidence |
|----|--------|----------|
| I1 | ✅ PASS (mechanics) | `/search/` → 200 on prod, Search in main menu, `/index.json` contains the post incl. distinctive body words. Author's confirming query: pending (~30s) |
| I2 | ✅ PASS | Fields optional in schema (validated, deployed); pre-existing posts unaffected — prod builds unchanged for untagged content |
| I3 | ⏳ CONTENT-PENDING | Mechanics verified: CI/local `--buildDrafts` builds render `/tags/ci/`, `/tags/fixture/` and tag chips via the tagged fixture. No *published* post carries tags yet — passes live once the author tags posts in Studio |
| I4 | ⏳ CONTENT-PENDING | Mechanics verified in all three shapes locally: shared tag → "Related posts"; no shared tags → "More posts" (newest-posts fallback — Hugo's date index only matches same-day posts, so the fallback is explicit in the template); single post → no section. Live check follows I3 |
| I5 | ✅ PASS | Prod post shows "2 min" |
| I6 | ✅ PASS | `production-2026-07-16.tar.gz` in the private backups repo via `workflow_dispatch` run (also the pre-migration export); monthly cron armed |
| I7 | ✅ mechanism / ⏳ live | Manual dispatch → deploy hook fired → Vercel deploy succeeded. Live test: the Docker post (publishedAt 2026-07-18) must appear without manual action by 2026-07-19 06:00 UTC |
| I8 | ✅ PASS | F1–F4 green on PRs #16–#21; prod sitemap healthy (8 URLs incl. `/search/`); MVP criteria spot-checked (post 200, legal pages, RSS) |

**Close-out conditions:** author tags the published posts (flips I3/I4 live), runs one search query (I1 confirmation), and the Docker post self-publishes on 07-18 (I7 live). No code work remains.

## 5. Risks

| Risk | Mitigation |
|------|------------|
| Schema change corrupts content | Pre-migration export (task 1.3) before any schema deploy; fields are additive + optional |
| Taxonomy/term pages fail Lighthouse a11y or htmltest gates | Fixture post gets tags in task 2.2, so gates measure the new templates from the first PR |
| Fuse.js JSON index grows with content | Non-issue at current scale; revisit (Pagefind remains the documented alternative) if search latency degrades at 100+ posts |
| Daily cron burns Vercel builds | 1 build/day ≈ 30/mo, negligible on Hobby; disable the workflow if quota ever matters |
