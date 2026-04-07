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
      className={`px-4 py-3 rounded-2xl min-w-[220px] bg-dark-800/80 backdrop-blur-xl cursor-pointer transition-all duration-200 border ${
        selected
          ? 'border-white/20 scale-[1.03]'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
      style={{
        boxShadow: selected
          ? `0 8px 32px ${agent.color}30, 0 0 0 1px ${agent.color}25, inset 0 0 0 1px rgba(255,255,255,0.04)`
          : `0 2px 12px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.02)`,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: agent.color, border: '2px solid rgba(0,0,0,0.3)' }} />

      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: agent.color + '18' }}>
          {agent.icon}
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">{agent.name}</span>
      </div>

      <div className={`text-[11px] mb-1 flex items-center gap-1 ${isConfigured ? 'text-emerald-400' : 'text-dark-500'}`}>
        <span className="text-[10px]">{isConfigured ? '✓' : '○'}</span>
        <span>{actionLabel}</span>
      </div>

      {isConfigured && Object.keys(data.inputs || {}).filter(k => data.inputs[k]).length > 0 && (
        <div className="text-[10px] text-dark-400 mt-1">
          {Object.keys(data.inputs).filter(k => data.inputs[k]).length} input(s)
        </div>
      )}

      {condition && (
        <div className="text-[10px] text-amber-400/80 mt-1.5 flex items-center gap-1">
          <span>⚡</span>
          <span>Conditional</span>
        </div>
      )}

      {!isConfigured && (
        <div className="text-[10px] text-dark-500 mt-1 italic">Click to configure</div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5" style={{ background: agent.color, border: '2px solid rgba(0,0,0,0.3)' }} />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

