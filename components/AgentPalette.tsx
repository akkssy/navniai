'use client'

import { useState } from 'react'
import { Agent, AgentAction } from './WorkflowBuilder'

const ICON_OPTIONS = ['🤖', '📄', '💬', '📊', '⚖️', '📧', '💡', '✍️', '📱', '🎯', '🏥', '🏦', '🎓', '🛒', '📑', '🚩', '👥', '📋', '🔧', '🎨']
const COLOR_OPTIONS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7']

// Pre-built domain agent templates
interface AgentTemplate {
  name: string
  icon: string
  color: string
  description: string
  systemPrompt: string
  domain: string
  actions: { id: string; label: string }[]
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  // HR
  {
    name: 'Resume Screener', icon: '👥', color: '#8b5cf6', domain: 'HR',
    description: 'Screen resumes against job descriptions',
    systemPrompt: 'You are an expert HR recruiter. You screen resumes against job descriptions, evaluate candidate fit based on skills, experience, and cultural alignment. Provide structured assessments with scores.',
    actions: [{ id: 'screen_resume', label: 'Screen Resume' }, { id: 'rank_candidates', label: 'Rank Candidates' }, { id: 'execute', label: 'Custom Task' }],
  },
  {
    name: 'Interview Prep', icon: '🎯', color: '#6366f1', domain: 'HR',
    description: 'Generate interview questions and evaluation criteria',
    systemPrompt: 'You are a hiring manager assistant. Generate role-specific interview questions, create evaluation rubrics, and prepare structured interview guides based on job requirements.',
    actions: [{ id: 'generate_questions', label: 'Generate Questions' }, { id: 'create_rubric', label: 'Create Rubric' }, { id: 'execute', label: 'Custom Task' }],
  },
  // Legal
  {
    name: 'Contract Reviewer', icon: '⚖️', color: '#ef4444', domain: 'Legal',
    description: 'Review contracts and flag risks',
    systemPrompt: 'You are a legal contract analyst. Review contracts for risks, unfavorable terms, missing clauses, and compliance issues. Provide a structured risk assessment with severity levels and suggested revisions.',
    actions: [{ id: 'review_contract', label: 'Review Contract' }, { id: 'flag_risks', label: 'Flag Risks' }, { id: 'suggest_clauses', label: 'Suggest Clauses' }, { id: 'execute', label: 'Custom Task' }],
  },
  {
    name: 'Compliance Checker', icon: '📑', color: '#f97316', domain: 'Legal',
    description: 'Check documents for regulatory compliance',
    systemPrompt: 'You are a regulatory compliance expert. Analyze documents, policies, and procedures against relevant regulations (GDPR, HIPAA, SOX, etc.). Identify non-compliance issues and recommend corrective actions.',
    actions: [{ id: 'check_compliance', label: 'Check Compliance' }, { id: 'generate_report', label: 'Generate Report' }, { id: 'execute', label: 'Custom Task' }],
  },
  // Marketing
  {
    name: 'Content Writer', icon: '✍️', color: '#22c55e', domain: 'Marketing',
    description: 'Generate marketing content with brand voice',
    systemPrompt: 'You are an expert content marketer. Write compelling copy that matches brand voice and tone. Create blog posts, social media content, email campaigns, and landing page copy optimized for engagement and conversion.',
    actions: [{ id: 'write_blog', label: 'Write Blog Post' }, { id: 'social_post', label: 'Social Media Post' }, { id: 'email_campaign', label: 'Email Campaign' }, { id: 'execute', label: 'Custom Task' }],
  },
  {
    name: 'SEO Analyst', icon: '📊', color: '#06b6d4', domain: 'Marketing',
    description: 'Analyze and optimize content for search engines',
    systemPrompt: 'You are an SEO specialist. Analyze content for search engine optimization, suggest keyword improvements, meta descriptions, and content structure changes to improve rankings and organic traffic.',
    actions: [{ id: 'analyze_seo', label: 'Analyze SEO' }, { id: 'keyword_research', label: 'Keyword Research' }, { id: 'execute', label: 'Custom Task' }],
  },
  // Finance
  {
    name: 'Financial Analyst', icon: '🏦', color: '#f59e0b', domain: 'Finance',
    description: 'Analyze financial data and generate reports',
    systemPrompt: 'You are a financial analyst. Analyze financial statements, budgets, and metrics. Identify trends, risks, and opportunities. Generate clear reports with actionable recommendations.',
    actions: [{ id: 'analyze_financials', label: 'Analyze Financials' }, { id: 'budget_review', label: 'Budget Review' }, { id: 'execute', label: 'Custom Task' }],
  },
  // Education
  {
    name: 'Curriculum Designer', icon: '🎓', color: '#a855f7', domain: 'Education',
    description: 'Design course curricula and learning materials',
    systemPrompt: 'You are an instructional designer. Create structured course outlines, lesson plans, learning objectives, and assessment criteria. Design engaging educational content adapted to the target audience.',
    actions: [{ id: 'design_course', label: 'Design Course' }, { id: 'create_assessment', label: 'Create Assessment' }, { id: 'execute', label: 'Custom Task' }],
  },
  // Customer Support
  {
    name: 'Support Agent', icon: '💬', color: '#14b8a6', domain: 'Support',
    description: 'Draft customer support responses',
    systemPrompt: 'You are a customer support specialist. Draft helpful, empathetic, and professional responses to customer inquiries. Troubleshoot issues, provide solutions, and escalate when needed. Maintain a friendly tone.',
    actions: [{ id: 'draft_response', label: 'Draft Response' }, { id: 'troubleshoot', label: 'Troubleshoot Issue' }, { id: 'execute', label: 'Custom Task' }],
  },
  // Data
  {
    name: 'Data Analyst', icon: '📈', color: '#ec4899', domain: 'Data',
    description: 'Analyze datasets and generate insights',
    systemPrompt: 'You are a data analyst. Analyze datasets, identify patterns and trends, create statistical summaries, and generate actionable insights. Present findings in a clear, structured format with visualizations recommendations.',
    actions: [{ id: 'analyze_data', label: 'Analyze Data' }, { id: 'generate_insights', label: 'Generate Insights' }, { id: 'execute', label: 'Custom Task' }],
  },
]

