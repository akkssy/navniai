import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List user's documents
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        tags: true,
        chunkCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      documents: documents.map(d => ({
        ...d,
        tags: JSON.parse(d.tags || '[]'),
      })),
    })
  } catch (e: unknown) {
    console.error('RAG list error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'List failed' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a document and its chunks
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await req.json()
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // Verify ownership
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    })
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete chunks first, then document (cascade should handle this, but explicit is safer)
    await prisma.documentChunk.deleteMany({ where: { documentId } })
    await prisma.document.delete({ where: { id: documentId } })

    return NextResponse.json({ ok: true, deleted: documentId })
  } catch (e: unknown) {
    console.error('RAG delete error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Delete failed' },
      { status: 500 }
    )
  }
}

