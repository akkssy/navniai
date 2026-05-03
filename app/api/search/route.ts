// NavniAI - Multi-Provider Search Proxy
// Routes search requests to the correct provider, keeps API keys server-side

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query, numResults = 10, provider = 'serper', searchDepth } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
    }

    // ─── SERPER ───
    if (provider === 'serper') {
      const apiKey = process.env.SERPER_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'SERPER_API_KEY not configured' })

      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
        body: JSON.stringify({ q: query, num: numResults }),
      })
      if (!res.ok) return NextResponse.json({ error: `Serper: ${res.status}` }, { status: res.status })
      return NextResponse.json(await res.json())
    }

    // ─── BRAVE ───
    if (provider === 'brave') {
      const apiKey = process.env.BRAVE_SEARCH_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'BRAVE_SEARCH_API_KEY not configured' })

      const params = new URLSearchParams({ q: query, count: String(numResults) })
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': apiKey },
      })
      if (!res.ok) return NextResponse.json({ error: `Brave: ${res.status}` }, { status: res.status })
      return NextResponse.json(await res.json())
    }

    // ─── DUCKDUCKGO (no API key needed) ───
    if (provider === 'duckduckgo') {
      // Use DuckDuckGo HTML endpoint and parse results
      const params = new URLSearchParams({ q: query })
      const res = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NavniAI/1.0)',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })
      if (!res.ok) return NextResponse.json({ error: `DDG: ${res.status}` }, { status: res.status })

      const html = await res.text()
      // Parse DuckDuckGo HTML results
      const results: any[] = []
      const linkRegex = /<a rel="nofollow" class="result__a" href="([^"]*)"[^>]*>(.*?)<\/a>/g
      const snippetRegex = /<a class="result__snippet"[^>]*>(.*?)<\/a>/g

      const links: string[] = []
      const titles: string[] = []
      const snippets: string[] = []

      let match
      while ((match = linkRegex.exec(html)) !== null) {
        links.push(match[1])
        titles.push(match[2].replace(/<[^>]*>/g, ''))
      }
      while ((match = snippetRegex.exec(html)) !== null) {
        snippets.push(match[1].replace(/<[^>]*>/g, ''))
      }

      for (let i = 0; i < Math.min(links.length, numResults); i++) {
        results.push({
          title: titles[i] || '',
          link: links[i] || '',
          snippet: snippets[i] || '',
        })
      }

      return NextResponse.json({ results, relatedSearches: [] })
    }

    // ─── TAVILY ───
    if (provider === 'tavily') {
      const apiKey = process.env.TAVILY_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'TAVILY_API_KEY not configured' })

      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: searchDepth || 'basic',
          include_answer: true,
          max_results: numResults,
        }),
      })
      if (!res.ok) return NextResponse.json({ error: `Tavily: ${res.status}` }, { status: res.status })
      return NextResponse.json(await res.json())
    }

    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
