'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Agent } from './WorkflowBuilder'

interface AgentNodeData {
  agent: Agent
  action: string
  inputs: Record<string, any>
  condition: string
  selected?: boolean
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

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  const { agent, action, condition } = data
  const isConfigured = !!action
  const actionLabel = action ? (ACTION_LABELS[action] || action) : 'Not configured'

  return (
    <div
      className={`px-4 py-3 rounded-md min-w-[220px] bg-card cursor-pointer transition-all duration-200 border ${
        selected
          ? 'border-accent-300 scale-[1.03]'
          : 'border-surface-300 hover:border-surface-400'
      }`}
      style={{
        boxShadow: selected
          ? `0 8px 32px ${agent.color}20, 0 0 0 1px ${agent.color}25`
          : `0 1px 4px rgba(0,0,0,0.06)`,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: agent.color, border: '2px solid rgb(var(--card))' }} />

      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-lg" style={{ background: agent.color + '18' }}>
          {agent.icon}
        </div>
        <span className="font-semibold text-ink-700 text-sm tracking-tight">{agent.name}</span>
      </div>

      <div className={`text-[11px] mb-1 flex items-center gap-1 ${isConfigured ? 'text-emerald-600' : 'text-ink-300'}`}>
        <span className="text-[10px]">{isConfigured ? '✓' : '○'}</span>
        <span>{actionLabel}</span>
      </div>

      {isConfigured && Object.keys(data.inputs || {}).filter(k => data.inputs[k]).length > 0 && (
        <div className="text-[10px] text-ink-400 mt-1">
          {Object.keys(data.inputs).filter(k => data.inputs[k]).length} input(s)
        </div>
      )}

      {condition && (
        <div className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
          <span>⚡</span>
          <span>Conditional</span>
        </div>
      )}

      {!isConfigured && (
        <div className="text-[10px] text-ink-300 mt-1 italic">Click to configure</div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5" style={{ background: agent.color, border: '2px solid rgb(var(--card))' }} />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

