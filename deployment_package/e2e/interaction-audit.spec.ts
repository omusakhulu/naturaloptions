import { test, expect, type Page } from '@playwright/test'
import { login } from './auth'

const DEFAULT_MAX_PAGES = 25

function getBaseURL() {
  return process.env.E2E_BASE_URL || 'http://localhost:3000'
}

function baseOrigin() {
  return new URL(getBaseURL()).origin
}

function isInternal(url: URL) {
  return url.origin === baseOrigin() && (url.pathname.startsWith('/en/') || url.pathname === '/' || url.pathname === '/en')
}

function shouldAvoidClickByName(name: string) {
  const n = name.trim().toLowerCase()
  if (!n) return true

  // Always avoid sign-out style items (would break the run)
  if (n.includes('logout') || n.includes('sign out') || n.includes('signout')) return true

  // Avoid navigation collapse toggles etc.
  if (n.includes('backdrop')) return true

  // Destructive actions guarded by env
  const destructive =
    n.includes('delete') ||
    n.includes('remove') ||
    n.includes('archive') ||
    n.includes('publish') ||
    n.includes('void') ||
    n.includes('cancel')

  if (destructive && process.env.E2E_ALLOW_DESTRUCTIVE !== 'true') return true

  return false
}

async function collectInternalLinks(page: Page) {
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll(nodes => nodes.map(n => (n as HTMLAnchorElement).getAttribute('href') || ''))

  const out: string[] = []

  for (const href of hrefs) {
    if (!href) continue
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue

    let u: URL | null = null
    try {
      u = new URL(href, page.url())
    } catch {
      continue
    }

    u.hash = ''
    u.search = ''

    if (!isInternal(u)) continue
    out.push(u.toString())
  }

  return Array.from(new Set(out))
}

async function scanRedundancy(page: Page) {
  // Flags duplicate primary action buttons (same accessible name).
  const buttons = page.getByRole('button')
  const count = await buttons.count()
  const nameToCount = new Map<string, number>()

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i)
    if (!(await btn.isVisible().catch(() => false))) continue

    const name = (await btn.innerText().catch(() => '')).trim()
    if (!name) continue

    nameToCount.set(name, (nameToCount.get(name) || 0) + 1)
  }

  const redundant = Array.from(nameToCount.entries())
    .filter(([, c]) => c >= 2)
    .map(([n, c]) => `${n} (x${c})`)

  return redundant
}

test.describe('E2E Audit - Interaction & redundancy (seeded/dev)', () => {
  test('Crawl a subset of pages and validate clickable elements', async ({ page }) => {
    const maxPages = Number(process.env.E2E_INTERACTION_MAX_PAGES || DEFAULT_MAX_PAGES)

    await login(page)

    const start = `${getBaseURL()}/`

    const queue: string[] = [start]
    const visited = new Set<string>()

    const issues: Array<{ url: string; issue: string }> = []

    while (queue.length && visited.size < maxPages) {
      const url = queue.shift()!
      if (visited.has(url)) continue
      visited.add(url)

      const res = await page.goto(url)
      if (!res) {
        issues.push({ url, issue: 'No response returned from navigation' })
        continue
      }

      if (res.status() >= 400) {
        issues.push({ url, issue: `HTTP ${res.status()}` })
        continue
      }

      await page.waitForLoadState('domcontentloaded')

      const bodyText = await page.locator('body').innerText().catch(() => '')
      if (bodyText.includes('NaN') || bodyText.includes('Infinity')) {
        issues.push({ url, issue: 'Contains NaN/Infinity in rendered text' })
      }

      // Redundancy scan
      const redundant = await scanRedundancy(page)
      for (const r of redundant) issues.push({ url, issue: `Redundant button label: ${r}` })

      // Click audit (safe subset)
      const buttons = page.getByRole('button')
      const btnCount = await buttons.count()

      for (let i = 0; i < Math.min(btnCount, 40); i++) {
        const btn = buttons.nth(i)
        if (!(await btn.isVisible().catch(() => false))) continue
        if (!(await btn.isEnabled().catch(() => false))) continue

        const name = ((await btn.innerText().catch(() => '')) || '').trim()
        if (shouldAvoidClickByName(name)) continue

        // Avoid clicks that cause full page unload unless it's an expected navigation
        const nav = page.waitForNavigation({ timeout: 3000 }).then(
          () => true,
          () => false
        )

        try {
          await btn.click({ timeout: 3000 })

          const didNav = await nav
          if (didNav) {
            // If navigation happened, make sure we didn't get redirected to login or 404.
            const landed = page.url()
            if (landed.includes('/en/pages/auth/login-v2') || landed.includes('/404')) {
              issues.push({ url, issue: `Button "${name}" navigated to bad destination: ${landed}` })
            }
            // return to original page
            await page.goto(url)
            await page.waitForLoadState('domcontentloaded')
          }
        } catch (e) {
          issues.push({ url, issue: `Button click failed: "${name}" :: ${(e as Error).message}` })
        }
      }

      // Enqueue more pages
      const links = await collectInternalLinks(page)
      for (const next of links) {
        if (!visited.has(next)) queue.push(next)
      }
    }

    const issueText = issues.map(i => `${i.url} :: ${i.issue}`).join('\n')
    expect(issues, issueText).toEqual([])
  })
})
