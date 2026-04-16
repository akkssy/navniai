import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEmbeddings, chunkText, parseFileContent, EMBEDDING_DIM } from '@/lib/embeddings'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tags = formData.get('tags') as string | null
    const embeddingProvider = formData.get('embeddingProvider') as string | null
    const ollamaBaseUrl = formData.get('ollamaBaseUrl') as string | null
    const geminiApiKey = formData.get('geminiApiKey') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedTypes = ['txt', 'md', 'csv']
    if (!allowedTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()
    if (!content.trim()) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Parse and chunk
    const parsed = parseFileContent(content, ext)
    const chunks = chunkText(parsed, 500, 50)

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks, {
      preferredProvider: (embeddingProvider as 'ollama' | 'gemini') || 'ollama',
      ollamaBaseUrl: ollamaBaseUrl || undefined,
      geminiApiKey: geminiApiKey || process.env.GEMINI_API_KEY || undefined,
    })

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId,
        name: file.name,
        type: ext,
        size: file.size,
        tags: tags || '[]',
        chunkCount: chunks.length,
      },
    })

    // Insert chunks with embeddings using raw SQL (Prisma doesn't support vector type natively)
    for (let i = 0; i < chunks.length; i++) {
      const vectorStr = `[${embeddings[i].embedding.join(',')}]`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "documentId", content, embedding, metadata, "chunkIndex")
         VALUES ($1, $2, $3, $4::vector, $5, $6)`,
        `${document.id}_chunk_${i}`,
        document.id,
        chunks[i],
        vectorStr,
        JSON.stringify({ provider: embeddings[i].provider, model: embeddings[i].model }),
        i
      )
    }

    return NextResponse.json({
      ok: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        chunkCount: chunks.length,
        embeddingProvider: embeddings[0]?.provider || 'unknown',
      },
    })
  } catch (e: unknown) {
    console.error('RAG upload error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

