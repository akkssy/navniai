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
import { ArrowLeftIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Logo from '@/components/Logo'
import { executeWorkflowClientSide, AGENT_THINKING_MESSAGES, type StepProgress, type OnStreamCallback, type OnCheckpointCallback, type CheckpointRequest, type CheckpointDecision } from '../lib/workflowExecutor'
import StoryboardPreview from '@/components/StoryboardPreview'
import { loadSettings, getProviderBadge, getDemoRunsRemaining, PROVIDER_REGISTRY, type LLMProviderKey } from '../lib/llmProviders'
import { getTemplateById } from '../lib/pipelineTemplates'
import { AgentNode } from './AgentNode'
import { AgentPalette } from './AgentPalette'
import { NodeConfigPanel } from './NodeConfigPanel'

import { saveRun, getRun, rebuildOutputs } from '../lib/runStorage'

const nodeTypes = {
  agentNode: AgentNode,
}

import { SYSTEM_AGENTS, MARKETING_AGENTS, VIRAL_SOCIAL_AGENTS } from '../lib/agents'
import type { Agent } from '../lib/agents'

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

// ─── Apply brief-form values to template step inputs ───
function applyBriefValues(
  inputs: Record<string, string>,
  briefValues: Record<string, string>,
): Record<string, string> {
  const result = { ...inputs }
  for (const [key, value] of Object.entries(briefValues)) {
    if (value && key in result) result[key] = value
  }
  return result
}

export function WorkflowBuilder({ templateId, runId, workflowId, briefValues = {} }: { templateId?: string; runId?: string; workflowId?: string; briefValues?: Record<string, string> } = {}) {
  const { data: session } = useSession()
  const template = templateId ? getTemplateById(templateId) : null
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<{ status: string; message: string } | null>(null)
  const [executionOutputs, setExecutionOutputs] = useState<Record<string, { output: string; status: string; provider?: string }> | null>(null)
  const [showOutputPanel, setShowOutputPanel] = useState(false)
  const [copiedExport, setCopiedExport] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copiedShare, setCopiedShare] = useState(false)
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false)

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

  // On mount: hydrate custom agents from DB (source of truth), fallback to localStorage
  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(data => {
      if (data.ok && Array.isArray(data.agents)) {
        setCustomAgents(data.agents)
        try { localStorage.setItem('navniai_custom_agents', JSON.stringify(data.agents)) } catch { /* quota */ }
      }
    }).catch(() => { /* not authenticated or offline — localStorage is fine */ })
  }, [])

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

    // 2. Save to PostgreSQL via API (source of truth) — capture run ID for share link
    fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runData),
    }).then(res => res.json()).then(data => {
      if (data.ok && data.run?.id) {
        setShareUrl(`${window.location.origin}/r/${data.run.id}`)
      }
    }).catch(err => console.warn('Failed to persist run to API:', err))
  }

  // Load template into builder
  useEffect(() => {
    if (!templateId || templateLoaded.current) return
    const template = getTemplateById(templateId)
    if (!template) return
    templateLoaded.current = true

    const allBuiltInAgents = [...MARKETING_AGENTS, ...VIRAL_SOCIAL_AGENTS, ...SYSTEM_AGENTS]
    const templateNodes: Node[] = template.steps.map((step, i) => {
      const agent = allBuiltInAgents.find(a => a.id === step.agentId) || SYSTEM_AGENTS[0]
      return {
        id: `${step.agentId}-tpl-${i}`,
        type: 'agentNode',
        position: { x: 300, y: 80 + i * 160 },
        data: {
          agent,
          action: step.action,
          inputs: applyBriefValues(step.inputs, briefValues),
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

  // ─── Auto-load workflow from URL param (?workflowId=<id>) ───
  const workflowLoaded = useRef(false)
  useEffect(() => {
    if (!workflowId || workflowLoaded.current) return
    workflowLoaded.current = true
    fetch(`/api/workflows/${workflowId}`).then(r => r.json()).then(data => {
      if (!data.ok) return
      const { nodes: loadedNodes, edges: loadedEdges } = JSON.parse(data.workflow.config || '{}')
      if (loadedNodes) setNodes(loadedNodes)
      if (loadedEdges) setEdges(loadedEdges)
      setSavedWorkflowId(workflowId)
      setSavedWorkflowName(data.workflow.name || '')
    }).catch(() => {})
  }, [workflowId, setNodes, setEdges])

  // ─── Load past run from localStorage (when ?run=<id> is in URL) ───
  const runLoaded = useRef(false)
  useEffect(() => {
    if (!runId || runLoaded.current) return
    const run = getRun(runId)
    if (!run) return
    runLoaded.current = true

    // Rebuild outputs from stored run
    const outputs = rebuildOutputs(run)

    setExecutionOutputs(outputs)
    setShowOutputPanel(true)
    setRunResult({
      status: 'success',
      message: `📂 Loaded run: ${run.name} — ${run.stepsCompleted}/${run.stepsTotal} steps in ${(run.executionTime || 0).toFixed(1)}s`,
    })
  }, [runId])

  const allAgents = [...MARKETING_AGENTS, ...VIRAL_SOCIAL_AGENTS, ...SYSTEM_AGENTS, ...customAgents]

  const addCustomAgent = useCallback((agent: Agent) => {
    setCustomAgents(prev => {
      const next = [...prev, agent]
      try { localStorage.setItem('navniai_custom_agents', JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
    // Sync to DB
    fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    }).catch(() => { /* offline — localStorage still has it */ })
  }, [])

  const deleteCustomAgent = useCallback((agentId: string) => {
    setCustomAgents(prev => {
      const next = prev.filter(a => a.id !== agentId)
      try { localStorage.setItem('navniai_custom_agents', JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
    // Sync to DB
    fetch(`/api/agents?id=${agentId}`, { method: 'DELETE' }).catch(() => { /* offline */ })
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

    // Reset all node statuses to 'pending' so the canvas shows a clean slate
    setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, status: 'pending', thinkingMessage: undefined, liveText: undefined } })))

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
      // Mirror status + thinking message onto the node so AgentNode renders live state
      setNodes(prev => prev.map(n =>
        n.id === progress.stepId
          ? { ...n, data: { ...n.data, status: progress.status, thinkingMessage: progress.thinkingMessage } }
          : n
      ))
    }

    let streamRAF: number | null = null
    const pendingNodeText: Record<string, string> = {}
    const handleStream: OnStreamCallback = (stepId, agentId, _chunk, fullText) => {
      streamingTextRef.current = { ...streamingTextRef.current, [agentId]: fullText }
      pendingNodeText[stepId] = fullText
      if (!streamRAF) {
        streamRAF = requestAnimationFrame(() => {
          setStreamingText({ ...streamingTextRef.current })
          // Mirror live streaming text onto the active node as its "thought log"
          const snapshot = { ...pendingNodeText }
          setNodes(prev => prev.map(n =>
            snapshot[n.id] !== undefined
              ? { ...n, data: { ...n.data, liveText: snapshot[n.id] } }
              : n
          ))
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
      const payload = {
        workflow,
        inputs: {},
        user_id: 'web-user',
        signal: abortController.signal,
        brandVoice: loadSettings().brandVoice || '',
      }

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
      // Keep completed/failed statuses visible for 4 s then fade nodes back to normal
      setTimeout(() => {
        setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, status: undefined, thinkingMessage: undefined } })))
      }, 4000)
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
            <Logo size={20} className="rounded-md" />
            <span className="text-sm font-bold text-ink-700">NavniAI</span>
          </Link>

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

      {/* Unified Builder Mode */}
        <>
          <AgentPalette agents={allAgents} onAddAgent={addAgentNode} onCreateAgent={addCustomAgent} onDeleteAgent={deleteCustomAgent} />

          <div className="flex-1 flex flex-col">
            {/* Canvas */}
            <div className={`${(showOutputPanel || (isRunning && pipelineProgress.length > 0)) ? 'h-1/2' : 'flex-1'} relative transition-all`}>
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
                {mounted && (() => {
                  const s = loadSettings()
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
                {/* HITL Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer glass-card px-3 py-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={humanInTheLoop}
                      onChange={(e) => setHumanInTheLoop(e.target.checked)}
                      disabled={isRunning}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-3.5 bg-surface-300 dark:bg-surface-600 rounded-full peer-checked:bg-amber-500 peer-disabled:opacity-50 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full peer-checked:translate-x-3.5 transition-transform shadow-sm" />
                  </div>
                  <span className="text-[11px] text-ink-500 dark:text-ink-400">👁️ HITL</span>
                </label>
                {isRunning && (
                  <button
                    onClick={() => {
                      abortControllerRef.current?.abort()
                      if (checkpointResolverRef.current) {
                        checkpointResolverRef.current({ action: 'approve' })
                        setCheckpointRequest(null)
                      }
                    }}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-md flex items-center gap-1 transition text-[11px] font-semibold border border-red-300/30"
                  >
                    ✕ Cancel
                  </button>
                )}
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

              {/* Provider not configured banner */}
              {mounted && (() => {
                const s = loadSettings()
                const hasRawSettings = typeof window !== 'undefined' && !!localStorage.getItem('navniai_llm_settings')
                const providerCfg = s.providers[s.activeProvider as LLMProviderKey]
                const registry = PROVIDER_REGISTRY[s.activeProvider as LLMProviderKey]
                const needsKey = registry?.requiresApiKey && !providerCfg?.apiKey
                if (!hasRawSettings || needsKey) {
                  const remaining = getDemoRunsRemaining()
                  const exhausted = remaining === 0
                  return (
                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2.5 rounded-xl backdrop-blur-xl text-xs shadow-lg border ${
                      exhausted ? 'bg-red-900/80 border-red-700/50 text-red-100' : 'bg-amber-900/80 border-amber-700/50 text-amber-100'
                    }`}>
                      <span className="text-base">{exhausted ? '🔒' : '✨'}</span>
                      <span>
                        {exhausted
                          ? 'Free demo runs used up — connect a provider to keep generating.'
                          : 'No provider connected — running in free demo mode (no setup needed).'}
                      </span>
                      <a href="/settings" className="ml-1 underline underline-offset-2 font-semibold hover:text-white transition whitespace-nowrap">
                        {exhausted ? 'Connect provider →' : 'Use your own key →'}
                      </a>
                    </div>
                  )
                }
                return null
              })()}

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

            {/* ── Live Pipeline Tracker (shown while running) ── */}
            {isRunning && pipelineProgress.length > 0 && (
              <div className="h-1/2 border-t border-surface-300 bg-card/95 backdrop-blur-sm flex flex-col overflow-y-auto">
                <div className="flex-1 p-6">
                  <div className="max-w-xl mx-auto">
                    {/* Header with live pulse */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500" />
                        </span>
                        <span className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                          {checkpointRequest ? '👁️ Awaiting Review' : `Agent ${pipelineProgress.filter(s => s.status === 'completed').length + 1}/${pipelineProgress.length}`}
                        </span>
                      </div>
                      {humanInTheLoop && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">👁️ HITL on</span>
                      )}
                    </div>

                    {/* Agent Timeline */}
                    <div className="space-y-1">
                      {pipelineProgress.map((step, i) => {
                        const agent = allAgents.find(a => a.id === step.agentId)
                        const isActive = step.status === 'running'
                        const isDone = step.status === 'completed'
                        const isPending = step.status === 'pending'
                        const isReviewing = step.status === 'reviewing'
                        const messages = AGENT_THINKING_MESSAGES[step.agentId] || ['Processing...']
                        const elapsed = isActive && step.startedAt ? Math.floor((Date.now() - step.startedAt) / 1000) : null
                        const duration = isDone && step.startedAt && step.completedAt ? ((step.completedAt - step.startedAt) / 1000).toFixed(1) : null

                        return (
                          <div key={`${step.agentId}-${i}`} className="flex items-stretch gap-3">
                            {/* Timeline connector */}
                            <div className="flex flex-col items-center w-8 shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2 transition-all duration-500 ${
                                isDone ? 'bg-emerald-100 dark:bg-emerald-900 border-emerald-400 dark:border-emerald-600' :
                                isReviewing ? 'bg-amber-100 dark:bg-amber-900 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/50 scale-110' :
                                isActive ? 'bg-accent-100 dark:bg-accent-900 border-accent-400 dark:border-accent-500 shadow-lg shadow-accent-200/50 dark:shadow-accent-900/50 scale-110' :
                                'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600'
                              }`}>
                                {isDone ? '✅' : isReviewing ? (
                                  <span className="text-xs">👁️</span>
                                ) : isActive ? (
                                  <span className="animate-spin text-xs">⚙️</span>
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
                              isReviewing ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700 shadow-md' :
                              isActive ? 'bg-accent-50/70 dark:bg-accent-950/40 border-accent-200 dark:border-accent-700 shadow-md' :
                              'bg-surface-50/50 dark:bg-surface-800/30 border-surface-200 dark:border-surface-700 opacity-40'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{agent?.icon || '⚙️'}</span>
                                  <span className={`text-sm font-semibold ${
                                    isDone ? 'text-emerald-700 dark:text-emerald-300' :
                                    isReviewing ? 'text-amber-700 dark:text-amber-300' :
                                    isActive ? 'text-accent-700 dark:text-accent-300' :
                                    'text-ink-400'
                                  }`}>{step.agentName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isDone && duration && <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono">{duration}s</span>}
                                  {isDone && <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">Complete</span>}
                                  {isReviewing && <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded-full animate-pulse">Awaiting Review</span>}
                                  {isActive && elapsed !== null && <span className="text-[10px] font-mono text-accent-500 dark:text-accent-400 tabular-nums">{elapsed}s</span>}
                                  {isPending && <span className="text-[10px] text-ink-300">Queued</span>}
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
                              onClick={() => { setCheckpointRequest(null); checkpointResolverRef.current?.({ action: 'approve' }) }}
                              className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition shadow-sm"
                            >✓ Approve & Continue</button>
                            {checkpointEditing ? (
                              <button
                                onClick={() => { setCheckpointRequest(null); setCheckpointEditing(false); checkpointResolverRef.current?.({ action: 'edit', editedOutput: checkpointEditText }) }}
                                className="flex-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shadow-sm"
                              >💾 Save Edit & Continue</button>
                            ) : (
                              <button
                                onClick={() => setCheckpointEditing(true)}
                                className="flex-1 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold transition border border-amber-300 dark:border-amber-700"
                              >✏️ Edit Output</button>
                            )}
                            <button
                              onClick={() => { setCheckpointRequest(null); setCheckpointEditing(false); checkpointResolverRef.current?.({ action: 'regenerate' }) }}
                              className="px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-ink-500 text-xs font-semibold transition border border-surface-300 dark:border-surface-600"
                            >🔄 Regenerate</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overall progress bar */}
                    <div className="mt-4 space-y-2">
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
              </div>
            )}

            {/* Output Panel (shown after execution completes) */}
            {!isRunning && showOutputPanel && executionOutputs && (
              <div className="h-1/2 border-t border-surface-300 bg-card/95 backdrop-blur-sm flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-300">
                  <h3 className="text-xs font-semibold text-ink-700 flex items-center gap-2">
                    📋 Execution Output
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                      {Object.keys(executionOutputs).length} step(s)
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Copy all output */}
                    <button
                      onClick={() => {
                        const md = Object.entries(executionOutputs).map(([stepId, r]) => {
                          const node = nodes.find(n => n.id === stepId)
                          const name = node?.data?.agent?.name || stepId
                          const icon = node?.data?.agent?.icon || '⚙️'
                          return `## ${icon} ${name}\n\n${r.output}`
                        }).join('\n\n---\n\n')
                        navigator.clipboard.writeText(md).then(() => {
                          setCopiedExport(true)
                          setTimeout(() => setCopiedExport(false), 2000)
                        })
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-surface-300 text-ink-500 hover:bg-surface-100 transition flex items-center gap-1"
                    >
                      {copiedExport ? '✅ Copied!' : '📋 Copy All'}
                    </button>
                    {/* Download as markdown */}
                    <button
                      onClick={() => {
                        const md = Object.entries(executionOutputs).map(([stepId, r]) => {
                          const node = nodes.find(n => n.id === stepId)
                          const name = node?.data?.agent?.name || stepId
                          const icon = node?.data?.agent?.icon || '⚙️'
                          return `## ${icon} ${name}\n\n${r.output}`
                        }).join('\n\n---\n\n')
                        const blob = new Blob([`# Pipeline Output\n\n${md}`], { type: 'text/markdown' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `pipeline-output-${new Date().toISOString().slice(0, 10)}.md`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-surface-300 text-ink-500 hover:bg-surface-100 transition flex items-center gap-1"
                    >
                      ⬇️ Download .md
                    </button>
                    {/* Share link */}
                    {shareUrl && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl).then(() => {
                            setCopiedShare(true)
                            setTimeout(() => setCopiedShare(false), 2500)
                          })
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-md border border-accent-300 text-accent-600 hover:bg-accent-50 transition flex items-center gap-1"
                      >
                        {copiedShare ? '✅ Copied!' : '🔗 Share'}
                      </button>
                    )}
                    <button onClick={() => setShowOutputPanel(false)}
                      className="text-ink-400 hover:text-ink-700 text-xs px-2 py-1 rounded-md hover:bg-surface-100 transition">
                      ✕
                    </button>
                  </div>
                </div>

                {/* ── Publish bar: push the generated pack straight to social ── */}
                {(() => {
                  const padNode = nodes.find(n => n.data?.agent?.id === 'platform_adapter')
                  const padOut = padNode ? executionOutputs[padNode.id]?.output : ''
                  const fullText = (padOut && padOut.trim())
                    ? padOut.trim()
                    : Object.values(executionOutputs).map(r => r.output).join('\n\n').trim()
                  if (!fullText) return null
                  const xText = fullText.length > 275 ? fullText.slice(0, 272) + '…' : fullText
                  return (
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-300 bg-surface-50/60 dark:bg-surface-900/40">
                      <span className="text-[11px] font-semibold text-ink-500 mr-1">🚀 Publish:</span>
                      <button
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`, '_blank', 'noopener')}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-black text-white hover:bg-ink-800 transition flex items-center gap-1"
                      >
                        𝕏 Post to X
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(fullText).then(() => {
                            setCopiedLinkedIn(true)
                            setTimeout(() => setCopiedLinkedIn(false), 3000)
                            window.open('https://www.linkedin.com/feed/', '_blank', 'noopener')
                          })
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-[#0a66c2] text-white hover:bg-[#004182] transition flex items-center gap-1"
                      >
                        {copiedLinkedIn ? '✅ Copied — paste in LinkedIn' : 'in Post to LinkedIn'}
                      </button>
                      <span className="text-[10px] text-ink-300 ml-auto">Uses your Platform Adapter output</span>
                    </div>
                  )
                })()}

                {/* ── Storyboard Preview: rendered when shot_compiler step is present ── */}
                {(() => {
                  const scNode = nodes.find(n => n.data?.agent?.id === 'shot_compiler')
                  const scOut = scNode ? executionOutputs[scNode.id]?.output : ''
                  if (!scOut?.includes('===SCENES===')) return null
                  return <StoryboardPreview rawOutput={scOut} />
                })()}

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

