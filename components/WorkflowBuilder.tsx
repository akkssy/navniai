'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { SparklesIcon, ArrowLeftIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { executeWorkflowClientSide, AGENT_THINKING_MESSAGES, type StepProgress, type OnStreamCallback, type OnCheckpointCallback, type CheckpointRequest, type CheckpointDecision } from '../lib/workflowExecutor'
import { loadSettings, getProviderBadge, PROVIDER_REGISTRY, type LLMProviderKey } from '../lib/llmProviders'
import { getTemplateById } from '../lib/pipelineTemplates'
import { AgentNode } from './AgentNode'
import { AgentPalette } from './AgentPalette'
import { NodeConfigPanel } from './NodeConfigPanel'
import { ContentBriefForm, type ContentBrief } from './ContentBriefForm'
import { ContentPackageView } from './ContentPackageView'
import { saveRun, getRun, rebuildOutputs, rebuildNodeAgentMap } from '../lib/runStorage'

const nodeTypes = {
  agentNode: AgentNode,
}

export interface AgentAction {
  id: string
  label: string
  inputs: { key: string; label: string; type: 'text' | 'textarea'; placeholder: string; required?: boolean }[]
}

export interface Agent {
  id: string
  name: string
  icon: string
  color: string
  description: string
  category: 'system' | 'custom'
  systemPrompt?: string
  actions?: AgentAction[]
}

// Built-in system agents (coding domain)
export const SYSTEM_AGENTS: Agent[] = [
  { id: 'generator', name: 'Code Generator', icon: '⚡', color: '#8b5cf6', description: 'Generate new code and features', category: 'system' },
  { id: 'reviewer', name: 'Code Reviewer', icon: '🔍', color: '#3b82f6', description: 'Analyze code quality', category: 'system' },
  { id: 'tester', name: 'Test Writer', icon: '🧪', color: '#22c55e', description: 'Generate unit tests', category: 'system' },
  { id: 'documenter', name: 'Documenter', icon: '📚', color: '#f59e0b', description: 'Create documentation', category: 'system' },
  { id: 'debugger', name: 'Debug Helper', icon: '🐛', color: '#ef4444', description: 'Debug and fix errors', category: 'system' },
  { id: 'security', name: 'Security Scanner', icon: '🔒', color: '#ec4899', description: 'Scan for vulnerabilities', category: 'system' },
  { id: 'refactor', name: 'Refactor Agent', icon: '🔄', color: '#06b6d4', description: 'Optimize and refactor code', category: 'system' },
  { id: 'devops', name: 'DevOps Agent', icon: '⚙️', color: '#84cc16', description: 'CI/CD and deployment', category: 'system' },
]

// Content Marketing agents (purpose-built for marketing pipelines)
export const MARKETING_AGENTS: Agent[] = [
  { id: 'researcher', name: 'Research Analyst', icon: '🔍', color: '#6366f1', description: 'Topic research, competitive analysis & content briefs', category: 'system' },
  { id: 'writer', name: 'Content Writer', icon: '✍️', color: '#8b5cf6', description: 'Long-form articles, blog posts & copywriting', category: 'system' },
  { id: 'editor', name: 'Content Editor', icon: '📝', color: '#f59e0b', description: 'Proofread, restructure & polish for readability', category: 'system' },
  { id: 'seo_optimizer', name: 'SEO Optimizer', icon: '📊', color: '#22c55e', description: 'On-page SEO, meta tags, schema & keyword optimization', category: 'system' },
  { id: 'social_writer', name: 'Social Media Writer', icon: '📱', color: '#ec4899', description: 'Platform-native posts for LinkedIn, X, Instagram & email', category: 'system' },
]

// Keep backward compat export
export const AGENTS = SYSTEM_AGENTS

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

// Use local Next.js API route (falls back to external gateway if configured)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''


// ─── Agent Thinking Message (cycles through contextual messages) ───
function AgentThinkingMessage({ agentId, messages }: { agentId: string; messages: string[] }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx(prev => (prev + 1) % messages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex items-center gap-2 text-[11px] text-accent-600 dark:text-accent-400">
      <span className="inline-flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1 h-1 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span className="animate-fade-in" key={idx}>{messages[idx]}</span>
    </div>
  )
}

// ─── Elapsed Time Hook ───
function useElapsedTime(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRunning) { setElapsed(0); return }
    const start = Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  return elapsed
}

