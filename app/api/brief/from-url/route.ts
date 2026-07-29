import { NextRequest, NextResponse } from 'next/server'

// Server-side URL fetcher for the "auto-fill brief from a URL" on-ramp.
// The browser can't cross-origin fetch arbitrary pages, so we do it here and
// return clean text. No LLM and no API key — the extraction runs client-side
// through the user's own provider. SSRF-guarded, size- and time-capped.

const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 500_000
const MAX_TEXT_CHARS = 6000
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36'

/** Reject non-http(s) and hosts that could reach internal/private networks. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '0.0.0.0' || h === '::1' || h === '[::1]') return true
  // IPv4 private / loopback / link-local ranges
  if (/^127\./.test(h)) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true
  return false
}

function normalizeUrl(raw: string): URL | null {
  let candidate = raw.trim()
  if (!candidate) return null
  if (!/^https?:\/\//i.test(candidate)) candidate = 'https://' + candidate
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (isBlockedHost(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

/** Read at most MAX_BYTES from the response body. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return await res.text()
  const decoder = new TextDecoder()
  let out = ''
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    out += decoder.decode(value, { stream: true })
    if (total >= MAX_BYTES) { try { await reader.cancel() } catch { /* ignore */ } break }
  }
  return out
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function extractTitle(html: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
  const desc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    ''
  return decodeEntities([t, desc].filter(Boolean).join(' — ')).trim().slice(0, 300)
}

function htmlToText(html: string): string {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(body).replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_CHARS)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const url = normalizeUrl(typeof body.url === 'string' ? body.url : '')
    if (!url) {
      return NextResponse.json({ ok: false, error: 'invalid_or_blocked_url' }, { status: 400 })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `fetch_failed_${res.status}` }, { status: 502 })
    }
    const ctype = res.headers.get('content-type') || ''
    if (!/text\/html|application\/xhtml|text\/plain/i.test(ctype)) {
      return NextResponse.json({ ok: false, error: 'unsupported_content_type' }, { status: 415 })
    }

    const html = await readCapped(res)
    const title = extractTitle(html)
    const text = htmlToText(html)
    if (!text) {
      return NextResponse.json({ ok: false, error: 'no_readable_content' }, { status: 422 })
    }

    return NextResponse.json({ ok: true, url: url.toString(), title, text })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'fetch_error'
    const aborted = msg.includes('abort')
    return NextResponse.json(
      { ok: false, error: aborted ? 'timeout' : msg },
      { status: aborted ? 504 : 500 },
    )
  }
}
