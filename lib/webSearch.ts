// NavniAI - Multi-Provider Web Search (Tool-Augmented Generation)
// Unified search layer: Serper → Brave → DuckDuckGo (cascade fallback)
// + Tavily for deep research extraction

// ─── Shared Types ───

export interface SearchResult {
  title: string
  link: string
  snippet: string
  position: number
  source: 'serper' | 'brave' | 'duckduckgo' | 'tavily'
}

export interface SearchResponse {
  results: SearchResult[]
  peopleAlsoAsk?: { question: string; snippet: string }[]
  relatedSearches?: string[]
  query: string
  provider: string
  cached: boolean
}

export interface DeepResearchResult {
  answer: string
  sources: { title: string; url: string; content: string }[]
  query: string
  provider: 'tavily'
}

// ─── Cache ───
const searchCache = new Map<string, SearchResponse>()
const deepCache = new Map<string, DeepResearchResult>()

// ═══════════════════════════════════════════════════════════════
// PROVIDER 1: Serper (Google results via serper.dev)
// Free: 2,500 searches (one-time)
// ═══════════════════════════════════════════════════════════════

async function searchSerper(query: string, numResults = 10): Promise<SearchResponse | null> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, numResults, provider: 'serper' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null

    return {
      results: (data.organic || []).map((r: any, i: number) => ({
        title: r.title || '', link: r.link || '',
        snippet: r.snippet || '', position: i + 1, source: 'serper' as const,
      })),
      peopleAlsoAsk: (data.peopleAlsoAsk || []).map((r: any) => ({
        question: r.question || '', snippet: r.snippet || '',
      })),
      relatedSearches: (data.relatedSearches || []).map((r: any) =>
        typeof r === 'string' ? r : r.query || ''
      ),
      query, provider: 'serper', cached: false,
    }
  } catch { return null }
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER 2: Brave Search (brave.com/search/api)
// Free: 2,000 searches/month (recurring)
// ═══════════════════════════════════════════════════════════════

async function searchBrave(query: string, numResults = 10): Promise<SearchResponse | null> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, numResults, provider: 'brave' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null

    return {
      results: (data.web?.results || []).map((r: any, i: number) => ({
        title: r.title || '', link: r.url || '',
        snippet: r.description || '', position: i + 1, source: 'brave' as const,
      })),
      relatedSearches: (data.query?.related_queries || []).slice(0, 5),
      query, provider: 'brave', cached: false,
    }
  } catch { return null }
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER 3: DuckDuckGo (no API key needed - always available)
// Free: Unlimited
// ═══════════════════════════════════════════════════════════════

async function searchDuckDuckGo(query: string): Promise<SearchResponse | null> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, provider: 'duckduckgo' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null

    return {
      results: (data.results || []).map((r: any, i: number) => ({
        title: r.title || '', link: r.link || '',
        snippet: r.snippet || '', position: i + 1, source: 'duckduckgo' as const,
      })),
      relatedSearches: data.relatedSearches || [],
      query, provider: 'duckduckgo', cached: false,
    }
  } catch { return null }
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER 4: Tavily (Deep Research - AI-extracted content)
// Free: 1,000 searches/month (recurring)
// Used ONLY for deep research, not quick search
// ═══════════════════════════════════════════════════════════════

async function deepResearchTavily(query: string): Promise<DeepResearchResult | null> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, provider: 'tavily', searchDepth: 'advanced' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null

    return {
      answer: data.answer || '',
      sources: (data.results || []).map((r: any) => ({
        title: r.title || '', url: r.url || '', content: r.content || '',
      })),
      query, provider: 'tavily',
    }
  } catch { return null }
}


// ═══════════════════════════════════════════════════════════════
// ORCHESTRATOR - Cascade search with automatic fallback
// ═══════════════════════════════════════════════════════════════

/**
 * Quick Search - Cascade through providers until one succeeds
 * Priority: Serper → Brave → DuckDuckGo (always works)
 */
export async function quickSearch(query: string, numResults = 10): Promise<SearchResponse> {
  const cacheKey = `quick:${query.toLowerCase().trim()}`
  if (searchCache.has(cacheKey)) {
    return { ...searchCache.get(cacheKey)!, cached: true }
  }

  // Try providers in priority order
  const result =
    (await searchSerper(query, numResults)) ||
    (await searchBrave(query, numResults)) ||
    (await searchDuckDuckGo(query))

  if (result) {
    searchCache.set(cacheKey, result)
    return result
  }

  // All providers failed - return empty
  return { results: [], query, provider: 'none', cached: false }
}

