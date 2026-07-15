'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { Agent } from '../lib/agents'

type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'reviewing' | 'skipped' | 'cancelled'

interface AgentNodeData {
  agent: Agent
  action: string
  inputs: Record<string, any>
  condition: string
  selected?: boolean
  // Live execution status — injected by WorkflowBuilder during a run
  status?: NodeStatus
  thinkingMessage?: string
}

// Human-readable action labels
const ACTION_LABELS: Record<string, string> = {
  create_feature: 'Create Feature',
  analyze_code: 'Analyze Code',
  create_unit_tests: 'Create Tests',
  generate_api_docs: 'Generate Docs',
  debug_error: 'Debug Error',
  fix_code: 'Fix Code',
  scan_vulnerabilities: 'Scan Security',
  refactor_code: 'Refactor Code',
  create_pull_request: 'Create PR',
  execute: 'Custom Task',
}

const STATUS_RING: Record<NodeStatus, string> = {
  pending:   'border-surface-300',
  running:   'border-accent-400',
  completed: 'border-emerald-400',
  failed:    'border-red-400',
  reviewing: 'border-amber-400',
  skipped:   'border-surface-300',
  cancelled: 'border-surface-300',
}

const STATUS_SHADOW: Record<NodeStatus, string> = {
  pending:   '',
  running:   '0 0 0 3px rgba(99,102,241,0.18), 0 0 18px rgba(99,102,241,0.12)',
  completed: '0 0 0 3px rgba(52,211,153,0.20), 0 0 18px rgba(52,211,153,0.10)',
  failed:    '0 0 0 3px rgba(248,113,113,0.22), 0 0 18px rgba(248,113,113,0.12)',
  reviewing: '0 0 0 3px rgba(251,191,36,0.22), 0 0 18px rgba(251,191,36,0.10)',
  skipped:   '',
  cancelled: '',
}

const STATUS_BADGE: Record<NodeStatus, { icon: string; label: string; cls: string }> = {
  pending:   { icon: '', label: '', cls: '' },
  running:   { icon: '●', label: 'Running', cls: 'text-accent-500 animate-pulse' },
  completed: { icon: '✓', label: 'Done', cls: 'text-emerald-500' },
  failed:    { icon: '✕', label: 'Failed', cls: 'text-red-500' },
  reviewing: { icon: '👁', label: 'Review', cls: 'text-amber-500' },
  skipped:   { icon: '⏭', label: 'Skipped', cls: 'text-ink-300' },
  cancelled: { icon: '✕', label: 'Cancelled', cls: 'text-ink-300' },
}

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  const { agent, action, condition, status, thinkingMessage } = data
  const isConfigured = !!action
  const actionLabel = action ? (ACTION_LABELS[action] || action) : 'Not configured'

  const s = status ?? 'pending'
  const isRunning = s === 'running'
  const isCompleted = s === 'completed'
  const isFailed = s === 'failed'
  const isSkipped = s === 'skipped'
  const badge = STATUS_BADGE[s]
  const hasStatus = s !== 'pending'

  return (
    <div
      className={`relative px-4 py-3 rounded-md min-w-[220px] bg-card cursor-pointer transition-all duration-300 border-2 ${
        selected && !hasStatus ? 'border-accent-300 scale-[1.03]' : STATUS_RING[s]
      } ${isSkipped ? 'opacity-40' : ''}`}
      style={{
        boxShadow: hasStatus
          ? STATUS_SHADOW[s]
          : selected
            ? `0 8px 32px ${agent.color}20, 0 0 0 1px ${agent.color}25`
            : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Pulsing ring for running state */}
      {isRunning && (
        <span className="absolute inset-0 rounded-md animate-ping border-2 border-accent-400 opacity-30 pointer-events-none" />
      )}

      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: agent.color, border: '2px solid rgb(var(--card))' }} />

      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`relative w-8 h-8 rounded-md flex items-center justify-center text-lg shrink-0 ${isRunning ? 'animate-pulse' : ''}`}
          style={{ background: agent.color + '18' }}>
          {agent.icon}
          {/* Spinner overlay while running */}
          {isRunning && (
            <span className="absolute inset-0 rounded-md border-2 border-transparent border-t-accent-500 animate-spin" />
          )}
        </div>
        <span className="font-semibold text-ink-700 text-sm tracking-tight leading-tight flex-1 min-w-0 truncate">{agent.name}</span>
        {/* Status badge */}
        {badge.icon && (
          <span className={`text-[11px] font-semibold shrink-0 ${badge.cls}`} title={badge.label}>
            {badge.icon}
          </span>
        )}
      </div>

      {/* Thinking message while running */}
      {isRunning && thinkingMessage && (
        <div className="text-[10px] text-accent-500 mb-1.5 truncate animate-pulse font-medium">
          {thinkingMessage}
        </div>
      )}

      {/* Completed: show done label */}
      {isCompleted && (
        <div className="text-[10px] text-emerald-600 mb-1.5 font-medium">Completed ✓</div>
      )}

      {/* Failed: show fail label */}
      {isFailed && (
        <div className="text-[10px] text-red-500 mb-1.5 font-medium">Step failed</div>
      )}

      {/* Normal action label (hidden while running to make room for thinking msg) */}
      {!isRunning && !isCompleted && !isFailed && (
        <div className={`text-[11px] mb-1 flex items-center gap-1 ${isConfigured ? 'text-emerald-600' : 'text-ink-300'}`}>
          <span className="text-[10px]">{isConfigured ? '✓' : '○'}</span>
          <span>{actionLabel}</span>
        </div>
      )}

      {!hasStatus && isConfigured && Object.keys(data.inputs || {}).filter(k => data.inputs[k]).length > 0 && (
        <div className="text-[10px] text-ink-400 mt-1">
          {Object.keys(data.inputs).filter(k => data.inputs[k]).length} input(s)
        </div>
      )}

      {!hasStatus && condition && (
        <div className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
          <span>⚡</span>
          <span>Conditional</span>
        </div>
      )}

      {!hasStatus && !isConfigured && (
        <div className="text-[10px] text-ink-300 mt-1 italic">Click to configure</div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5" style={{ background: agent.color, border: '2px solid rgb(var(--card))' }} />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

