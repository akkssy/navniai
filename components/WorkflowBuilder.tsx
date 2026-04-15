'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
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
import { executeWorkflowClientSide } from '../lib/workflowExecutor'
import { loadSettings, getProviderBadge, PROVIDER_REGISTRY, type LLMProviderKey } from '../lib/llmProviders'
import { getTemplateById } from '../lib/pipelineTemplates'
import { AgentNode } from './AgentNode'
import { AgentPalette } from './AgentPalette'
import { NodeConfigPanel } from './NodeConfigPanel'

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

// Keep backward compat export
export const AGENTS = SYSTEM_AGENTS

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

// Use local Next.js API route (falls back to external gateway if configured)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export function WorkflowBuilder({ templateId }: { templateId?: string } = {}) {
  const { data: session } = useSession()
  const template = templateId ? getTemplateById(templateId) : null
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<{ status: string; message: string } | null>(null)
  const [executionOutputs, setExecutionOutputs] = useState<Record<string, { output: string; status: string; provider?: string }> | null>(null)
  const [showOutputPanel, setShowOutputPanel] = useState(false)
  const templateLoaded = useRef(false)
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

  const allAgents = [...SYSTEM_AGENTS, ...customAgents]

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
        agent_category: node.data.agent.category,
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

    setIsRunning(true)
    setRunResult(null)

    try {
      const workflow = buildWorkflowPayload()
      const payload = { workflow, inputs: {}, user_id: 'web-user' }

      let result: any
      if (process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'ghpages') {
        console.log('Running workflow client-side:', workflow)
        result = await executeWorkflowClientSide(payload)
      } else {
        console.log('Running workflow via API:', workflow)
        const response = await fetch('/api/workflow/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
        result = await response.json()
      }
      if (result.status === 'completed' && result.outputs) {
        setExecutionOutputs(result.outputs)
        setShowOutputPanel(true)
      }
      setRunResult({
        status: result.status === 'completed' ? 'success' : 'error',
        message: result.status === 'completed'
          ? `✅ Workflow completed! ${result.steps_completed}/${result.total_steps} steps in ${(result.execution_time || 0).toFixed(1)}s`
          : `❌ Workflow failed: ${result.error || 'Unknown error'}`
      })
    } catch (error: any) {
      console.error('Workflow execution error:', error)
      setRunResult({
        status: 'error',
        message: `Failed to run workflow: ${error.message}`
      })
    } finally {
      setIsRunning(false)
    }
  }

  const configuredCount = nodes.filter(n => n.data.action).length

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/[0.06] bg-dark-950/90 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white transition text-xs">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-white/[0.06]" />
          <Link href="/" className="flex items-center gap-1.5">
            <SparklesIcon className="h-4.5 w-4.5 text-primary-400" />
            <span className="text-sm font-bold gradient-text">NavniAI</span>
          </Link>
          {template && (
            <>
              <div className="h-4 w-px bg-white/[0.06]" />
              <span className="text-xs text-dark-300 flex items-center gap-1.5">
                <span>{template.icon}</span>
                {template.name}
              </span>
            </>
          )}
          {!template && (
            <>
              <div className="h-4 w-px bg-white/[0.06]" />
              <span className="text-xs text-dark-400">New Workflow</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {session?.user && (
            <span className="text-[11px] text-dark-400">
              {session.user.name || session.user.email}
            </span>
          )}
          <Link href="/settings" className="text-[11px] text-dark-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/[0.04]">
            ⚙️ Settings
          </Link>
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[11px] text-dark-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-white/[0.04] flex items-center gap-1"
            >
              <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
      {/* Agent Palette */}
      <AgentPalette agents={allAgents} onAddAgent={addAgentNode} onCreateAgent={addCustomAgent} onDeleteAgent={deleteCustomAgent} />

      {/* Main area: Canvas + Output Panel */}
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
          className="bg-dark-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.04)" />
          <Controls className="bg-dark-800/80 backdrop-blur-sm border border-white/[0.06] rounded-xl" />
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
              <a href="/settings" className={`text-[11px] px-3 py-2 glass-card flex items-center gap-1.5 hover:bg-dark-800/80 transition ${badge.textClass}`}>
                <span>{p.icon}</span>
                <span>{badge.label}</span>
              </a>
            )
          })()}
          {nodes.length > 0 && (
            <span className="text-[11px] text-dark-400 glass-card px-3 py-2">
              {configuredCount}/{nodes.length} configured
            </span>
          )}
          <button onClick={exportWorkflow} disabled={nodes.length === 0}
            className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-xl flex items-center gap-1.5 transition text-xs font-medium backdrop-blur-sm">
            💾 Save
          </button>
          <button onClick={runWorkflow} disabled={isRunning || nodes.length === 0}
            className="px-3.5 py-2 bg-primary-600/90 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-xl flex items-center gap-1.5 transition text-xs font-medium backdrop-blur-sm">
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
            <div className="text-center text-dark-500">
              <p className="text-4xl mb-3 opacity-40">🔧</p>
              <p className="text-base font-medium">Drop agents from the left palette</p>
              <p className="text-sm mt-1 text-dark-600">Connect them to build your workflow</p>
            </div>
          </div>
        )}
      </div>

      {/* Output Panel */}
      {showOutputPanel && executionOutputs && (
        <div className="h-1/2 border-t border-white/[0.06] bg-dark-900/95 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              📋 Execution Output
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {Object.keys(executionOutputs).length} step(s)
              </span>
            </h3>
            <button onClick={() => setShowOutputPanel(false)}
              className="text-dark-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/[0.04] transition">
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
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-white/[0.02]">
                    <span className="text-base">{agentIcon}</span>
                    <span className="font-medium text-white text-xs">{agentName}</span>
                    <span className="text-[10px] text-dark-400">→ {action}</span>
                    {(stepResult as any).provider && (() => {
                      const badge = getProviderBadge((stepResult as any).provider)
                      return <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.bgClass} ${badge.textClass}`}>{badge.label}</span>
                    })()}
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                      stepResult.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>{stepResult.status}</span>
                  </div>
                  <pre className="p-4 text-xs text-dark-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
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
      </div>{/* end flex-1 flex overflow-hidden */}
    </div>
  )
}