/**
 * Deep Research - Uses Tavily for AI-extracted content
 * Only call this for topics needing factual depth
 */
export async function deepResearch(query: string): Promise<DeepResearchResult | null> {
  const cacheKey = `deep:${query.toLowerCase().trim()}`
  if (deepCache.has(cacheKey)) return deepCache.get(cacheKey)!

  const result = await deepResearchTavily(query)
  if (result) deepCache.set(cacheKey, result)
  return result
}

/**
 * Full Research - Quick search + optional deep research
 * The Researcher agent's primary entry point
 */
export async function fullResearch(
  queries: string[],
  options: { deep?: boolean } = {}
): Promise<{ quick: SearchResponse[]; deep: DeepResearchResult | null }> {
  // Run all quick searches in parallel
  const quickResults = await Promise.all(
    queries.map(q => quickSearch(q).catch(() => ({
      results: [], query: q, provider: 'none', cached: false,
    } as SearchResponse)))
  )

  // Deep research on the primary query only (conserve Tavily credits)
  let deepResult: DeepResearchResult | null = null
  if (options.deep && queries.length > 0) {
    deepResult = await deepResearch(queries[0]).catch(() => null)
  }

  return { quick: quickResults, deep: deepResult }
}

// ═══════════════════════════════════════════════════════════════
// LLM CONTEXT FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format quick search results for LLM injection
 */
export function formatQuickSearchForLLM(responses: SearchResponse[]): string {
  const allResults = responses.flatMap(r => r.results)
  if (!allResults.length) return ''

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allResults.filter(r => {
    if (seen.has(r.link)) return false
    seen.add(r.link)
    return true
  })

  const lines: string[] = [
    `\n\n--- WEB SEARCH RESULTS (${unique.length} sources from ${[...new Set(responses.map(r => r.provider))].join(', ')}) ---`,
  ]

  for (const r of unique.slice(0, 10)) {
    lines.push(`[${r.position}] ${r.title}`)
    lines.push(`    URL: ${r.link}`)
    lines.push(`    ${r.snippet}`)
    lines.push(`    (via ${r.source})`)
    lines.push('')
  }

  // Aggregate "People Also Ask" from all responses
  const paa = responses.flatMap(r => r.peopleAlsoAsk || []).slice(0, 4)
  if (paa.length) {
    lines.push('PEOPLE ALSO ASK:')
    for (const q of paa) {
      lines.push(`  Q: ${q.question}`)
      lines.push(`  A: ${q.snippet}`)
    }
    lines.push('')
  }

  // Aggregate related searches
  const related = [...new Set(responses.flatMap(r => r.relatedSearches || []))].slice(0, 6)
  if (related.length) {
    lines.push(`RELATED SEARCHES: ${related.join(' | ')}`)
  }

  lines.push('--- END SEARCH RESULTS ---\n')
  return lines.join('\n')
}

/**
 * Format deep research results for LLM injection
 */
export function formatDeepResearchForLLM(result: DeepResearchResult): string {
  if (!result) return ''

  const lines: string[] = [
    `\n\n--- DEEP RESEARCH (Tavily AI Extract) ---`,
  ]

  if (result.answer) {
    lines.push(`SUMMARY: ${result.answer}`)
    lines.push('')
  }

  for (const s of result.sources.slice(0, 5)) {
    lines.push(`SOURCE: ${s.title}`)
    lines.push(`  URL: ${s.url}`)
    lines.push(`  ${s.content.slice(0, 500)}`)
    lines.push('')
  }

  lines.push('--- END DEEP RESEARCH ---\n')
  return lines.join('\n')
}

/**
 * Extract search queries from a content brief
 */
export function generateSearchQueries(brief: Record<string, any>): string[] {
  const topic = brief.topic || brief.task || ''
  const audience = brief.audience || ''
  const keywords = brief.keywords || ''

  const queries: string[] = []
  if (topic) {
    queries.push(topic)
    if (audience) queries.push(`${topic} for ${audience}`)
    if (keywords) queries.push(`${keywords} ${topic} best practices 2026`)
  }
  return queries.slice(0, 3)
}
