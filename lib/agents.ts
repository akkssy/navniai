// Shared agent definitions — imported by both WorkflowBuilder and pipelineTemplates
// to avoid circular dependency.

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

// Viral Social Media agents (purpose-built for viral content pipelines)
export const VIRAL_SOCIAL_AGENTS: Agent[] = [
  { id: 'trend_scout', name: 'Trend Scout', icon: '📈', color: '#f97316', description: 'Discover high-velocity viral trends across niches using web search', category: 'system' },
  { id: 'audience_persona', name: 'Audience Persona', icon: '🎯', color: '#6366f1', description: 'Build a deep psychographic profile of the target audience to sharpen hook targeting', category: 'system' },
  { id: 'hook_generator', name: 'Hook Generator', icon: '🪝', color: '#ef4444', description: 'Generate 16 viral hook variants across 8 proven frameworks with platform-specific variants and engagement scoring', category: 'system' },
  { id: 'reel_scripter', name: 'Reel Scripter', icon: '🎬', color: '#a855f7', description: 'Create Instagram Reel scripts with hook-loop-value-CTA structure', category: 'system' },
  { id: 'carousel_writer', name: 'Carousel Writer', icon: '🎠', color: '#06b6d4', description: 'Generate slide-by-slide carousel content for Instagram & LinkedIn', category: 'system' },
  { id: 'viral_scorer', name: 'Viral Scorer', icon: '⚡', color: '#eab308', description: 'Score content on hook strength, shareability, platform fit & CTA clarity', category: 'system' },
  { id: 'angle_rotator', name: 'Angle Rotator', icon: '🔄', color: '#ec4899', description: 'When viral score is low, proposes 3 alternative angles and rewrites content from the strongest one', category: 'system' },
  { id: 'platform_adapter', name: 'Platform Adapter', icon: '🔧', color: '#10b981', description: 'Reformat content for platform-specific constraints & algorithm signals', category: 'system' },
  { id: 'shot_compiler', name: 'Shot Compiler', icon: '🎞️', color: '#7c3aed', description: 'Convert the final reel script into a structured scene-by-scene JSON storyboard for preview and video production', category: 'system' },
]

// Keep backward compat export
export const AGENTS = SYSTEM_AGENTS