export function WorkflowBuilder({ templateId, runId }: { templateId?: string; runId?: string } = {}) {
  const { data: session } = useSession()
  const template = templateId ? getTemplateById(templateId) : null
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<{ status: string; message: string } | null>(null)
  const [executionOutputs, setExecutionOutputs] = useState<Record<string, { output: string; status: string; provider?: string }> | null>(null)
  const [showOutputPanel, setShowOutputPanel] = useState(false)
  const [mode, setMode] = useState<'builder' | 'content'>('content') // Default to content marketing mode
  const [nodeAgentMap, setNodeAgentMap] = useState<Record<string, string>>({}) // nodeId → agentId for ContentPackageView
  const [pipelineProgress, setPipelineProgress] = useState<StepProgress[]>([])
  const [streamingText, setStreamingText] = useState<Record<string, string>>({}) // agentId → live text
  const streamingTextRef = useRef<Record<string, string>>({})
  const [checkpointRequest, setCheckpointRequest] = useState<CheckpointRequest | null>(null)
  const [checkpointEditing, setCheckpointEditing] = useState(false)
  const [checkpointEditText, setCheckpointEditText] = useState('')
  const [humanInTheLoop, setHumanInTheLoop] = useState(true) // toggle for HITL checkpoints
  const checkpointResolverRef = useRef<((decision: CheckpointDecision) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const templateLoaded = useRef(false)

  // ─── Saved Workflow State ───
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null)
  const [savedWorkflowName, setSavedWorkflowName] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveModalName, setSaveModalName] = useState('')
  const [showWorkflowsDrawer, setShowWorkflowsDrawer] = useState(false)
  const [savedWorkflows, setSavedWorkflows] = useState<{ id: string; name: string; updatedAt: string }[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const [customAgents, setCustomAgents] = useState<Agent[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('navniai_custom_agents')
        return saved ? JSON.parse(saved) : []
      } catch { return [] }
    }
    return []
  })

  // Persist custom agents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('navniai_custom_agents', JSON.stringify(customAgents))
    } catch { /* quota exceeded or SSR */ }
  }, [customAgents])

  // ─── Run Persistence Helper (dual-write: localStorage + API) ───
  const saveRunToStorage = (
    pipelineType: string,
    name: string,
    status: string,
    executionTime: number,
    outputs: Record<string, any>,
    briefJson?: any,
    nodeList?: Node[],
  ) => {
    const steps = Object.entries(outputs).map(([stepId, data], i) => {
      const node = nodeList?.find(n => n.id === stepId)
      return {
        stepId,
        agentId: node?.data?.agent?.id || stepId.split('-')[0] || 'unknown',
        agentName: node?.data?.agent?.name || '',
        action: node?.data?.action || 'execute',
        status: (data as any).status || 'completed',
        output: (data as any).output || '',
        provider: (data as any).provider || 'simulated',
        structured: (data as any).structured ?? null,
        orderIndex: i,
      }
    })

    const runData = {
      pipelineType,
      name,
      status,
      briefJson,
      executionTime,
      stepsTotal: steps.length,
      stepsCompleted: steps.filter(s => s.status === 'completed').length,
      startedAt: new Date(Date.now() - executionTime * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      steps,
    }

    // 1. Save to localStorage (offline cache / instant)
    try {
      saveRun(runData)
    } catch (err) {
      console.warn('Failed to persist run to localStorage:', err)
    }

    // 2. Save to PostgreSQL via API (source of truth)
    fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runData),
    }).catch(err => console.warn('Failed to persist run to API:', err))
  }

  // Load template into builder
  useEffect(() => {
    if (!templateId || templateLoaded.current) return
    const template = getTemplateById(templateId)
    if (!template) return
    templateLoaded.current = true

    const templateNodes: Node[] = template.steps.map((step, i) => {
      const agent = SYSTEM_AGENTS.find(a => a.id === step.agentId) || SYSTEM_AGENTS[0]
      return {
        id: `${step.agentId}-tpl-${i}`,
        type: 'agentNode',
        position: { x: 300, y: 80 + i * 160 },
        data: {
          agent,
          action: step.action,
          inputs: step.inputs,
          condition: '',
        },
      }
    })

    const templateEdges: Edge[] = templateNodes.slice(0, -1).map((node, i) => ({
      id: `edge-tpl-${i}`,
      source: node.id,
      target: templateNodes[i + 1].id,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }))

    setNodes(templateNodes)
    setEdges(templateEdges)
  }, [templateId, setNodes, setEdges])

  // ─── Load past run from localStorage (when ?run=<id> is in URL) ───
  const runLoaded = useRef(false)
  useEffect(() => {
    if (!runId || runLoaded.current) return
    const run = getRun(runId)
    if (!run) return
    runLoaded.current = true

    // Rebuild outputs and nodeAgentMap from stored run
    const outputs = rebuildOutputs(run)
    const agentMap = rebuildNodeAgentMap(run)

    setExecutionOutputs(outputs)
    setNodeAgentMap(agentMap)
    setShowOutputPanel(true)
    setMode(run.pipelineType === 'content' ? 'content' : 'builder')
    setRunResult({
      status: 'success',
      message: `📂 Loaded run: ${run.name} — ${run.stepsCompleted}/${run.stepsTotal} steps in ${(run.executionTime || 0).toFixed(1)}s`,
    })
  }, [runId])

  const allAgents = [...MARKETING_AGENTS, ...SYSTEM_AGENTS, ...customAgents]

  const addCustomAgent = useCallback((agent: Agent) => {
    setCustomAgents(prev => [...prev, agent])
  }, [])

  const deleteCustomAgent = useCallback((agentId: string) => {
    setCustomAgents(prev => prev.filter(a => a.id !== agentId))
  }, [])

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const addAgentNode = useCallback((agent: Agent) => {
    const newNode: Node = {
      id: `${agent.id}-${Date.now()}`,
      type: 'agentNode',
      position: { x: 250 + nodes.length * 50, y: 100 + nodes.length * 100 },
      data: {
        agent,
        action: '',
        inputs: {},
        condition: '',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, setNodes])

  const updateNodeData = useCallback((nodeId: string, data: { action: string; inputs: Record<string, any>; condition: string }) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, ...data } }
      }
      return node
    }))
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  const buildWorkflowPayload = () => {
    return {
      name: 'Custom Workflow',
      version: '1.0',
      steps: nodes.map((node) => ({
        id: node.id,
        agent: node.data.agent.id,
        agent_name: node.data.agent.name,
        agent_category: node.data.agent.category as 'system' | 'custom',
        system_prompt: node.data.agent.systemPrompt || null,
        action: node.data.action || 'execute',
        action_label: node.data.actionLabel || node.data.action || 'execute',
        depends_on: edges
          .filter((e) => e.target === node.id)
          .map((e) => e.source),
        inputs: node.data.inputs,
        condition: node.data.condition || null,
      })),
    }
  }

  // ─── Save Workflow to DB ───
  const saveWorkflow = async (name: string) => {
    setIsSaving(true)
    const config = JSON.stringify({ nodes, edges })
    try {
      if (savedWorkflowId) {
        // Update existing
        const res = await fetch(`/api/workflows/${savedWorkflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, config }),
        })
        const data = await res.json()
        if (data.ok) {
          setSavedWorkflowName(name)
          setRunResult({ status: 'success', message: `✅ Workflow "${name}" saved!` })
          setTimeout(() => setRunResult(null), 3000)
        }
      } else {
        // Create new
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, config }),
        })
        const data = await res.json()
        if (data.ok) {
          setSavedWorkflowId(data.workflow.id)
          setSavedWorkflowName(name)
          setRunResult({ status: 'success', message: `✅ Workflow "${name}" saved!` })
          setTimeout(() => setRunResult(null), 3000)
        }
      }
    } catch (err) {
      console.error('Failed to save workflow:', err)
      setRunResult({ status: 'error', message: '❌ Failed to save workflow' })
      setTimeout(() => setRunResult(null), 4000)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Load list of saved workflows ───
  const fetchSavedWorkflows = async () => {
    setLoadingWorkflows(true)
    try {
      const res = await fetch('/api/workflows')
      const data = await res.json()
      if (data.ok) setSavedWorkflows(data.workflows)
    } catch (err) {
      console.error('Failed to fetch workflows:', err)
    } finally {
      setLoadingWorkflows(false)
    }
  }

  // ─── Load a specific workflow onto the canvas ───
  const loadWorkflow = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`)
      const data = await res.json()
      if (!data.ok) return
      const { nodes: loadedNodes, edges: loadedEdges } = JSON.parse(data.workflow.config || '{}')
      if (loadedNodes) setNodes(loadedNodes)
      if (loadedEdges) setEdges(loadedEdges)
      setSavedWorkflowId(id)
      setSavedWorkflowName(name)
      setSelectedNodeId(null)
      setShowWorkflowsDrawer(false)
      setRunResult({ status: 'success', message: `📂 Loaded "${name}"` })
      setTimeout(() => setRunResult(null), 3000)
    } catch (err) {
      console.error('Failed to load workflow:', err)
    }
  }

  // ─── Delete a saved workflow ───
  const deleteWorkflow = async (id: string) => {
    try {
      await fetch(`/api/workflows/${id}`, { method: 'DELETE' })
      setSavedWorkflows(prev => prev.filter(w => w.id !== id))
      if (savedWorkflowId === id) {
        setSavedWorkflowId(null)
        setSavedWorkflowName('')
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err)
    }
  }

  // Generate a full 5-step marketing pipeline from a content brief
  const generateMarketingPipeline = async (brief: ContentBrief) => {
    // ── RAG Context Retrieval ──
    let ragContext = ''
    if (brief.useRAG) {
      try {
        const ragQuery = [brief.topic, brief.primaryKeyword, brief.audience].filter(Boolean).join(' ')
        const ragRes = await fetch('/api/rag/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: ragQuery, topK: 5 }),
        })
        const ragData = await ragRes.json()
        if (ragData.ok && ragData.results?.length > 0) {
          ragContext = '\n\n--- KNOWLEDGE BASE CONTEXT (use this for brand voice, facts & style) ---\n' +
            ragData.results.map((r: any) => `[${r.documentName}]: ${r.content}`).join('\n\n') +
            '\n--- END KNOWLEDGE BASE CONTEXT ---\n'
        }
      } catch (err) {
        console.warn('RAG retrieval failed, continuing without context:', err)
      }
    }

    const pipelineSteps = [
      { agent: 'researcher', action: 'research_topic', inputs: { topic: brief.topic, audience: brief.audience, competitors: brief.notes + ragContext } },
      { agent: 'writer', action: 'write_article', inputs: { brief: `{{researcher.output}}\n\nTopic: ${brief.topic}\nAudience: ${brief.audience}\nKeywords: ${brief.primaryKeyword}, ${brief.secondaryKeywords}${ragContext ? '\n\nBrand Context:' + ragContext : ''}`, tone: brief.tone, word_count: String(brief.wordCount) } },
      { agent: 'editor', action: 'edit_article', inputs: { content: '{{writer.output}}', brand_voice: (brief.notes || '') + (ragContext ? '\n\nReference material from knowledge base:' + ragContext : '') } },
      { agent: 'seo_optimizer', action: 'optimize_seo', inputs: { content: '{{editor.output}}', primary_keyword: brief.primaryKeyword, secondary_keywords: brief.secondaryKeywords } },
      { agent: 'social_writer', action: 'create_social_posts', inputs: { content: '{{editor.output}}', platforms: 'LinkedIn, X/Twitter, Instagram, Newsletter' } },
    ]

    const pipelineNodes: Node[] = pipelineSteps.map((step, i) => {
      const agent = MARKETING_AGENTS.find(a => a.id === step.agent) || MARKETING_AGENTS[0]
      return {
        id: `${step.agent}-pipeline-${Date.now()}-${i}`,
        type: 'agentNode',
        position: { x: 300, y: 80 + i * 160 },
        data: { agent, action: step.action, actionLabel: step.action, inputs: step.inputs, condition: '' },
      }
    })

    const pipelineEdges: Edge[] = pipelineNodes.slice(0, -1).map((node, i) => ({
      id: `edge-pipeline-${i}`,
      source: node.id,
      target: pipelineNodes[i + 1].id,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }))

    // Build node→agent map for ContentPackageView
    const agentMap: Record<string, string> = {}
    pipelineNodes.forEach((n, i) => { agentMap[n.id] = pipelineSteps[i].agent })
    setNodeAgentMap(agentMap)

    setNodes(pipelineNodes)
    setEdges(pipelineEdges)

    // Now run the pipeline
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setIsRunning(true)
    setRunResult(null)
    setExecutionOutputs(null)
    setShowOutputPanel(false)
    setStreamingText({})
    streamingTextRef.current = {}
    setCheckpointRequest(null)
    setCheckpointEditing(false)
    checkpointResolverRef.current = null

    // Initialize progress for all steps
    setPipelineProgress(pipelineSteps.map((step, i) => ({
      stepId: '',
      agentId: step.agent,
      agentName: MARKETING_AGENTS.find(a => a.id === step.agent)?.name || step.agent,
      status: 'pending' as const,
      stepIndex: i,
      totalSteps: pipelineSteps.length,
    })))

    const handleProgress = (progress: StepProgress) => {
      setPipelineProgress(prev => prev.map(p =>
        p.agentId === progress.agentId
          ? { ...p, status: progress.status, thinkingMessage: progress.thinkingMessage, startedAt: progress.startedAt || p.startedAt, completedAt: progress.completedAt }
          : p
      ))
    }

    // SSE streaming: throttle UI updates to ~15fps to avoid React render thrashing
    let streamRAF: number | null = null
    const handleStream: OnStreamCallback = (_stepId, agentId, _chunk, fullText) => {
      streamingTextRef.current = { ...streamingTextRef.current, [agentId]: fullText }
      if (!streamRAF) {
        streamRAF = requestAnimationFrame(() => {
          setStreamingText({ ...streamingTextRef.current })
          streamRAF = null
        })
      }
    }

    // Human-in-the-Loop checkpoint handler — pauses pipeline for user review
    const handleCheckpoint: OnCheckpointCallback = (request) => {
      return new Promise<CheckpointDecision>((resolve) => {
        setCheckpointRequest(request)
        setCheckpointEditText(request.output)
        setCheckpointEditing(false)
        checkpointResolverRef.current = resolve
      })
    }

    try {
      const workflow = {
        name: 'Content Marketing Pipeline',
        version: '1.0',
        steps: pipelineNodes.map((node, i) => ({
          id: node.id,
          agent: pipelineSteps[i].agent,
          agent_name: node.data.agent.name,
          agent_category: 'system' as const,
          system_prompt: node.data.agent.systemPrompt || null,
          action: pipelineSteps[i].action,
          action_label: pipelineSteps[i].action,
          depends_on: i > 0 ? [pipelineNodes[i - 1].id] : [],
          inputs: pipelineSteps[i].inputs,
          condition: null,
        })),
      }

      const payload = { workflow, inputs: {}, user_id: 'web-user', signal: abortController.signal }
      let result: any

      // Always use client-side execution for content pipeline (enables live progress + streaming + checkpoints)
      result = await executeWorkflowClientSide(payload, handleProgress, handleStream, humanInTheLoop ? handleCheckpoint : undefined)

      if (result.status === 'cancelled') {
        setRunResult({ status: 'warning', message: 'Pipeline cancelled by user' })
      } else if (result.status === 'completed' && result.outputs) {
        setExecutionOutputs(result.outputs)
        setShowOutputPanel(true)

        // Persist run to localStorage
        saveRunToStorage(
          'content',
          `Content: ${brief.topic.substring(0, 60)}`,
          'completed',
          result.execution_time || 0,
          result.outputs,
          brief,
          pipelineNodes,
        )
      }
      setRunResult({
        status: result.status === 'completed' ? 'success' : 'error',
        message: result.status === 'completed'
          ? `✅ Content package ready! ${result.steps_completed}/${result.total_steps} agents in ${(result.execution_time || 0).toFixed(1)}s`
          : `❌ Pipeline failed: ${result.error || 'Unknown error'}`
      })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setRunResult({ status: 'warning', message: 'Pipeline cancelled by user' })
      } else {
        console.error('Pipeline execution error:', error)
        setRunResult({ status: 'error', message: `Failed to run pipeline: ${error.message}` })
      }
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }

  const exportWorkflow = () => {
    const workflow = buildWorkflowPayload()
    const json = JSON.stringify(workflow, null, 2)

    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
      setRunResult({ status: 'success', message: 'Workflow JSON copied to clipboard!' })
      setTimeout(() => setRunResult(null), 3000)
    }).catch(() => {
      console.log('Workflow:', workflow)
      setRunResult({ status: 'success', message: 'Workflow logged to console (clipboard unavailable)' })
      setTimeout(() => setRunResult(null), 3000)
    })
  }

  const runWorkflow = async () => {
    // Validate: at least one node must be configured
    const unconfigured = nodes.filter(n => !n.data.action)
    if (unconfigured.length > 0) {
      setRunResult({
        status: 'error',
        message: `${unconfigured.length} node(s) not configured. Click each node to set an action.`
      })
      setTimeout(() => setRunResult(null), 5000)
      return
    }

    if (nodes.length === 0) {
      setRunResult({ status: 'error', message: 'Add at least one agent to the workflow.' })
      setTimeout(() => setRunResult(null), 3000)
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setIsRunning(true)
    setRunResult(null)
    setStreamingText({})
    streamingTextRef.current = {}
    setCheckpointRequest(null)
    checkpointResolverRef.current = null

    // Build progress entries from current nodes so the pipeline tracker renders
    const workflow = buildWorkflowPayload()
    setPipelineProgress(workflow.steps.map((step, i) => ({
      stepId: step.id,
      agentId: step.agent,
      agentName: step.agent_name || step.agent,
      status: 'pending' as const,
      stepIndex: i,
      totalSteps: workflow.steps.length,
    })))

    const handleProgress = (progress: StepProgress) => {
      setPipelineProgress(prev => prev.map(p =>
        p.stepId === progress.stepId
          ? { ...p, ...progress }
          : p
      ))
    }

    let streamRAF: number | null = null
    const handleStream: OnStreamCallback = (_stepId, agentId, _chunk, fullText) => {
      streamingTextRef.current = { ...streamingTextRef.current, [agentId]: fullText }
      if (!streamRAF) {
        streamRAF = requestAnimationFrame(() => {
          setStreamingText({ ...streamingTextRef.current })
          streamRAF = null
        })
      }
    }

    const handleCheckpoint: OnCheckpointCallback = (request) => {
      return new Promise<CheckpointDecision>((resolve) => {
        setCheckpointRequest(request)
        setCheckpointEditText(request.output)
        setCheckpointEditing(false)
        checkpointResolverRef.current = resolve
      })
    }

    try {
      const payload = { workflow, inputs: {}, user_id: 'web-user', signal: abortController.signal }

      // Always run client-side — enables live streaming, HITL, and uses the
      // user's localStorage API keys (server route can't access those)
      const result = await executeWorkflowClientSide(
        payload,
        handleProgress,
        handleStream,
        humanInTheLoop ? handleCheckpoint : undefined,
      )

      if (result.status === 'completed' && result.outputs) {
        setExecutionOutputs(result.outputs)
        setShowOutputPanel(true)

        // Persist builder run
        saveRunToStorage(
          template ? template.id : 'custom',
          template ? template.name : 'Custom Workflow',
          'completed',
          result.execution_time || 0,
          result.outputs,
          undefined,
          nodes,
        )
      }

      const statusLabel = result.status === 'completed' ? 'success'
        : result.status === 'cancelled' ? 'warning' : 'error'
      setRunResult({
        status: statusLabel,
        message: result.status === 'completed'
          ? `✅ Workflow completed! ${result.steps_completed}/${result.total_steps} steps in ${(result.execution_time || 0).toFixed(1)}s`
          : result.status === 'cancelled'
          ? '⚠️ Workflow cancelled'
          : `❌ Workflow failed: ${(result as any).error || 'Unknown error'}`
      })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setRunResult({ status: 'warning', message: '⚠️ Workflow cancelled by user' })
      } else {
        console.error('Workflow execution error:', error)
        setRunResult({ status: 'error', message: `Failed to run workflow: ${error.message}` })
      }
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }

  const configuredCount = nodes.filter(n => n.data.action).length

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-surface-300 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-ink-400 hover:text-ink-700 transition text-xs">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-surface-300" />
          <Link href="/" className="flex items-center gap-1.5">
            <SparklesIcon className="h-4.5 w-4.5 text-accent-500" />
            <span className="text-sm font-bold text-ink-700">NavniAI</span>
          </Link>
          {/* Mode toggle */}
          <div className="h-4 w-px bg-surface-300" />
          <div className="flex gap-0.5 bg-surface-100 rounded-md p-0.5 border border-surface-300">
            <button
              onClick={() => setMode('content')}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition ${mode === 'content' ? 'bg-accent-600 text-white shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}
            >
              ✨ Content Pipeline
            </button>
            <button
              onClick={() => setMode('builder')}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition ${mode === 'builder' ? 'bg-card text-ink-700 shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}
            >
              🔧 Builder
            </button>
          </div>
          {(template || savedWorkflowName) && (
            <>
              <div className="h-4 w-px bg-surface-300" />
              <span className="text-xs text-ink-500 flex items-center gap-1.5">
                {template ? (
                  <><span>{template.icon}</span>{template.name}</>
                ) : (
                  <><span>💾</span>{savedWorkflowName}</>
                )}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {session?.user && (
            <span className="text-[11px] text-ink-400">
              {session.user.name || session.user.email}
            </span>
          )}
          <ThemeToggle />
          <Link href="/settings" className="text-[11px] text-ink-400 hover:text-ink-700 transition px-2 py-1 rounded-md hover:bg-surface-100">
            ⚙️ Settings
          </Link>
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[11px] text-ink-300 hover:text-red-500 transition px-2 py-1 rounded-md hover:bg-surface-100 flex items-center gap-1"
            >
              <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

      {mode === 'content' ? (
        <>
          {/* Content Pipeline Mode */}
          <div className="flex flex-col">
            <ContentBriefForm onSubmit={generateMarketingPipeline} isRunning={isRunning} />
            {/* HITL Toggle */}
            <div className="px-4 py-2 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={humanInTheLoop}
                    onChange={(e) => setHumanInTheLoop(e.target.checked)}
                    disabled={isRunning}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-surface-300 dark:bg-surface-600 rounded-full peer-checked:bg-amber-500 peer-disabled:opacity-50 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow-sm" />
                </div>
                <span className="text-[11px] text-ink-500 dark:text-ink-400 group-hover:text-ink-700 dark:group-hover:text-ink-300 transition">
                  👁️ Review between agents
                </span>
              </label>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Running / Result status bar */}
            {(isRunning || runResult) && (
              <div className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b border-surface-300 ${
                isRunning && checkpointRequest ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' :
                isRunning ? 'bg-accent-50 text-accent-700' :
                runResult?.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                'bg-red-50 text-red-700'
              }`}>
                {isRunning ? (
                  <>
                    {checkpointRequest ? (
                      <>
                        <span>👁️</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-300">Reviewing: {checkpointRequest.agentName}</span>
                        <span className="text-[10px] opacity-70">— approve, edit, or regenerate below</span>
                      </>
                    ) : (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Agent {pipelineProgress.filter(s => s.status === 'completed').length + 1}/{pipelineProgress.length}:</span>
                        <span className="font-semibold">{pipelineProgress.find(s => s.status === 'running')?.agentName || 'Initializing...'}</span>
                        <span className="ml-auto text-[10px] opacity-70">🔗 Research → Write → Edit → SEO → Social</span>
                      </>
                    )}
                    {/* Cancel Button */}
                    <button
                      onClick={() => {
                        abortControllerRef.current?.abort()
                        // Also resolve any pending checkpoint so the executor can exit
                        if (checkpointResolverRef.current) {
                          checkpointResolverRef.current({ action: 'approve' })
                          setCheckpointRequest(null)
                        }
                      }}
                      className="ml-2 px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-semibold transition border border-red-300/30"
                      title="Cancel pipeline execution"
                    >
                      ✕ Cancel
                    </button>
                  </>
                ) : runResult?.message}
              </div>
            )}

            {/* Content Package View, Progress Tracker, or empty state */}
            {showOutputPanel && executionOutputs ? (
              <ContentPackageView
                outputs={executionOutputs}
                nodeAgentMap={nodeAgentMap}
                onClose={() => setShowOutputPanel(false)}
              />
            ) : isRunning && pipelineProgress.length > 0 ? (
              /* ── Enhanced Live Pipeline Progress Tracker ── */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-xl">
                  {/* Header with live pulse */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 mb-4">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500" />
                      </span>
                      <span className="text-xs font-semibold text-accent-700 dark:text-accent-300">Multi-Agent Pipeline</span>
                    </div>
                    <h3 className="text-lg font-semibold text-ink-700">5 Agents Working</h3>
                    <p className="text-xs text-ink-400 mt-1">Each agent receives the previous agent&apos;s output as context</p>
                    {humanInTheLoop && (
                      <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <span className="text-[10px]">👁️</span>
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Review checkpoints enabled</span>
                      </div>
                    )}
                  </div>

                  {/* Agent Timeline */}
                  <div className="space-y-1">
                    {pipelineProgress.map((step, i) => {
                      const agent = MARKETING_AGENTS.find(a => a.id === step.agentId)
                      const isActive = step.status === 'running'
                      const isDone = step.status === 'completed'
                      const isPending = step.status === 'pending'
                      const isReviewing = step.status === 'reviewing'
                      const messages = AGENT_THINKING_MESSAGES[step.agentId] || ['Processing...']
                      const elapsed = isActive && step.startedAt ? Math.floor((Date.now() - step.startedAt) / 1000) : null
                      const duration = isDone && step.startedAt && step.completedAt ? ((step.completedAt - step.startedAt) / 1000).toFixed(1) : null

                      return (
                        <div key={step.agentId} className="flex items-stretch gap-3">
                          {/* Timeline connector */}
                          <div className="flex flex-col items-center w-8 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2 transition-all duration-500 ${
                              isDone ? 'bg-emerald-100 dark:bg-emerald-900 border-emerald-400 dark:border-emerald-600' :
                              isReviewing ? 'bg-amber-100 dark:bg-amber-900 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/50 scale-110' :
                              isActive ? 'bg-accent-100 dark:bg-accent-900 border-accent-400 dark:border-accent-500 shadow-lg shadow-accent-200/50 dark:shadow-accent-900/50 scale-110' :
                              'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600'
                            }`}>
                              {isDone ? '\u2705' : isReviewing ? (
                                <span className="text-xs">👁️</span>
                              ) : isActive ? (
                                <span className="animate-spin text-xs">\u2699\ufe0f</span>
                              ) : (
                                <span className="text-ink-300 text-[10px] font-bold">{i + 1}</span>
                              )}
                            </div>
                            {i < pipelineProgress.length - 1 && (
                              <div className={`w-0.5 flex-1 min-h-[20px] transition-all duration-700 ${
                                isDone ? 'bg-emerald-300 dark:bg-emerald-700' :
                                isReviewing ? 'bg-amber-300 dark:bg-amber-700' :
                                isActive ? 'bg-gradient-to-b from-accent-400 to-surface-200 dark:from-accent-600 dark:to-surface-700' :
                                'bg-surface-200 dark:bg-surface-700'
                              }`} />
                            )}
                          </div>

                          {/* Agent Card */}
                          <div className={`flex-1 rounded-lg px-4 py-3 mb-1 transition-all duration-500 border ${
                            isDone ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' :
                            isReviewing ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 shadow-md shadow-amber-100/50 dark:shadow-amber-950/50' :
                            isActive ? 'bg-accent-50/70 dark:bg-accent-950/40 border-accent-200 dark:border-accent-700 shadow-md shadow-accent-100/50 dark:shadow-accent-950/50' :
                            'bg-surface-50/50 dark:bg-surface-800/30 border-surface-200 dark:border-surface-700 opacity-40'
                          }`}>
                            {/* Agent header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{agent?.icon || '\u2699\ufe0f'}</span>
                                <span className={`text-sm font-semibold ${
                                  isDone ? 'text-emerald-700 dark:text-emerald-300' :
                                  isReviewing ? 'text-amber-700 dark:text-amber-300' :
                                  isActive ? 'text-accent-700 dark:text-accent-300' :
                                  'text-ink-400'
                                }`}>{step.agentName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isDone && duration && (
                                  <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono">{duration}s</span>
                                )}
                                {isDone && (
                                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">Complete</span>
                                )}
                                {isReviewing && (
                                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded-full animate-pulse">Awaiting Review</span>
                                )}
                                {isActive && elapsed !== null && (
                                  <span className="text-[10px] font-mono text-accent-500 dark:text-accent-400 tabular-nums">{elapsed}s</span>
                                )}
                                {isPending && (
                                  <span className="text-[10px] text-ink-300">Queued</span>
                                )}
                              </div>
                            </div>

                            {/* Active agent: live streaming text or thinking message */}
                            {isActive && (
                              <div className="mt-2 space-y-2">
                                {streamingText[step.agentId] ? (
                                  <div className="max-h-36 overflow-y-auto rounded-md bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-2.5">
                                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                                      {streamingText[step.agentId].slice(-800)}
                                      <span className="inline-block w-1.5 h-3.5 bg-accent-500 animate-pulse ml-0.5 align-middle rounded-sm" />
                                    </pre>
                                  </div>
                                ) : (
                                  <AgentThinkingMessage agentId={step.agentId} messages={messages} />
                                )}
                                <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 rounded-full animate-progress-indeterminate" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* ── Checkpoint Review Panel ── */}
                  {checkpointRequest && (
                    <div className="mt-4 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-amber-200 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">👁️</span>
                          <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Review: {checkpointRequest.agentName}</span>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">Step {checkpointRequest.stepIndex + 1}/{checkpointRequest.totalSteps}</span>
                      </div>
                      <div className="p-3">
                        {checkpointEditing ? (
                          <textarea
                            value={checkpointEditText}
                            onChange={(e) => setCheckpointEditText(e.target.value)}
                            className="w-full h-48 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-surface-900 text-sm text-ink-600 dark:text-ink-300 p-3 font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        ) : (
                          <div className="max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 p-3">
                            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">{checkpointRequest.output.slice(-1500)}</pre>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => {
                              setCheckpointRequest(null)
                              checkpointResolverRef.current?.({ action: 'approve' })
                            }}
                            className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition shadow-sm"
                          >
                            ✓ Approve & Continue
                          </button>
                          {checkpointEditing ? (
                            <button
                              onClick={() => {
                                setCheckpointRequest(null)
                                setCheckpointEditing(false)
                                checkpointResolverRef.current?.({ action: 'edit', editedOutput: checkpointEditText })
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shadow-sm"
                            >
                              💾 Save Edit & Continue
                            </button>
                          ) : (
                            <button
                              onClick={() => setCheckpointEditing(true)}
                              className="flex-1 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold transition border border-amber-300 dark:border-amber-700"
                            >
                              ✏️ Edit Output
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCheckpointRequest(null)
                              setCheckpointEditing(false)
                              checkpointResolverRef.current?.({ action: 'regenerate' })
                            }}
                            className="px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-ink-500 text-xs font-semibold transition border border-surface-300 dark:border-surface-600"
                          >
                            🔄 Regenerate
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overall progress bar */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-ink-400">
                        Agent {pipelineProgress.filter(s => s.status === 'completed').length + 1} of {pipelineProgress.length}
                      </span>
                      <span className="text-ink-400 font-mono">
                        {Math.round((pipelineProgress.filter(s => s.status === 'completed').length / pipelineProgress.length) * 100)}%
                      </span>
                    </div>
                    <div className="h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(pipelineProgress.filter(s => s.status === 'completed').length / pipelineProgress.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-ink-300 max-w-md">
                  <p className="text-5xl mb-4 opacity-30">✨</p>
                  <h3 className="text-lg font-semibold text-ink-500 mb-2">Your Content Package</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    Fill in the brief on the left and click <strong>Generate Content Package</strong>.
                    Five specialized agents will research, write, edit, optimize, and create social posts — all in one pipeline.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-ink-300">
                    <span>🔍 Research</span>
                    <span>→</span>
                    <span>✍️ Write</span>
                    <span>→</span>
                    <span>📝 Edit</span>
                    <span>→</span>
                    <span>📊 SEO</span>
                    <span>→</span>
                    <span>📱 Social</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Builder Mode (original) */}
          <AgentPalette agents={allAgents} onAddAgent={addAgentNode} onCreateAgent={addCustomAgent} onDeleteAgent={deleteCustomAgent} />

          <div className="flex-1 flex flex-col">
            {/* Canvas */}
            <div className={`${showOutputPanel ? 'h-1/2' : 'flex-1'} relative transition-all`}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-surface"
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(0,0,0,0.06)" />
                <Controls className="bg-card/80 backdrop-blur-sm border border-surface-300 rounded-md" />
              </ReactFlow>

              {/* Toolbar */}
              <div className="absolute top-4 right-4 flex gap-2 items-center">
                {(() => {
                  const s = typeof window !== 'undefined' ? loadSettings() : null
                  if (!s) return null
                  const key = s.activeProvider as LLMProviderKey
                  const p = PROVIDER_REGISTRY[key]
                  if (!p) return null
                  const badge = getProviderBadge(key)
                  return (
                    <a href="/settings" className={`text-[11px] px-3 py-2 glass-card flex items-center gap-1.5 hover:bg-surface-100 transition ${badge.textClass}`}>
                      <span>{p.icon}</span>
                      <span>{badge.label}</span>
                    </a>
                  )
                })()}
                {nodes.length > 0 && (
                  <span className="text-[11px] text-ink-400 glass-card px-3 py-2">
                    {configuredCount}/{nodes.length} configured
                  </span>
                )}
                {/* My Workflows button */}
                <button
                  onClick={() => { setShowWorkflowsDrawer(true); fetchSavedWorkflows() }}
                  className="px-3.5 py-2 glass-card hover:bg-surface-100 text-ink-600 dark:text-ink-300 rounded-md flex items-center gap-1.5 transition text-xs font-medium"
                >
                  📂 My Workflows
                </button>
                {/* Save button */}
                <button
                  onClick={() => {
                    if (savedWorkflowId) {
                      saveWorkflow(savedWorkflowName)
                    } else {
                      setSaveModalName('')
                      setShowSaveModal(true)
                    }
                  }}
                  disabled={nodes.length === 0 || isSaving || !session?.user}
                  title={!session?.user ? 'Sign in to save workflows' : savedWorkflowId ? `Save "${savedWorkflowName}"` : 'Save workflow'}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-surface-300 disabled:text-ink-300 text-white rounded-md flex items-center gap-1.5 transition text-xs font-medium"
                >
                  {isSaving ? <><span className="animate-spin">⏳</span> Saving...</> : savedWorkflowId ? '💾 Update' : '💾 Save'}
                </button>
                <button onClick={runWorkflow} disabled={isRunning || nodes.length === 0}
                  className="px-3.5 py-2 bg-accent-600 hover:bg-accent-500 disabled:bg-surface-300 disabled:text-ink-300 text-white rounded-md flex items-center gap-1.5 transition text-xs font-medium">
                  {isRunning ? <><span className="animate-spin">⏳</span> Running...</> : <>▶️ Run Workflow</>}
                </button>
              </div>

              {/* Run Result Toast */}
              {runResult && (
                <div className={`absolute top-16 right-4 px-4 py-3 rounded-xl text-xs max-w-md backdrop-blur-xl border ${
                  runResult.status === 'success'
                    ? 'bg-emerald-900/60 border-emerald-700/40 text-emerald-200'
                    : 'bg-red-900/60 border-red-700/40 text-red-200'
                }`}>
                  {runResult.message}
                </div>
              )}

              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-ink-300">
                    <p className="text-4xl mb-3 opacity-40">🔧</p>
                    <p className="text-base font-medium text-ink-400">Drop agents from the left palette</p>
                    <p className="text-sm mt-1 text-ink-300">Connect them to build your workflow</p>
                  </div>
                </div>
              )}
            </div>

            {/* Output Panel (builder mode) */}
            {showOutputPanel && executionOutputs && (
              <div className="h-1/2 border-t border-surface-300 bg-card/95 backdrop-blur-sm flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-300">
                  <h3 className="text-xs font-semibold text-ink-700 flex items-center gap-2">
                    📋 Execution Output
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                      {Object.keys(executionOutputs).length} step(s)
                    </span>
                  </h3>
                  <button onClick={() => setShowOutputPanel(false)}
                    className="text-ink-400 hover:text-ink-700 text-xs px-2 py-1 rounded-md hover:bg-surface-100 transition">
                    ✕ Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {Object.entries(executionOutputs).map(([stepId, stepResult]) => {
                    const node = nodes.find(n => n.id === stepId)
                    const agentName = node?.data?.agent?.name || stepId
                    const agentIcon = node?.data?.agent?.icon || '⚙️'
                    const action = node?.data?.action || 'execute'
                    return (
                      <div key={stepId} className="glass-card overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-300 bg-surface-50">
                          <span className="text-base">{agentIcon}</span>
                          <span className="font-medium text-ink-700 text-xs">{agentName}</span>
                          <span className="text-[10px] text-ink-400">→ {action}</span>
                          {(stepResult as any).provider && (() => {
                            const badge = getProviderBadge((stepResult as any).provider)
                            return <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.bgClass} ${badge.textClass}`}>{badge.label}</span>
                          })()}
                          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-md ${
                            stepResult.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400'
                          }`}>{stepResult.status}</span>
                        </div>
                        <pre className="p-4 text-xs text-ink-500 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                          {stepResult.output}
                        </pre>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Node Config Panel */}
          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              onUpdate={updateNodeData}
              onDelete={deleteNode}
            />
          )}
        </>
      )}

      </div>{/* end flex-1 flex overflow-hidden */}

      {/* ─── Save Name Modal ─── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-surface-300 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-sm font-semibold text-ink-700 mb-1">Save Workflow</h3>
            <p className="text-[11px] text-ink-400 mb-4">Give your workflow a name so you can load it later.</p>
            <input
              type="text"
              value={saveModalName}
              onChange={e => setSaveModalName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && saveModalName.trim()) {
                  setShowSaveModal(false)
                  saveWorkflow(saveModalName.trim())
                }
                if (e.key === 'Escape') setShowSaveModal(false)
              }}
              placeholder="e.g. Code Review Pipeline"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md bg-surface-50 focus:outline-none focus:ring-2 focus:ring-accent-500 text-ink-700 placeholder-ink-300 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs rounded-md border border-surface-300 text-ink-500 hover:bg-surface-100 transition">
                Cancel
              </button>
              <button
                onClick={() => { if (saveModalName.trim()) { setShowSaveModal(false); saveWorkflow(saveModalName.trim()) } }}
                disabled={!saveModalName.trim()}
                className="px-4 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-surface-300 disabled:text-ink-300 text-white font-medium transition">
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── My Workflows Drawer ─── */}
      {showWorkflowsDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setShowWorkflowsDrawer(false)} />
          {/* Panel */}
          <div className="w-80 bg-card border-l border-surface-300 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-300">
              <h3 className="text-sm font-semibold text-ink-700">📂 My Workflows</h3>
              <button onClick={() => setShowWorkflowsDrawer(false)}
                className="text-ink-400 hover:text-ink-700 text-xs px-2 py-1 rounded hover:bg-surface-100 transition">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingWorkflows ? (
                <div className="flex items-center justify-center py-12 text-ink-400 text-xs gap-2">
                  <span className="animate-spin">⏳</span> Loading...
                </div>
              ) : savedWorkflows.length === 0 ? (
                <div className="text-center py-12 text-ink-300">
                  <p className="text-3xl mb-3 opacity-40">📭</p>
                  <p className="text-xs">No saved workflows yet.</p>
                  <p className="text-[11px] mt-1">Build something and hit Save!</p>
                </div>
              ) : savedWorkflows.map(wf => (
                <div key={wf.id}
                  className={`group flex items-start justify-between p-3 rounded-lg border cursor-pointer transition ${
                    wf.id === savedWorkflowId
                      ? 'border-accent-300 bg-accent-50 dark:bg-accent-950/30'
                      : 'border-surface-300 hover:border-surface-400 hover:bg-surface-50'
                  }`}
                  onClick={() => loadWorkflow(wf.id, wf.name)}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-700 truncate">{wf.name}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      {new Date(wf.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {wf.id === savedWorkflowId && (
                      <span className="text-[10px] text-accent-600 font-medium">● Active</span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteWorkflow(wf.id) }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-[10px] px-1.5 py-0.5 rounded hover:bg-red-50 transition ml-2 shrink-0"
                    title="Delete workflow"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
            <div className="px-3 py-3 border-t border-surface-300">
              <button
                onClick={() => { setNodes([]); setEdges([]); setSavedWorkflowId(null); setSavedWorkflowName(''); setShowWorkflowsDrawer(false) }}
                className="w-full text-xs text-ink-400 hover:text-ink-700 py-2 rounded-md hover:bg-surface-100 transition"
              >
                + New blank workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

