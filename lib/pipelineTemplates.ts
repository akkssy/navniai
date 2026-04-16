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

  // ── HR & People ──────────────────────────────────────────
  {
    id: 'hr-onboarding',
    name: 'Employee Onboarding',
    icon: '👋',
    color: '#10b981',
    category: 'HR & People',
    description: 'Automate new hire onboarding: generate welcome docs, setup checklists, compliance training plans, and IT provisioning requests.',
    status: 'popular',
    runs: 178,
    lastRun: '1 hour ago',
    steps: [
      { agentId: 'documenter', action: 'execute', label: 'Welcome Package', inputs: { task: 'Generate a personalized welcome document including company overview, team introductions, first-week schedule, and key contacts.' } },
      { agentId: 'generator', action: 'execute', label: 'Setup Checklist', inputs: { task: 'Create a comprehensive onboarding checklist: IT equipment, software access, badge, benefits enrollment, and mandatory training modules.' } },
      { agentId: 'security', action: 'execute', label: 'Access Provisioning', inputs: { task: 'Generate IT access provisioning request: email account, Slack, GitHub, VPN, and role-based system permissions.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Compliance Check', inputs: { task: 'Verify onboarding package meets labor law requirements, I-9/W-4 documentation, NDA, and IP assignment compliance.' } },
    ],
  },
  {
    id: 'hr-performance-review',
    name: 'Performance Review Cycle',
    icon: '📊',
    color: '#a855f7',
    category: 'HR & People',
    description: 'Streamline performance reviews: collect 360 feedback, analyze patterns, generate balanced assessments, and create growth plans.',
    status: 'active',
    runs: 92,
    lastRun: '2 days ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Feedback Analysis', inputs: { task: 'Analyze 360 feedback from peers, managers, and self-assessments. Identify recurring themes, strengths, and areas for improvement.' } },
      { agentId: 'generator', action: 'execute', label: 'Performance Summary', inputs: { task: 'Generate a balanced performance summary with specific examples, quantified achievements, and objective assessment aligned to role expectations.' } },
      { agentId: 'documenter', action: 'execute', label: 'Growth Plan', inputs: { task: 'Create a personalized development plan with SMART goals, recommended training, mentorship pairings, and quarterly milestones.' } },
    ],
  },

  // ── Finance ──────────────────────────────────────────────
  {
    id: 'finance-expense-audit',
    name: 'Expense Report Audit',
    icon: '💰',
    color: '#f59e0b',
    category: 'Finance',
    description: 'Automated expense report auditing: policy compliance check, anomaly detection, and monthly summary generation.',
    status: 'active',
    runs: 203,
    lastRun: '3 hours ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Policy Compliance', inputs: { task: 'Audit each expense line item against company policy: per-diem limits, approved vendors, receipt requirements, and category rules.' } },
      { agentId: 'security', action: 'execute', label: 'Anomaly Detection', inputs: { task: 'Flag anomalies: duplicate submissions, unusual amounts, weekend expenses, split transactions to avoid approval thresholds.' } },
      { agentId: 'documenter', action: 'execute', label: 'Audit Report', inputs: { task: 'Generate a detailed audit report with approved items, flagged items, total amounts, and recommended actions per department.' } },
    ],
  },
  {
    id: 'finance-month-close',
    name: 'Month-End Close',
    icon: '📅',
    color: '#6366f1',
    category: 'Finance',
    description: 'Accelerate month-end close: reconcile accounts, verify journal entries, generate financial statements, and flag discrepancies.',
    status: 'popular',
    runs: 67,
    lastRun: '5 days ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Account Reconciliation', inputs: { task: 'Reconcile bank statements, sub-ledgers, and intercompany accounts. Identify unmatched transactions and outstanding items.' } },
      { agentId: 'debugger', action: 'execute', label: 'Discrepancy Analysis', inputs: { task: 'Analyze discrepancies between GL balances and sub-ledger totals. Trace root causes and suggest correcting journal entries.' } },
      { agentId: 'generator', action: 'execute', label: 'Financial Statements', inputs: { task: 'Generate trial balance, income statement, and balance sheet with period-over-period variance analysis.' } },
      { agentId: 'documenter', action: 'execute', label: 'Close Checklist', inputs: { task: 'Produce a month-end close checklist with completion status, sign-offs required, and outstanding items summary.' } },
    ],
  },

  // ── Legal & Compliance ───────────────────────────────────
  {
    id: 'legal-contract-review',
    name: 'Contract Review',
    icon: '⚖️',
    color: '#dc2626',
    category: 'Legal',
    description: 'AI-assisted contract analysis: extract key terms, flag risky clauses, check compliance, and generate negotiation notes.',
    status: 'popular',
    runs: 145,
    lastRun: '4 hours ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Clause Analysis', inputs: { task: 'Extract and analyze key contract clauses: liability caps, indemnification, termination, IP ownership, and non-compete terms.' } },
      { agentId: 'security', action: 'execute', label: 'Risk Assessment', inputs: { task: 'Flag high-risk clauses: unlimited liability, auto-renewal traps, broad IP assignments, one-sided termination, and missing SLAs.' } },
      { agentId: 'generator', action: 'execute', label: 'Redline Suggestions', inputs: { task: 'Generate redline suggestions for risky clauses with alternative language that better protects company interests.' } },
      { agentId: 'documenter', action: 'execute', label: 'Review Memo', inputs: { task: 'Create an executive summary memo with key terms, risk rating, recommended changes, and approval recommendation.' } },
    ],
  },
  {
    id: 'legal-compliance-check',
    name: 'Regulatory Compliance',
    icon: '🛡️',
    color: '#0891b2',
    category: 'Legal',
    description: 'Verify processes against GDPR, SOC2, HIPAA, or industry regulations. Generate gap analysis and remediation plans.',
    status: 'active',
    runs: 88,
    lastRun: '1 day ago',
    steps: [
      { agentId: 'security', action: 'execute', label: 'Regulation Mapping', inputs: { task: 'Map current processes and data flows against applicable regulations (GDPR, SOC2, HIPAA). Identify coverage gaps.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Gap Analysis', inputs: { task: 'Perform detailed gap analysis: missing controls, insufficient documentation, non-compliant data handling, and access issues.' } },
      { agentId: 'generator', action: 'execute', label: 'Remediation Plan', inputs: { task: 'Generate a prioritized remediation plan with specific actions, owners, timelines, and effort estimates for each gap.' } },
    ],
  },

  // ── Sales & Revenue ──────────────────────────────────────
  {
    id: 'sales-lead-scoring',
    name: 'Lead Qualification Pipeline',
    icon: '🎯',
    color: '#f97316',
    category: 'Sales',
    description: 'Score and qualify inbound leads: analyze fit, enrich company data, generate personalized outreach, and route to the right rep.',
    status: 'popular',
    runs: 267,
    lastRun: '30 minutes ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Lead Scoring', inputs: { task: 'Score the lead based on ICP fit: company size, industry, tech stack, budget signals, and engagement history.' } },
      { agentId: 'generator', action: 'execute', label: 'Company Research', inputs: { task: 'Enrich lead data: pull company info, recent news, funding rounds, tech stack, and key decision-makers.' } },
      { agentId: 'documenter', action: 'execute', label: 'Outreach Draft', inputs: { task: 'Generate a personalized outreach sequence: intro email, follow-up, and LinkedIn message tailored to their pain points.' } },
    ],
  },
  {
    id: 'sales-proposal-gen',
    name: 'Proposal Generator',
    icon: '📝',
    color: '#8b5cf6',
    category: 'Sales',
    description: 'Generate tailored sales proposals: scope of work, pricing options, ROI projections, and executive summary.',
    status: 'active',
    runs: 124,
    lastRun: '6 hours ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Requirements Analysis', inputs: { task: 'Analyze client requirements, pain points, and success criteria from discovery call notes and RFP documents.' } },
      { agentId: 'generator', action: 'execute', label: 'Proposal Draft', inputs: { task: 'Generate a professional proposal with executive summary, solution architecture, implementation timeline, and pricing tiers.' } },
      { agentId: 'documenter', action: 'execute', label: 'ROI Analysis', inputs: { task: 'Create an ROI projection with cost savings, efficiency gains, and payback period based on client industry benchmarks.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Quality Review', inputs: { task: 'Review proposal for accuracy, consistency, competitive positioning, and alignment with client requirements.' } },
    ],
  },

  // ── Marketing ────────────────────────────────────────────
  {
    id: 'marketing-content',
    name: 'Content Marketing Pipeline',
    icon: '✍️',
    color: '#ec4899',
    category: 'Marketing',
    description: 'End-to-end content creation: research topics, generate blog posts, optimize for SEO, and create social media snippets.',
    status: 'popular',
    runs: 312,
    lastRun: '1 hour ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Topic Research', inputs: { task: 'Research trending topics in the target niche: keyword volume, competitor gaps, audience questions, and content opportunities.' } },
      { agentId: 'generator', action: 'execute', label: 'Content Draft', inputs: { task: 'Write a comprehensive, engaging blog post with clear structure, examples, data points, and a compelling narrative.' } },
      { agentId: 'refactor', action: 'execute', label: 'SEO Optimization', inputs: { task: 'Optimize content for SEO: meta title, description, header tags, keyword density, internal links, and readability score.' } },
      { agentId: 'documenter', action: 'execute', label: 'Social Snippets', inputs: { task: 'Create social media posts for LinkedIn, Twitter/X, and newsletter from the blog content with platform-specific formatting.' } },
    ],
  },

  // ── Customer Support ─────────────────────────────────────
  {
    id: 'support-ticket-triage',
    name: 'Support Ticket Triage',
    icon: '🎫',
    color: '#14b8a6',
    category: 'Customer Support',
    description: 'Intelligent ticket routing: classify priority, detect sentiment, draft responses, and escalate critical issues automatically.',
    status: 'active',
    runs: 445,
    lastRun: '5 minutes ago',
    steps: [
      { agentId: 'reviewer', action: 'execute', label: 'Classify & Prioritize', inputs: { task: 'Classify ticket by category (bug, feature request, billing, how-to) and priority (P0-P3) based on content and customer tier.' } },
      { agentId: 'debugger', action: 'execute', label: 'Root Cause Analysis', inputs: { task: 'For bug reports: analyze error details, reproduce steps, and identify likely root cause from known issues database.' } },
      { agentId: 'generator', action: 'execute', label: 'Response Draft', inputs: { task: 'Draft a helpful, empathetic response with solution steps, workarounds, or clear escalation path for the customer.' } },
    ],
  },

  // ── Data & Analytics ─────────────────────────────────────
  {
    id: 'data-pipeline-qa',
    name: 'Data Pipeline QA',
    icon: '🔬',
    color: '#6366f1',
    category: 'Data & Analytics',
    description: 'Validate data pipelines: schema checks, data quality rules, anomaly detection, and pipeline health reports.',
    status: 'active',
    runs: 156,
    lastRun: '2 hours ago',
    steps: [
      { agentId: 'tester', action: 'execute', label: 'Schema Validation', inputs: { task: 'Validate data schemas: check column types, nullable constraints, primary keys, foreign key relationships, and naming conventions.' } },
      { agentId: 'reviewer', action: 'execute', label: 'Quality Rules', inputs: { task: 'Apply data quality rules: completeness checks, range validations, uniqueness constraints, referential integrity, and freshness.' } },
      { agentId: 'debugger', action: 'execute', label: 'Anomaly Detection', inputs: { task: 'Detect anomalies: sudden volume changes, distribution shifts, null rate spikes, duplicate patterns, and stale partitions.' } },
      { agentId: 'documenter', action: 'execute', label: 'Health Report', inputs: { task: 'Generate a pipeline health report with pass/fail metrics, data quality scores, trend charts, and remediation priorities.' } },
    ],
  },

  // ── IT Operations ────────────────────────────────────────
  {
    id: 'it-incident-response',
    name: 'Incident Response',
    icon: '🚨',
    color: '#ef4444',
    category: 'IT Operations',
    description: 'Structured incident management: detect issues, analyze impact, coordinate response, and generate post-mortem reports.',
    status: 'popular',
    runs: 198,
    lastRun: '45 minutes ago',
    steps: [
      { agentId: 'debugger', action: 'execute', label: 'Issue Detection', inputs: { task: 'Analyze alerts, logs, and metrics to identify the incident scope: affected services, error rates, and user impact.' } },
      { agentId: 'security', action: 'execute', label: 'Impact Assessment', inputs: { task: 'Assess security and business impact: data exposure risk, SLA breach potential, affected customer count, and revenue impact.' } },
      { agentId: 'generator', action: 'execute', label: 'Runbook Execution', inputs: { task: 'Generate step-by-step mitigation runbook: rollback procedures, feature flags, traffic rerouting, and communication templates.' } },
      { agentId: 'documenter', action: 'execute', label: 'Post-Mortem', inputs: { task: 'Create a blameless post-mortem: timeline, root cause analysis, contributing factors, action items with owners, and prevention measures.' } },
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

