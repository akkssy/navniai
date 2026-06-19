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
  // ─── Content Marketing Agents ───
  researcher: [
    { id: 'research_topic', label: 'Research Topic', inputs: [
      { key: 'topic', label: 'Topic / Keyword', type: 'text', placeholder: 'e.g. "AI in content marketing"', required: true },
      { key: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g. "SaaS marketers, beginner level"' },
      { key: 'competitors', label: 'Competitor URLs (optional)', type: 'textarea', placeholder: 'Paste competitor article URLs...' },
    ]},
    { id: 'generate_brief', label: 'Generate Content Brief', inputs: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Main topic for the content brief', required: true },
      { key: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'Comma-separated keywords...' },
      { key: 'word_count', label: 'Target Word Count', type: 'text', placeholder: '1500' },
    ]},
    { id: 'execute', label: 'Custom Research', inputs: [
      { key: 'task', label: 'Research Task', type: 'textarea', placeholder: 'Describe what to research...', required: true },
    ]},
  ],
  writer: [
    { id: 'write_article', label: 'Write Article', inputs: [
      { key: 'brief', label: 'Content Brief / Outline', type: 'textarea', placeholder: 'Paste outline or use {{researcher.output}}...', required: true },
      { key: 'tone', label: 'Tone', type: 'text', placeholder: 'professional / conversational / authoritative' },
      { key: 'word_count', label: 'Target Word Count', type: 'text', placeholder: '1500' },
    ]},
    { id: 'write_blog_post', label: 'Write Blog Post', inputs: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Blog post topic...', required: true },
      { key: 'keywords', label: 'Keywords to Include', type: 'text', placeholder: 'primary keyword, secondary keywords...' },
      { key: 'tone', label: 'Tone', type: 'text', placeholder: 'conversational / formal / witty' },
    ]},
    { id: 'execute', label: 'Custom Writing', inputs: [
      { key: 'task', label: 'Writing Task', type: 'textarea', placeholder: 'Describe what to write...', required: true },
    ]},
  ],
  editor: [
    { id: 'edit_article', label: 'Edit & Polish', inputs: [
      { key: 'content', label: 'Content to Edit', type: 'textarea', placeholder: 'Paste article or use {{writer.output}}...', required: true },
      { key: 'brand_voice', label: 'Brand Voice Guide (optional)', type: 'textarea', placeholder: 'Describe your brand tone and style...' },
    ]},
    { id: 'readability_check', label: 'Readability Audit', inputs: [
      { key: 'content', label: 'Content to Audit', type: 'textarea', placeholder: 'Paste content or use {{writer.output}}...', required: true },
    ]},
    { id: 'execute', label: 'Custom Editing', inputs: [
      { key: 'task', label: 'Editing Task', type: 'textarea', placeholder: 'Describe what to edit...', required: true },
    ]},
  ],
  seo_optimizer: [
    { id: 'optimize_seo', label: 'Full SEO Optimization', inputs: [
      { key: 'content', label: 'Content to Optimize', type: 'textarea', placeholder: 'Paste article or use {{editor.output}}...', required: true },
      { key: 'primary_keyword', label: 'Primary Keyword', type: 'text', placeholder: 'Your main target keyword', required: true },
      { key: 'secondary_keywords', label: 'Secondary Keywords', type: 'text', placeholder: 'Comma-separated secondary keywords...' },
    ]},
    { id: 'generate_metadata', label: 'Generate SEO Metadata', inputs: [
      { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Paste article or use {{writer.output}}...', required: true },
      { key: 'primary_keyword', label: 'Primary Keyword', type: 'text', placeholder: 'Target keyword...', required: true },
    ]},
    { id: 'execute', label: 'Custom SEO Task', inputs: [
      { key: 'task', label: 'SEO Task', type: 'textarea', placeholder: 'Describe what to optimize...', required: true },
    ]},
  ],
  social_writer: [
    { id: 'create_social_posts', label: 'Create Social Posts (All Platforms)', inputs: [
      { key: 'content', label: 'Source Content', type: 'textarea', placeholder: 'Paste article or use {{editor.output}}...', required: true },
      { key: 'platforms', label: 'Platforms', type: 'text', placeholder: 'LinkedIn, X/Twitter, Instagram, Newsletter (default: all)' },
    ]},
    { id: 'linkedin_post', label: 'LinkedIn Post', inputs: [
      { key: 'content', label: 'Source Content', type: 'textarea', placeholder: 'Paste article or key points...', required: true },
      { key: 'cta', label: 'Call to Action', type: 'text', placeholder: 'What should readers do? (e.g. Comment, Visit link)' },
    ]},
    { id: 'twitter_thread', label: 'X/Twitter Thread', inputs: [
      { key: 'content', label: 'Source Content', type: 'textarea', placeholder: 'Paste article or key points...', required: true },
      { key: 'thread_length', label: 'Thread Length', type: 'text', placeholder: '5-7 tweets (default)' },
    ]},
    { id: 'execute', label: 'Custom Social Task', inputs: [
      { key: 'task', label: 'Social Media Task', type: 'textarea', placeholder: 'Describe what to create...', required: true },
    ]},
  ],
  // ─── Viral Social Media Agents ───
  trend_scout: [
    { id: 'discover_trends', label: 'Discover Viral Trends', inputs: [
      { key: 'niche', label: 'Niche / Industry', type: 'text', placeholder: 'e.g. "AI tools", "fitness", "personal finance"', required: true },
      { key: 'persona', label: 'Target Persona', type: 'text', placeholder: 'e.g. "IT professionals", "startup founders"' },
      { key: 'timeframe', label: 'Timeframe', type: 'text', placeholder: 'last 24h (default)' },
    ]},
    { id: 'execute', label: 'Custom Trend Research', inputs: [
      { key: 'task', label: 'Research Task', type: 'textarea', placeholder: 'Describe what trends to find...', required: true },
    ]},
  ],
  hook_generator: [
    { id: 'generate_hooks', label: 'Generate 8 Viral Hooks', inputs: [
      { key: 'trend', label: 'Trend / Topic', type: 'textarea', placeholder: 'Paste trend or use {{trend_scout.output}}...', required: true },
      { key: 'persona', label: 'Target Persona', type: 'text', placeholder: 'e.g. "IT professionals", "startup founders"' },
    ]},
    { id: 'execute', label: 'Custom Hook Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what hooks to generate...', required: true },
    ]},
  ],
  reel_scripter: [
    { id: 'write_reel_script', label: 'Write Reel Script (60s)', inputs: [
      { key: 'hook', label: 'Selected Hook', type: 'textarea', placeholder: 'Paste hook or use {{hook_generator.output}}...', required: true },
      { key: 'topic', label: 'Topic / Context', type: 'textarea', placeholder: 'Background context for the reel content...' },
    ]},
    { id: 'execute', label: 'Custom Reel Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what reel to create...', required: true },
    ]},
  ],
  carousel_writer: [
    { id: 'write_carousel', label: 'Write Carousel (8-10 Slides)', inputs: [
      { key: 'hook', label: 'Selected Hook', type: 'textarea', placeholder: 'Paste hook or use {{hook_generator.output}}...', required: true },
      { key: 'topic', label: 'Topic / Context', type: 'textarea', placeholder: 'Background context for the carousel...' },
      { key: 'platform', label: 'Platform', type: 'text', placeholder: 'Instagram / LinkedIn (default: both)' },
    ]},
    { id: 'execute', label: 'Custom Carousel Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what carousel to create...', required: true },
    ]},
  ],
  viral_scorer: [
    { id: 'score_content', label: 'Score Viral Potential', inputs: [
      { key: 'content', label: 'Content to Score', type: 'textarea', placeholder: 'Paste content or use {{reel_scripter.output}}...', required: true },
      { key: 'platform', label: 'Target Platform', type: 'text', placeholder: 'Instagram / X / LinkedIn' },
      { key: 'persona', label: 'Target Persona', type: 'text', placeholder: 'Who is this for?' },
    ]},
    { id: 'execute', label: 'Custom Scoring Task', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to evaluate...', required: true },
    ]},
  ],
  platform_adapter: [
    { id: 'adapt_content', label: 'Adapt for All Platforms', inputs: [
      { key: 'content', label: 'Source Content', type: 'textarea', placeholder: 'Paste content or use {{viral_scorer.output}}...', required: true },
      { key: 'platforms', label: 'Platforms', type: 'text', placeholder: 'X, Instagram, LinkedIn, Facebook (default: all)' },
    ]},
    { id: 'execute', label: 'Custom Adaptation', inputs: [
      { key: 'task', label: 'Task', type: 'textarea', placeholder: 'Describe what to adapt...', required: true },
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
    <div className="w-96 bg-card border-l border-surface-300 p-5 overflow-y-auto flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center text-xl" style={{ background: agent.color + '18' }}>
            {agent.icon}
          </div>
          <div>
            <h3 className="text-ink-700 font-semibold text-sm tracking-tight">{agent.name}</h3>
            <p className="text-ink-400 text-[11px]">{agent.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-lg transition">✕</button>
      </div>

      {/* Action Selector */}
      <div className="mb-4">
        <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Action</label>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setInputs({}); }}
          className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
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
              <label className="block text-[11px] font-medium text-ink-500 mb-1.5">
                {input.label} {input.required && <span className="text-red-500">*</span>}
              </label>
              {input.type === 'textarea' ? (
                <textarea
                  value={inputs[input.key] || ''}
                  onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  placeholder={input.placeholder}
                  rows={3}
                  className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-y transition"
                />
              ) : (
                <input
                  type="text"
                  value={inputs[input.key] || ''}
                  onChange={(e) => setInputs({ ...inputs, [input.key]: e.target.value })}
                  placeholder={input.placeholder}
                  className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
                />
              )}
            </div>
          ))}
          {/* Variable Reference Hint */}
          <div className="p-3 glass-card">
            <p className="text-[11px] text-ink-400 mb-1">💡 <span className="text-ink-500 font-medium">Variable References</span></p>
            <p className="text-[11px] text-ink-400">
              Use <code className="text-accent-600 bg-surface-100 px-1 py-0.5 rounded">{'{{step_id.output}}'}</code> to reference output from a previous step.
            </p>
          </div>
        </div>
      )}

      {/* Condition Editor */}
      <div className="mt-4 mb-4">
        <label className="block text-[11px] font-medium text-ink-500 mb-1.5">
          Condition <span className="text-ink-300 text-[10px]">(optional)</span>
        </label>
        <input
          type="text"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="e.g. {{review.quality_score}} > 7"
          className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
        />
        <p className="text-[10px] text-ink-400 mt-1.5">Step runs only if condition is true. Leave empty to always run.</p>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-surface-300 space-y-2">
        <button
          onClick={handleSave}
          disabled={!action}
          className="w-full btn-primary disabled:bg-surface-300 disabled:text-ink-300 text-sm"
        >
          ✓ Save Configuration
        </button>
        <button
          onClick={() => { onDelete(node.id); onClose(); }}
          className="w-full px-4 py-2.5 bg-transparent hover:bg-red-50 text-red-500 border border-red-200 rounded-md text-sm transition"
        >
          🗑️ Remove Node
        </button>
      </div>
    </div>
  )
}
