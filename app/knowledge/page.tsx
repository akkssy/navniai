'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SparklesIcon, ArrowUpTrayIcon, TrashIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface Document {
  id: string; name: string; type: string; size: number
  tags: string[]; chunkCount: number; createdAt: string
}

interface SearchResult {
  id: string; content: string; similarity: number
  documentName: string; documentType: string; chunkIndex: number
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [embeddingProvider, setEmbeddingProvider] = useState<'ollama' | 'gemini'>('ollama')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/rag/documents')
      const data = await res.json()
      if (data.ok) setDocuments(data.documents)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadStatus(`Uploading ${file.name}...`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('embeddingProvider', embeddingProvider)
      formData.append('ollamaBaseUrl', ollamaUrl)
      const res = await fetch('/api/rag/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.ok) {
        setUploadStatus(`✅ ${data.document.name} — ${data.document.chunkCount} chunks (${data.document.embeddingProvider})`)
        fetchDocuments()
      } else {
        setUploadStatus(`❌ ${data.error}`)
      }
    } catch (err: unknown) {
      setUploadStatus(`❌ ${err instanceof Error ? err.message : 'Upload failed'}`)
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document and all its chunks?')) return
    try {
      const res = await fetch('/api/rag/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      })
      const data = await res.json()
      if (data.ok) fetchDocuments()
    } catch { /* ignore */ }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery, topK: 5,
          embeddingProvider, ollamaBaseUrl: ollamaUrl,
        }),
      })
      const data = await res.json()
      if (data.ok) setSearchResults(data.results)
    } catch { /* ignore */ }
    setSearching(false)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="border-b border-surface-300 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <SparklesIcon className="h-7 w-7 text-accent-500" />
              <span className="text-xl font-bold text-ink-700">NavniAI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">Dashboard</Link>
              <Link href="/settings" className="text-sm text-ink-400 hover:text-ink-700 transition-colors">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="section-label mb-3">Knowledge Base</p>
          <h1 className="heading-serif text-3xl font-bold tracking-tight mb-2 text-ink-700">Your Documents</h1>
          <p className="text-ink-400 text-sm max-w-xl">
            Upload documents to give your AI pipelines context. Supports .txt, .md, and .csv files.
            Documents are chunked and embedded with EmbeddingGemma (768-dim vectors).
          </p>
        </div>

        {/* Embedding Provider Toggle */}
        <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-ink-500">Embedding Provider:</span>
          <div className="flex gap-2">
            {(['ollama', 'gemini'] as const).map(p => (
              <button key={p} onClick={() => setEmbeddingProvider(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
                  embeddingProvider === p
                    ? 'bg-accent-50 border-accent-200 text-accent-600'
                    : 'bg-surface-50 border-surface-300 text-ink-400 hover:text-ink-700'
                }`}>
                {p === 'ollama' ? '🦙 Ollama (Local)' : '💎 Gemini (Cloud)'}
              </button>
            ))}
          </div>
          {embeddingProvider === 'ollama' && (
            <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
              className="bg-surface-50 border border-surface-300 rounded-md px-3 py-1.5 text-xs text-ink-700 w-64"
              placeholder="Ollama URL" />
          )}
        </div>

        {/* Upload Area */}
        <div className="glass-card p-6 mb-6 border-dashed border-2 border-surface-400 hover:border-accent-300 transition text-center">
          <ArrowUpTrayIcon className="h-8 w-8 text-ink-300 mx-auto mb-3" />
          <label className="cursor-pointer">
            <span className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
              {uploading ? '⏳ Processing...' : '📄 Upload Document'}
            </span>
            <input type="file" accept=".txt,.md,.csv" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          <p className="text-[11px] text-ink-300 mt-2">Supports .txt, .md, .csv • Max recommended: 5MB</p>
          {uploadStatus && (
            <p className="text-xs mt-3 text-ink-500">{uploadStatus}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Document List */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-300 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4 text-accent-500" />
                Documents ({documents.length})
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-ink-400 text-xs">Analyzing patterns...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-ink-300 text-xs">No documents yet. Upload one above.</div>
            ) : (
              <div className="divide-y divide-surface-300 max-h-[500px] overflow-y-auto">
                {documents.map(doc => (
                  <div key={doc.id} className="px-5 py-3.5 hover:bg-surface-50 transition flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {doc.type === 'md' ? '📝' : doc.type === 'csv' ? '📊' : '📄'}
                        </span>
                        <span className="text-sm font-medium text-ink-700 truncate">{doc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 text-ink-400 border border-surface-300">
                          {doc.chunkCount} chunks
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-300">
                        <span>{formatSize(doc.size)}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        {doc.tags.length > 0 && doc.tags.map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-accent-50 text-accent-600 text-[10px]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-ink-300 hover:text-red-500 transition">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Semantic Search */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-300">
              <h2 className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-accent-500" />
                Semantic Search
              </h2>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search your knowledge base..."
                  className="flex-1 bg-surface-50 border border-surface-300 rounded-md px-3 py-2 text-xs text-ink-700 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition" />
                <button onClick={handleSearch} disabled={searching}
                  className="btn-primary text-xs px-4 py-2">
                  {searching ? '...' : '🔍 Search'}
                </button>
              </div>
              {searchResults.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {searchResults.map((r) => (
                    <div key={r.id} className="p-3 rounded-md bg-surface-50 border border-surface-300">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-accent-600">{r.documentName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {(r.similarity * 100).toFixed(1)}% match
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 line-clamp-3">{r.content}</p>
                      <span className="text-[10px] text-ink-300 mt-1 block">Chunk #{r.chunkIndex + 1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-300 text-center py-8">
                  Search across all your uploaded documents using natural language.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

