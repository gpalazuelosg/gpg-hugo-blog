// Fetches published blogPost documents from Sanity and writes one Markdown
// file per post to src/site/content/blog/<slug>.md, ready for Hugo to build.
// Implementation-plan §3.1; acceptance B3 (all block types), B5 (drafts
// never leak), D3 (SEO fallbacks).

import {createClient} from '@sanity/client'
import {toHTML} from '@portabletext/to-html'
import {mkdir, writeFile, readdir, unlink} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_DIR = join(REPO_ROOT, 'src/site/content/blog')
const KEEP_ENTRIES = new Set(['_index.md', 'fixture-post'])

const {
  SANITY_PROJECT_ID,
  SANITY_DATASET = 'production',
  SANITY_API_READ_TOKEN,
  MIN_POSTS = '0',
} = process.env

if (!SANITY_PROJECT_ID || !SANITY_API_READ_TOKEN) {
  console.error(
    'fetch-content: SANITY_PROJECT_ID and SANITY_API_READ_TOKEN are required',
  )
  process.exit(1)
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: SANITY_API_READ_TOKEN,
  useCdn: false,
  perspective: 'published',
})

// The `publishedAt <= now()` clause IS the draft/scheduled-post gate (B5).
// Body's image blocks need their asset dereferenced so the serializer can
// build a CDN URL — top-level coverImage/seo.ogImage are dereferenced too.
const QUERY = `
  *[_type == "blogPost" && defined(publishedAt) && publishedAt <= now()]
  | order(publishedAt desc) {
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    tags,
    categories,
    coverImage{ asset->{url}, alt },
    body[]{
      ...,
      _type == "image" => { ..., asset->{url} }
    },
    seo{ metaDesc, ogImage{ asset->{url} } }
  }
`

// fit=max: never upscale — a 260px source stays 260px instead of being
// inflated to w=1200 (a 314KB→29KB difference on the first real cover, and
// the difference between failing and passing the E1 LCP budget).
const CDN_PARAMS = '?auto=format&w=1200&fit=max'

const escapeHtmlAttr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// YAML double-quoted string: only `\` and `"` need escaping.
const escapeYaml = (s) =>
  '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'

const components = {
  types: {
    // Emit a Markdown fenced block wrapped in blank lines so Goldmark treats
    // it as a Markdown block (Chroma-highlighted) and not as raw HTML inside
    // whatever HTML block precedes/follows it. Filename is dropped for MVP;
    // add support when a post actually needs it (Iteration 1 candidate).
    code: ({value}) => {
      const lang = value?.language ?? 'text'
      const code = value?.code ?? ''
      return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`
    },
    // Inline images: Sanity CDN URL + required alt + lazy-loading. Hero
    // image is set from front matter separately.
    image: ({value}) => {
      const url = value?.asset?.url
      const alt = value?.alt
      if (!url) throw new Error('body image is missing asset.url')
      if (!alt || !alt.trim()) {
        throw new Error('body image is missing required alt text')
      }
      const src = escapeHtmlAttr(url + CDN_PARAMS)
      return `<img src="${src}" alt="${escapeHtmlAttr(alt)}" loading="lazy" />`
    },
  },
}

function readPath(post, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), post)
}

function requireField(post, path) {
  const v = readPath(post, path)
  if (v === undefined || v === null || v === '') {
    const slug = post.slug ?? '(no slug)'
    throw new Error(`post "${slug}" is missing required field: ${path}`)
  }
  return v
}

function buildFrontMatter(post) {
  const description = post.seo?.metaDesc?.trim() || post.summary
  const coverUrl = post.coverImage.asset.url + CDN_PARAMS
  const lines = [
    '---',
    `title: ${escapeYaml(post.title)}`,
    `date: ${post.publishedAt}`,
    `summary: ${escapeYaml(post.summary)}`,
    `description: ${escapeYaml(description)}`,
    'cover:',
    `  image: ${escapeYaml(coverUrl)}`,
    `  alt: ${escapeYaml(post.coverImage.alt)}`,
  ]
  // Optional taxonomies (iteration-1-plan task 2.2) — omit the key entirely
  // when unset so Hugo sees the same front matter shape as pre-Iteration-1.
  for (const taxo of ['tags', 'categories']) {
    const values = (post[taxo] ?? []).filter((v) => v && String(v).trim())
    if (values.length > 0) {
      lines.push(`${taxo}:`, ...values.map((v) => `  - ${escapeYaml(v)}`))
    }
  }
  // seo.ogImage falls back to coverImage when absent (D3). PaperMod uses the
  // cover.image for the OG tag by default, so we only add an override when
  // ogImage is set AND differs from the cover.
  const ogUrl = post.seo?.ogImage?.asset?.url
  if (ogUrl && ogUrl !== post.coverImage.asset.url) {
    lines.push(`images:`, `  - ${escapeYaml(ogUrl + CDN_PARAMS)}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}

async function cleanGeneratedPosts() {
  const entries = await readdir(OUTPUT_DIR, {withFileTypes: true})
  for (const entry of entries) {
    if (KEEP_ENTRIES.has(entry.name)) continue
    if (entry.isFile() && entry.name.endsWith('.md')) {
      await unlink(join(OUTPUT_DIR, entry.name))
    }
  }
}

async function main() {
  const posts = await client.fetch(QUERY)
  const minPosts = Number.parseInt(MIN_POSTS, 10) || 0
  if (posts.length < minPosts) {
    throw new Error(
      `fetched ${posts.length} posts, but MIN_POSTS=${minPosts} — refusing to build`,
    )
  }

  await mkdir(OUTPUT_DIR, {recursive: true})
  await cleanGeneratedPosts()

  for (const post of posts) {
    requireField(post, 'title')
    requireField(post, 'slug')
    requireField(post, 'summary')
    requireField(post, 'publishedAt')
    requireField(post, 'coverImage.asset.url')
    requireField(post, 'coverImage.alt')
    requireField(post, 'body')

    const body = toHTML(post.body, {components})
    const file = buildFrontMatter(post) + body + '\n'
    const path = join(OUTPUT_DIR, `${post.slug}.md`)
    await writeFile(path, file, 'utf8')
    console.log(`fetch-content: wrote ${post.slug}.md`)
  }

  console.log(`fetch-content: ${posts.length} post(s) written`)
}

main().catch((err) => {
  console.error(`fetch-content: ${err.message}`)
  process.exit(1)
})
