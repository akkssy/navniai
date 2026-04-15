import { SYSTEM_AGENTS } from '@/components/WorkflowBuilder'

export interface PipelineStep {
  agentId: string       // references SYSTEM_AGENTS id
  action: string        // the action to perform
  label: string         // human-readable step label
  inputs: Record<string, string>
}

export interface PipelineTemplate {
  id: string
  name: string
  icon: string
  color: string
  category: string
  description: string
  status: 'active' | 'draft' | 'popular'
  runs: number
  lastRun: string
  steps: PipelineStep[]
}

export function getAgentForStep(step: PipelineStep) {
  return SYSTEM_AGENTS.find(a => a.id === step.agentId)
}

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'pr-review',
    name: 'PR Review Pipeline',
    icon: '📋',
    color: '#8b5cf6',
    category: 'Code Quality',
    description: 'Automated code review for pull requests. Runs security scan, code quality analysis, and posts a summary comment.',
    status: 'active',
    runs: 245,
    lastRun: '2 hours ago',
    steps: [
      { agentId: 'security', action: 'execute', label: 'Security Scan', inputs: { task: 'Scan the PR diff for security vulnerabilities, exposed secrets, and unsafe patterns.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Code Review', inputs: { task: 'Review code quality: naming, complexity, SOLID principles, and potential bugs.' } },
      { agentId: 'documenter', action: 'execute', label: 'Summary Report', inputs: { task: 'Compile a PR review summary from the security scan and code review findings.' } },
    ],
  },
  {
    id: 'feature-dev',
    name: 'Feature Development',
    icon: '🚀',
    color: '#3b82f6',
    category: 'Development',
    description: 'End-to-end feature creation: generates code, writes tests, creates documentation, and opens a PR.',
    status: 'active',
    runs: 187,
    lastRun: '1 day ago',
    steps: [
      { agentId: 'generator', action: 'execute', label: 'Generate Code', inputs: { task: 'Generate the implementation for the requested feature following project conventions.' } },
      { agentId: 'tester', action: 'execute', label: 'Write Tests', inputs: { task: 'Write comprehensive unit tests for the generated code with edge cases.' } },
      { agentId: 'documenter', action: 'execute', label: 'Generate Docs', inputs: { task: 'Create API documentation and usage examples for the new feature.' } },
      { agentId: 'devops', action: 'execute', label: 'Create PR', inputs: { task: 'Prepare a pull request with the code, tests, and docs. Include a descriptive PR body.' } },
    ],
  },
  {
    id: 'bug-fix',
    name: 'Bug Fix Workflow',
    icon: '🐛',
    color: '#ef4444',
    category: 'Debugging',
    description: 'Analyze error logs, identify root cause, generate a fix, write regression tests, and submit for review.',
    status: 'active',
    runs: 312,
    lastRun: '30 minutes ago',
    steps: [
      { agentId: 'debugger', action: 'execute', label: 'Analyze Error', inputs: { task: 'Analyze the stack trace and error logs to identify the root cause of the bug.' } },
      { agentId: 'generator', action: 'execute', label: 'Generate Fix', inputs: { task: 'Generate a minimal, targeted fix for the identified root cause.' } },
      { agentId: 'tester', action: 'execute', label: 'Regression Test', inputs: { task: 'Write a regression test that reproduces the original bug and verifies the fix.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Review Fix', inputs: { task: 'Review the fix for correctness, potential side effects, and code quality.' } },
    ],
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    icon: '🔒',
    color: '#ec4899',
    category: 'Security',
    description: 'Comprehensive security scan: vulnerability detection, dependency audit, and remediation suggestions.',
    status: 'popular',
    runs: 156,
    lastRun: '4 hours ago',
    steps: [
      { agentId: 'security', action: 'execute', label: 'Vulnerability Scan', inputs: { task: 'Perform a deep vulnerability scan: SQL injection, XSS, CSRF, auth bypass, and data exposure.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Dependency Audit', inputs: { task: 'Audit all dependencies for known CVEs, outdated packages, and license compliance.' } },
      { agentId: 'refactor', action: 'execute', label: 'Remediation Plan', inputs: { task: 'Create a prioritized remediation plan with specific code changes for each finding.' } },
    ],
  },
  {
    id: 'code-refactor',
    name: 'Code Refactoring',
    icon: '🔄',
    color: '#06b6d4',
    category: 'Code Quality',
    description: 'Analyze code quality, identify tech debt, refactor for readability and performance, then verify with tests.',
    status: 'draft',
    runs: 89,
    lastRun: '3 days ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Quality Analysis', inputs: { task: 'Analyze code for complexity, duplication, naming issues, and SOLID violations.' } },
      { agentId: 'refactor', action: 'execute', label: 'Refactor Code', inputs: { task: 'Apply refactoring patterns: extract methods, reduce complexity, improve naming.' } },
      { agentId: 'tester', action: 'execute', label: 'Verify Tests', inputs: { task: 'Run existing tests and add coverage for refactored sections to ensure no regressions.' } },
    ],
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    icon: '📚',
    color: '#f59e0b',
    category: 'Documentation',
    description: 'Auto-generate comprehensive API docs from your codebase, including examples and schemas.',
    status: 'active',
    runs: 134,
    lastRun: '6 hours ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Analyze API', inputs: { task: 'Extract all API endpoints, parameters, request/response types, and auth requirements.' } },
      { agentId: 'documenter', action: 'execute', label: 'Generate Docs', inputs: { task: 'Generate OpenAPI/Swagger-style documentation with descriptions, examples, and error codes.' } },
    ],
  },
]

export function getTemplateById(id: string): PipelineTemplate | undefined {
  return PIPELINE_TEMPLATES.find(t => t.id === id)
}

export function getTemplateStepAgents(template: PipelineTemplate) {
  return template.steps.map(step => ({
    ...step,
    agent: getAgentForStep(step),
  }))
}

