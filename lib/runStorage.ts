// NavniAI - Run History Persistence (localStorage)
// Stores up to MAX_RUNS pipeline runs with full step outputs for offline-first access.
// Falls back gracefully when localStorage is unavailable (SSR, quota exceeded).

export interface StoredStepResult {
  stepId: string
  agentId: string
  agentName: string
  action: string
  status: string
  output: string
  provider: string
  structured?: any // AgentStructuredOutput from agentOutputParser
  orderIndex: number
}

export interface StoredRun {
  id: string
  pipelineType: string // 'content' | 'custom' | template id
  name: string
  status: string       // 'completed' | 'failed'
  briefJson?: any      // ContentBrief or custom inputs
  executionTime: number
  stepsTotal: number
  stepsCompleted: number
  startedAt: string    // ISO date
  completedAt?: string // ISO date
  steps: StoredStepResult[]
}

export interface RunStats {
  totalRuns: number
  completedRuns: number
  failedRuns: number
  avgExecutionTime: number
}

const STORAGE_KEY = 'navniai_run_history'
const MAX_RUNS = 50

// ─── Internal Helpers ───

function readAll(): StoredRun[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(runs: StoredRun[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs))
  } catch {
    // Quota exceeded — evict oldest runs and retry
    try {
      const trimmed = runs.slice(0, Math.floor(MAX_RUNS / 2))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch { /* give up */ }
  }
}

function generateId(): string {
  return 'run_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

// ─── Public API ───

/** Save a completed run. Returns the stored run with generated ID. */
export function saveRun(run: Omit<StoredRun, 'id'>): StoredRun {
  const stored: StoredRun = { ...run, id: generateId() }
  const runs = readAll()
  runs.unshift(stored) // newest first
  // Enforce max runs limit
  if (runs.length > MAX_RUNS) runs.length = MAX_RUNS
  writeAll(runs)
  return stored
}

/** List recent runs, newest first. */
export function listRuns(limit = 20): StoredRun[] {
  return readAll().slice(0, limit)
}

/** Get a single run by ID. */
export function getRun(id: string): StoredRun | null {
  return readAll().find(r => r.id === id) ?? null
}

/** Delete a run by ID. */
export function deleteRun(id: string): void {
  writeAll(readAll().filter(r => r.id !== id))
}

/** Clear all run history. */
export function clearAllRuns(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

/** Compute aggregate stats from stored runs. */
export function getRunStats(): RunStats {
  const runs = readAll()
  const completed = runs.filter(r => r.status === 'completed')
  const totalTime = completed.reduce((sum, r) => sum + (r.executionTime || 0), 0)
  return {
    totalRuns: runs.length,
    completedRuns: completed.length,
    failedRuns: runs.length - completed.length,
    avgExecutionTime: completed.length > 0 ? totalTime / completed.length : 0,
  }
}

/** Rebuild outputs record from stored steps (for re-opening in ContentPackageView). */
export function rebuildOutputs(run: StoredRun): Record<string, any> {
  const outputs: Record<string, any> = {}
  for (const step of run.steps) {
    outputs[step.stepId] = {
      output: step.output,
      status: step.status,
      provider: step.provider,
      structured: step.structured ?? null,
    }
  }
  return outputs
}

/** Rebuild nodeAgentMap from stored steps (for ContentPackageView tab routing). */
export function rebuildNodeAgentMap(run: StoredRun): Record<string, string> {
  const map: Record<string, string> = {}
  for (const step of run.steps) {
    map[step.stepId] = step.agentId
  }
  return map
}