// Group templates by domain
const TEMPLATE_DOMAINS = [...new Set(AGENT_TEMPLATES.map(t => t.domain))]

interface AgentPaletteProps {
  agents: Agent[]
  onAddAgent: (agent: Agent) => void
  onCreateAgent: (agent: Agent) => void
  onDeleteAgent?: (agentId: string) => void
}

export function AgentPalette({ agents, onAddAgent, onCreateAgent, onDeleteAgent }: AgentPaletteProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [activeTab, setActiveTab] = useState<'agents' | 'templates'>('agents')

  const systemAgents = agents.filter(a => a.category === 'system')
  const customAgents = agents.filter(a => a.category === 'custom')
  const existingIds = new Set(agents.map(a => a.name.toLowerCase()))

  const installTemplate = (template: AgentTemplate) => {
    const agentId = `custom_${template.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${Date.now()}`
    const agentActions: AgentAction[] = template.actions.map(a => ({
      id: a.id,
      label: a.label,
      inputs: [
        { key: 'task', label: 'Task Description', type: 'textarea' as const, placeholder: `Describe what to do for "${a.label}"...`, required: true },
        { key: 'context', label: 'Additional Context', type: 'textarea' as const, placeholder: 'Any additional context or data...' },
      ],
    }))
    onCreateAgent({
      id: agentId,
      name: template.name,
      icon: template.icon,
      color: template.color,
      description: template.description,
      category: 'custom',
      systemPrompt: template.systemPrompt,
      actions: agentActions,
    })
  }

  return (
    <div className="w-80 bg-card border-r border-surface-300 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-ink-700 text-base font-semibold tracking-tight">Agents</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-accent-600 hover:bg-accent-500 text-white text-[11px] rounded-md transition flex items-center gap-1 font-medium"
        >
          + Create
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4 bg-surface-100 rounded-md p-0.5 border border-surface-300">
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition ${activeTab === 'agents' ? 'bg-card text-ink-700 shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}
        >
          My Agents
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition ${activeTab === 'templates' ? 'bg-card text-ink-700 shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}
        >
          📦 Templates
        </button>
      </div>

      {activeTab === 'agents' ? (
        <>
          {/* Custom Agents */}
          {customAgents.length > 0 && (
            <>
              <p className="section-label mb-2">Your Agents</p>
              <div className="space-y-1.5 mb-4">
                {customAgents.map((agent) => (
                  <AgentButton key={agent.id} agent={agent} onAdd={onAddAgent} onDelete={onDeleteAgent} />
                ))}
              </div>
            </>
          )}

          {/* System Agents */}
          <p className="section-label mb-2">
            {customAgents.length > 0 ? 'Built-in (Code)' : 'Built-in Agents'}
          </p>
          <div className="space-y-1.5 mb-4">
            {systemAgents.map((agent) => (
              <AgentButton key={agent.id} agent={agent} onAdd={onAddAgent} />
            ))}
          </div>

          {customAgents.length === 0 && (
            <div className="mt-4 p-3.5 glass-card">
              <h4 className="text-ink-700 text-xs font-semibold mb-1.5">💡 Quick Tip</h4>
              <p className="text-ink-400 text-[11px] leading-relaxed">
                Click &quot;+ Create&quot; to build custom agents, or browse <button onClick={() => setActiveTab('templates')} className="text-accent-500 hover:underline">Templates</button> for ready-made agents.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Templates Tab */
        <div className="space-y-4">
          {TEMPLATE_DOMAINS.map(domain => (
            <div key={domain}>
              <p className="section-label mb-2">{domain}</p>
              <div className="space-y-1.5">
                {AGENT_TEMPLATES.filter(t => t.domain === domain).map(template => {
                  const alreadyAdded = existingIds.has(template.name.toLowerCase())
                  return (
                    <div
                      key={template.name}
                      className="p-2.5 rounded-md border border-surface-300 hover:border-surface-400 transition-all"
                      style={{ backgroundColor: template.color + '06' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: template.color + '15' }}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-ink-700 text-xs font-medium">{template.name}</div>
                          <div className="text-ink-400 text-[10px] mt-0.5 truncate">{template.description}</div>
                        </div>
                        <button
                          onClick={() => !alreadyAdded && installTemplate(template)}
                          disabled={alreadyAdded}
                          className={`px-2 py-1 text-[10px] rounded-md font-medium transition whitespace-nowrap ${
                            alreadyAdded
                              ? 'bg-surface-100 text-ink-300 cursor-default'
                              : 'bg-accent-50 text-accent-600 hover:bg-accent-100'
                          }`}
                        >
                          {alreadyAdded ? '✓ Added' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(agent) => { onCreateAgent(agent); setShowCreateModal(false); }}
        />
      )}
    </div>
  )
}

function AgentButton({ agent, onAdd, onDelete }: { agent: Agent; onAdd: (a: Agent) => void; onDelete?: (id: string) => void }) {
  return (
    <div
      className="w-full p-2.5 rounded-md text-left hover:bg-surface-50 transition-all group cursor-pointer border border-transparent hover:border-surface-300"
      onClick={() => onAdd(agent)}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: agent.color + '15' }}>
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-ink-700 text-xs font-medium flex items-center gap-1.5">
            {agent.name}
            {agent.category === 'custom' && (
              <span className="text-[9px] bg-accent-50 text-accent-600 px-1.5 py-0.5 rounded-md">custom</span>
            )}
          </div>
          <div className="text-ink-400 text-[10px] mt-0.5 truncate">{agent.description}</div>
        </div>
        {agent.category === 'custom' && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(agent.id) }}
            className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-500 text-xs transition p-1"
            title="Delete agent"
          >🗑️</button>
        )}
      </div>
    </div>
  )
}

function CreateAgentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (agent: Agent) => void }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🤖')
  const [color, setColor] = useState('#8b5cf6')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [actions, setActions] = useState<{ id: string; label: string }[]>([{ id: 'execute', label: 'Custom Task' }])
  const [newActionLabel, setNewActionLabel] = useState('')

  const handleAddAction = () => {
    if (!newActionLabel.trim()) return
    const id = newActionLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setActions(prev => [...prev, { id, label: newActionLabel.trim() }])
    setNewActionLabel('')
  }

  const handleCreate = () => {
    if (!name.trim()) return
    const agentId = `custom_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${Date.now()}`
    const agentActions: AgentAction[] = actions.map(a => ({
      id: a.id,
      label: a.label,
      inputs: [
        { key: 'task', label: 'Task Description', type: 'textarea' as const, placeholder: `Describe what to do for "${a.label}"...`, required: true },
        { key: 'context', label: 'Additional Context', type: 'textarea' as const, placeholder: 'Any additional context or data...' },
      ],
    }))
    onCreate({
      id: agentId,
      name: name.trim(),
      icon,
      color,
      description: description.trim() || `Custom agent: ${name.trim()}`,
      category: 'custom',
      systemPrompt: systemPrompt.trim(),
      actions: agentActions,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-surface-300 rounded-md w-[520px] max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-surface-300 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">Create Custom Agent</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-lg transition">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Agent Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Resume Screener, Contract Reviewer..."
              className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
            />
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-500 mb-1">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-lg transition ${
                      icon === i ? 'bg-accent-600 ring-2 ring-accent-300 text-white' : 'bg-surface-100 hover:bg-surface-200'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-500 mb-1">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition ${
                      color === c ? 'ring-2 ring-ink-700 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1.5">
              System Prompt <span className="text-ink-300 text-[10px]">(the agent&apos;s role & context)</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="You are an expert HR recruiter. You screen resumes against job descriptions, evaluate candidate fit, and provide structured assessments..."
              rows={4}
              className="w-full bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-y transition"
            />
          </div>

          {/* Actions */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1.5">Actions</label>
            <div className="space-y-1.5 mb-2">
              {actions.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2 bg-surface-50 border border-surface-300 px-3 py-1.5 rounded-md text-xs text-ink-500">
                  <span className="flex-1">{a.label}</span>
                  {i > 0 && (
                    <button
                      onClick={() => setActions(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-ink-300 hover:text-red-500 text-xs"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newActionLabel}
                onChange={e => setNewActionLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAction()}
                placeholder="Add action (e.g. Screen Resume)..."
                className="flex-1 bg-surface-50 border border-surface-300 text-ink-700 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
              />
              <button
                onClick={handleAddAction}
                disabled={!newActionLabel.trim()}
                className="px-3 py-2 bg-surface-200 hover:bg-surface-300 disabled:opacity-40 text-ink-700 text-xs rounded-md transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="p-3 rounded-md border border-surface-300" style={{ backgroundColor: color + '08', borderLeftWidth: 4, borderLeftColor: color }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="text-ink-700 text-sm font-medium">{name}</div>
                  <div className="text-ink-400 text-xs">{description || 'Custom agent'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-300 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-ink-400 hover:text-ink-700 text-xs transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="btn-primary disabled:bg-surface-300 disabled:text-ink-300 text-xs"
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  )
}

