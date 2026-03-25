'use client'

import { useState, useEffect } from 'react'
import { Node } from 'reactflow'
import { Agent, AgentAction } from './WorkflowBuilder'

// Actions available per system agent type
const SYSTEM_AGENT_ACTIONS: Record<string, AgentAction[]> = {
  generator: [
    { id: 'create_feature', label: 'Create Feature', inputs: [
      { key: 'description', label: 'Feature Description', type: 'textarea', placeholder: 'Describe the feature to generate...', required: true },
      { key: 'context', label: 'Additional Context', type: 'textarea', placeholder: 'Any context or constraints...' },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to do...', required: true },
    ]},
  ],
  reviewer: [
    { id: 'analyze_code', label: 'Analyze Code', inputs: [
      { key: 'code', label: 'Code to Review', type: 'textarea', placeholder: 'Paste code or use {{prev_step.output}}...', required: true },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to review...', required: true },
    ]},
  ],
  tester: [
    { id: 'create_unit_tests', label: 'Create Unit Tests', inputs: [
      { key: 'code', label: 'Code to Test', type: 'textarea', placeholder: 'Paste code or use {{prev_step.output}}...', required: true },
      { key: 'coverage_target', label: 'Coverage Target (%)', type: 'text', placeholder: '80' },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to test...', required: true },
    ]},
  ],
  documenter: [
    { id: 'generate_api_docs', label: 'Generate API Docs', inputs: [
      { key: 'code', label: 'Code to Document', type: 'textarea', placeholder: 'Paste code or use {{prev_step.output}}...', required: true },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to document...', required: true },
    ]},
  ],
  debugger: [
    { id: 'debug_error', label: 'Debug Error', inputs: [
      { key: 'error', label: 'Error Message', type: 'textarea', placeholder: 'Paste the error message...', required: true },
      { key: 'stack_trace', label: 'Stack Trace', type: 'textarea', placeholder: 'Paste stack trace...' },
    ]},
    { id: 'fix_code', label: 'Fix Code', inputs: [
      { key: 'code', label: 'Code to Fix', type: 'textarea', placeholder: 'Paste the broken code...', required: true },
      { key: 'issues', label: 'Known Issues', type: 'textarea', placeholder: 'Describe the issues...' },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to debug...', required: true },
    ]},
  ],
  security: [
    { id: 'scan_vulnerabilities', label: 'Scan Vulnerabilities', inputs: [
      { key: 'code', label: 'Code to Scan', type: 'textarea', placeholder: 'Paste code or use {{prev_step.output}}...', required: true },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to scan...', required: true },
    ]},
  ],
  refactor: [
    { id: 'refactor_code', label: 'Refactor Code', inputs: [
      { key: 'code', label: 'Code to Refactor', type: 'textarea', placeholder: 'Paste code or use {{prev_step.output}}...', required: true },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe refactoring goals...', required: true },
    ]},
  ],
  devops: [
    { id: 'create_pull_request', label: 'Create PR', inputs: [
      { key: 'title', label: 'PR Title', type: 'text', placeholder: 'feat: add new feature', required: true },
      { key: 'description', label: 'PR Description', type: 'textarea', placeholder: 'Describe the changes...' },
      { key: 'files', label: 'Files', type: 'text', placeholder: 'Comma-separated file paths...' },
    ]},
    { id: 'execute', label: 'Custom Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe the DevOps task...', required: true },
    ]},
  ],
}

// Resolve actions: use agent.actions for custom agents, SYSTEM_AGENT_ACTIONS for system agents
function getAgentActions(agent: Agent): AgentAction[] {
  if (agent.actions && agent.actions.length > 0) {
    return agent.actions
  }
  return SYSTEM_AGENT_ACTIONS[agent.id] || []
}

interface NodeConfigPanelProps {
  node: Node | null
  onClose: () => void
  onUpdate: (nodeId: string, data: { action: string; inputs: Record<string, any>; condition: string }) => void
  onDelete: (nodeId: string) => void
}

export function NodeConfigPanel({ node, onClose, onUpdate, onDelete }: NodeConfigPanelProps) {
  const [action, setAction] = useState('')
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [condition, setCondition] = useState('')

  // Sync state when node changes
  useEffect(() => {
    if (node) {
      setAction(node.data.action || '')
      setInputs(node.data.inputs || {})
      setCondition(node.data.condition || '')
    }
  }, [node])

  if (!node) return null

  const agent: Agent = node.data.agent
  const availableActions = getAgentActions(agent)
  const selectedAction = availableActions.find(a => a.id === action)

  const handleSave = () => {
    onUpdate(node.id, { action, inputs, condition })
    onClose()
  }

  return (
    <div className="w-96 bg-dark-800 border-l border-dark-700 p-5 overflow-y-auto flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h3 className="text-white font-bold text-lg">{agent.name}</h3>
            <p className="text-gray-400 text-xs">{agent.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>

      {/* Action Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setInputs({}); }}
          className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
        >
          <option value="">Select an action...</option>
          {availableActions.map(a => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* Dynamic Input Fields */}
      {selectedAction && (
        <div className="space-y-4 flex-1">
          {selectedAction.inputs.map(input => (
            <div key={input.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {input.label} {input.required && <span className="text-red-400">*</span>}
              </label>
              {input.type === 'textarea' ? (
                <textarea
                  value={inputs[input.key] || ''}
                  onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  placeholder={input.placeholder}
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={inputs[input.key] || ''}
                  onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  placeholder={input.placeholder}
                  className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
              )}
            </div>
          ))}
          {/* Variable Reference Hint */}
          <div className="p-3 bg-dark-900 rounded-lg border border-dark-600">
            <p className="text-xs text-gray-400 mb-1">💡 <span className="text-gray-300 font-medium">Variable References</span></p>
            <p className="text-xs text-gray-500">
              Use <code className="text-primary-400 bg-dark-700 px-1 rounded">{'{{step_id.output}}'}</code> to reference output from a previous step.
            </p>
          </div>
        </div>
      )}

      {/* Condition Editor */}
      <div className="mt-4 mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Condition <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="e.g. {{review.quality_score}} > 7"
          className="w-full bg-dark-700 border border-dark-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Step runs only if condition is true. Leave empty to always run.</p>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-dark-700 space-y-2">
        <button
          onClick={handleSave}
          disabled={!action}
          className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition"
        >
          ✓ Save Configuration
        </button>
        <button
          onClick={() => { onDelete(node.id); onClose(); }}
          className="w-full px-4 py-2 bg-transparent hover:bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg text-sm transition"
        >
          🗑️ Remove Node
        </button>
      </div>
    </div>
  )
}
