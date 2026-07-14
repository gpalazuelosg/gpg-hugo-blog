# palazuelos.dev

Technical blog. Static Hugo site fed at build time from Sanity, deployed on
Vercel. The spec lives in [`documents/`](documents/) — the
[PRD](documents/reviewed-prd.md) is the source of truth,
[acceptance-criteria.md](documents/acceptance-criteria.md) is binding, and the
[implementation plan](documents/implementation-plan.md) maps spec to artifacts.

**How a post gets published:** author writes in Sanity Studio → Publish →
Sanity webhook POSTs to a Vercel Deploy Hook → Vercel runs
`node scripts/fetch-content.mjs && hugo -s src/site --minify --gc` → static
output goes live. No servers, no manual steps.

## Repository layout

```
package.json          Build orchestration (fetch → hugo)
vercel.json           Vercel build command, output dir, HUGO_VERSION
scripts/fetch-content.mjs   GROQ fetch → Portable Text → Markdown
src/site/             Hugo source (all hugo commands take -s src/site)
src/studio/           Sanity Studio (separate npm package)
documents/            PRD, acceptance criteria, implementation plan
.github/workflows/    CI: the four PRD §7 gates (F1–F4)
```

## Environment variables

Names in [`.env.example`](.env.example); values live in Vercel project env
vars and a git-ignored `.env.local`. `SANITY_API_READ_TOKEN` is a read-only
Viewer token. There is no webhook signing secret in MVP — the Vercel Deploy
Hook URL itself is the capability secret and is stored only in Sanity's
webhook config (PRD §1 decision 14).

---

## Runbook (PRD §8)

### 1. Run locally

```sh
npm install                       # once, repo root
cp .env.example .env.local        # once; fill in values
npm run build:local               # fetch content + full production build
npm run dev                       # live server at http://localhost:1313
```

`npm run dev` serves whatever is in `src/site/content/blog/` (last fetch) plus
drafts and future-dated posts. Run `npm run fetch:local` first to refresh
content.

Studio locally (rarely needed — the hosted Studio is primary):

```sh
cd src/studio && npm install && npx sanity dev   # http://localhost:3333
```

### 2. Create a new post

Write it in the hosted Studio at **https://palazuelos.sanity.studio** (login:
project members only). All required fields (`title`, `slug`, `summary`,
`body`, `coverImage` + alt, `publishedAt`) are enforced by schema validation —
Publish is blocked until they pass. Publishing triggers the webhook and the
post is live within a minute or two.

**Scheduled posts:** a future `publishedAt` keeps the post off the site
(build-time filter `publishedAt <= now()`). ⚠️ It will **not** appear
automatically when that time arrives — builds are triggered by document
changes, not by the clock. On/after the publish time, trigger a rebuild
(procedure 4) or make any trivial re-publish in Studio.

### 3. Preview a draft

- **Draft content:** review it in Studio's editor pane. A fully rendered
  preview of unpublished content is **not wired in MVP** (the build only
  fetches published posts — by design, acceptance B5). If a rendered check is
  essential, set `publishedAt` to a past time, publish, verify, then
  unpublish — or wait for the Studio-preview iteration.
- **Code changes:** open a PR — Vercel posts a Preview deployment URL on it
  reflecting that branch (with production content). Previews send
  `X-Robots-Tag: noindex` and are behind Vercel deployment protection.

### 4. Trigger a manual rebuild (webhook failed or scheduled post due)

POST to the project's Deploy Hook URL (treat it as a secret — PRD §1
decision 14). It is stored in two dashboards:
Vercel → project → Settings → Git → Deploy Hooks (`sanity-publish`), and
Sanity → sanity.io/manage → API → Webhooks (`vercel-deploy-on-publish`).

```sh
curl -X POST "$DEPLOY_HOOK_URL"    # returns {"job":{"state":"PENDING",...}}
```

Alternative without the URL: Vercel dashboard → Deployments → latest →
**Redeploy**, or `npx vercel redeploy <deployment-url>` with the CLI.

### 5. Roll back production

```sh
npx vercel ls gpg-hugo-blog --prod          # find the last good deployment
npx vercel rollback <deployment-url>        # point prod at it (~2s)
npx vercel promote  <deployment-url>        # roll forward again when fixed
```

Dashboard equivalent: project → Deployments → previous deployment → ⋯ →
**Instant Rollback** (or Promote to Production). Note: a rollback pins prod
to that deployment; webhook-triggered builds of new content still create
deployments but rolling forward requires an explicit promote (or the next
`main` push).

### 6. Export a Sanity backup

```sh
cd src/studio
npx sanity dataset export production ~/sanity-backups/production-$(date +%F).tar.gz
```

Then copy the archive to the designated **private** cloud folder (not this
repo). Run before every schema change, and monthly once the post count grows
(PRD §4.4). Restore path: `npx sanity dataset import <file> <dataset>`.

---

## CI gates (every PR, blocking)

| Gate | Check |
|------|-------|
| F1 | `hugo --minify --gc` builds with zero warnings |
| F2 | `htmltest` — no broken internal links |
| F3 | Lighthouse: Performance ≥ 90, Accessibility ≥ 95 |
| F4 | `pa11y` on the post template |

CI builds with the committed fixture post only (no Sanity fetch — no secrets
in CI, deterministic builds). Analytics (Vercel Web Analytics) is emitted
only when `VERCEL_ENV=production`, so CI and previews never see it.
