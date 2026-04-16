// NavniAI - 3-Tier Embedding Module
// Supports: Ollama (local), Gemini API (cloud), with auto-fallback
// All produce 768-dimensional vectors (EmbeddingGemma compatible)

export type EmbeddingProvider = 'ollama' | 'gemini'

export const EMBEDDING_DIM = 768

interface EmbeddingResult {
  embedding: number[]
  provider: EmbeddingProvider
  model: string
}

// ─── Ollama Embeddings (Tier 2: Local) ───
async function embedWithOllama(
  text: string,
  baseUrl = 'http://localhost:11434'
): Promise<EmbeddingResult> {
  const res = await fetch(`${baseUrl}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'embeddinggemma',
      input: text,
    }),
  })
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`)
  const data = await res.json()
  const embedding = data.embeddings?.[0] ?? data.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding dim: ${embedding?.length}`)
  }
  return { embedding, provider: 'ollama', model: 'embeddinggemma' }
}

// ─── Gemini Embeddings (Tier 3: Cloud) ───
async function embedWithGemini(
  text: string,
  apiKey: string
): Promise<EmbeddingResult> {
  const model = 'text-embedding-004'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIM,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini embed failed: ${res.status} - ${err}`)
  }
  const data = await res.json()
  const embedding = data.embedding?.values
  if (!embedding || embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected Gemini dim: ${embedding?.length}`)
  }
  return { embedding, provider: 'gemini', model }
}

// ─── Auto-fallback Embedding ───
export async function generateEmbedding(
  text: string,
  options?: {
    preferredProvider?: EmbeddingProvider
    ollamaBaseUrl?: string
    geminiApiKey?: string
  }
): Promise<EmbeddingResult> {
  const preferred = options?.preferredProvider ?? 'ollama'
  const errors: string[] = []

  // Try preferred provider first
  const providers: Array<() => Promise<EmbeddingResult>> = []

  if (preferred === 'ollama') {
    providers.push(() => embedWithOllama(text, options?.ollamaBaseUrl))
    if (options?.geminiApiKey) {
      providers.push(() => embedWithGemini(text, options.geminiApiKey!))
    }
  } else {
    if (options?.geminiApiKey) {
      providers.push(() => embedWithGemini(text, options.geminiApiKey!))
    }
    providers.push(() => embedWithOllama(text, options?.ollamaBaseUrl))
  }

  for (const tryEmbed of providers) {
    try {
      return await tryEmbed()
    } catch (e: unknown) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  throw new Error(`All embedding providers failed: ${errors.join('; ')}`)
}

// ─── Batch Embedding (for chunked documents) ───
export async function generateEmbeddings(
  texts: string[],
  options?: {
    preferredProvider?: EmbeddingProvider
    ollamaBaseUrl?: string
    geminiApiKey?: string
  }
): Promise<EmbeddingResult[]> {
  // Process sequentially to avoid rate limits
  const results: EmbeddingResult[] = []
  for (const text of texts) {
    results.push(await generateEmbedding(text, options))
  }
  return results
}

// ─── Text Chunking ───
export function chunkText(
  text: string,
  maxChunkSize = 500,
  overlap = 50
): string[] {
  const words = text.split(/\s+/)
  if (words.length <= maxChunkSize) return [text]

  const chunks: string[] = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + maxChunkSize, words.length)
    chunks.push(words.slice(start, end).join(' '))
    start = end - overlap
    if (start >= words.length - overlap) break
  }
  return chunks.filter(c => c.trim().length > 0)
}

// ─── File Parsing ───
export function parseFileContent(content: string, fileType: string): string {
  switch (fileType) {
    case 'csv': {
      // Convert CSV rows to readable text
      const lines = content.split('\n').filter(l => l.trim())
      if (lines.length < 2) return content
      const headers = lines[0].split(',').map(h => h.trim())
      return lines.slice(1).map(line => {
        const vals = line.split(',')
        return headers.map((h, i) => `${h}: ${vals[i]?.trim() || ''}`).join(', ')
      }).join('\n')
    }
    case 'md':
    case 'txt':
    default:
      return content
  }
}

