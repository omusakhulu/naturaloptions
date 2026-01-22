import { test, expect } from '@playwright/test'
import { login } from './auth'

function getBaseOrigin() {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'
  return new URL(baseURL).origin
}

function isInternalAppUrl(url: URL) {
  if (url.origin !== getBaseOrigin()) return false
  return url.pathname.startsWith('/en/') || url.pathname === '/' || url.pathname === '/en'
}

function normalizeUrl(raw: string, base: string) {
  try {
    return new URL(raw, base)
  } catch {
    return null
  }
}

test.describe('E2E Audit - Crawler (routes, links, NaN/Infinity, blank pages)', () => {
  test('Crawl from / and validate discovered routes', async ({ page }) => {
    const maxPages = Number(process.env.E2E_MAX_PAGES || 60)
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

    await login(page)

    const queue: string[] = [`${baseURL}/`]
    const visited = new Set<string>()

    const issues: Array<{ url: string; issue: string }> = []

    const disallowedPathSnippets = ['/404', '/en/pages/auth/login-v2', '/en/login']

    while (queue.length && visited.size < maxPages) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const res = await page.goto(current)

      if (!res) {
        issues.push({ url: current, issue: 'No response returned from navigation' })
        continue
      }

      const status = res.status()
      if (status >= 400) {
        issues.push({ url: current, issue: `HTTP ${status}` })
        continue
      }

      await page.waitForLoadState('domcontentloaded')

      const landed = new URL(page.url())
      for (const bad of disallowedPathSnippets) {
        if (landed.pathname.includes(bad)) {
          issues.push({ url: current, issue: `Unexpected redirect: landed on ${landed.pathname}` })
        }
      }

      const bodyText = await page.locator('body').innerText().catch(() => '')
      if (!bodyText.trim()) {
        issues.push({ url: current, issue: 'Blank screen (empty body text)' })
      }

      if (bodyText.includes('NaN') || bodyText.includes('Infinity')) {
        issues.push({ url: current, issue: 'Contains NaN/Infinity in rendered text' })
      }

      const loadingLike = /loading/i.test(bodyText) || (await page.locator('.animate-spin').count().catch(() => 0)) > 0
      if (loadingLike) {
        const settled = await page.waitForLoadState('networkidle', { timeout: 8000 }).then(
          () => true,
          () => false
        )
        if (!settled) {
          issues.push({ url: current, issue: 'Potential hang: loading indicator present and network did not go idle' })
        }
      }

      const hrefs = await page
        .locator('a[href]')
        .evaluateAll(nodes => nodes.map(n => (n as HTMLAnchorElement).getAttribute('href') || ''))

      for (const href of hrefs) {
        if (!href) continue
        if (href.startsWith('mailto:') || href.startsWith('tel:')) continue
        if (href.startsWith('#')) continue

        const u = normalizeUrl(href, page.url())
        if (!u) continue

        u.hash = ''
        u.search = ''

        if (!isInternalAppUrl(u)) continue

        const normalized = u.toString()
        if (!visited.has(normalized)) queue.push(normalized)
      }
    }

    const issueText = issues.map(i => `${i.url} :: ${i.issue}`).join('\n')
    expect(issues, issueText).toEqual([])
  })
})
