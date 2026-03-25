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
      className={`px-4 py-3 rounded-lg shadow-xl border-2 min-w-[220px] bg-dark-800 cursor-pointer transition-all ${
        selected ? 'ring-2 ring-white/30 scale-105' : 'hover:brightness-110'
      }`}
      style={{
        borderColor: agent.color,
        boxShadow: selected
          ? `0 4px 24px ${agent.color}60, 0 0 0 2px ${agent.color}30`
          : `0 4px 20px ${agent.color}40`,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ background: agent.color }} />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{agent.icon}</span>
        <span className="font-bold text-white text-sm">{agent.name}</span>
      </div>

      <div className={`text-xs mb-1 flex items-center gap-1 ${isConfigured ? 'text-green-400' : 'text-gray-500'}`}>
        <span>{isConfigured ? '✓' : '○'}</span>
        <span>{actionLabel}</span>
      </div>

      {/* Input count badge */}
      {isConfigured && Object.keys(data.inputs || {}).filter(k => data.inputs[k]).length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {Object.keys(data.inputs).filter(k => data.inputs[k]).length} input(s) configured
        </div>
      )}

      {condition && (
        <div className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
          <span>⚠️</span>
          <span>Conditional</span>
        </div>
      )}

      {!isConfigured && (
        <div className="text-xs text-gray-600 mt-1 italic">Click to configure</div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ background: agent.color }} />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

