import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEmbedding, EMBEDDING_DIM } from '@/lib/embeddings'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { query, topK = 5, tags, embeddingProvider, ollamaBaseUrl, geminiApiKey } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, {
      preferredProvider: embeddingProvider || 'ollama',
      ollamaBaseUrl: ollamaBaseUrl || undefined,
      geminiApiKey: geminiApiKey || process.env.GEMINI_API_KEY || undefined,
    })

    const vectorStr = `[${queryEmbedding.embedding.join(',')}]`

    // Build tag filter (optional)
    let tagFilter = ''
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Filter documents by tags (JSON array contains check)
      const tagConditions = tags.map((t: string) => `d.tags LIKE '%"${t.replace(/'/g, "''").replace(/"/g, '\\"')}"%'`).join(' OR ')
      tagFilter = `AND (${tagConditions})`
    }

    // Cosine similarity search against user's documents
    const results = await prisma.$queryRawUnsafe(`
      SELECT
        c.id,
        c.content,
        c."chunkIndex",
        c.metadata,
        d.id as "documentId",
        d.name as "documentName",
        d.type as "documentType",
        d.tags,
        1 - (c.embedding <=> $1::vector) as similarity
      FROM "DocumentChunk" c
      JOIN "Document" d ON d.id = c."documentId"
      WHERE d."userId" = $2
      ${tagFilter}
      ORDER BY c.embedding <=> $1::vector
      LIMIT $3
    `, vectorStr, userId, topK) as any[]

    return NextResponse.json({
      ok: true,
      results: results.map(r => ({
        id: r.id,
        content: r.content,
        chunkIndex: r.chunkIndex,
        metadata: JSON.parse(r.metadata || '{}'),
        documentId: r.documentId,
        documentName: r.documentName,
        documentType: r.documentType,
        similarity: parseFloat(r.similarity),
      })),
      queryProvider: queryEmbedding.provider,
    })
  } catch (e: unknown) {
    console.error('RAG search error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Search failed' },
      { status: 500 }
    )
  }
}

