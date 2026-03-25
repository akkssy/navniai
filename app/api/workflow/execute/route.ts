import { NextRequest, NextResponse } from 'next/server'

interface WorkflowStep {
  id: string
  agent: string
  agent_name?: string
  agent_category?: 'system' | 'custom'
  system_prompt?: string | null
  action: string
  action_label?: string
  depends_on: string[]
  inputs: Record<string, any>
  condition: string | null
}

interface WorkflowPayload {
  workflow: {
    name: string
    version: string
    steps: WorkflowStep[]
  }
  inputs: Record<string, any>
  user_id: string
}

// --- LLM Integration ---

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'auto' // 'ollama' | 'openai' | 'auto' | 'simulate'

// System prompts for built-in coding agents
const SYSTEM_AGENT_PROMPTS: Record<string, string> = {
  generator: 'You are an expert code generator. Create clean, well-structured, production-ready code based on the requirements. Include comments and follow best practices.',
  reviewer: 'You are a senior code reviewer. Analyze code for quality, bugs, security issues, and best practices. Provide a structured review with severity levels and actionable suggestions.',
  tester: 'You are a test engineering expert. Generate comprehensive unit tests with good coverage. Include edge cases, error handling, and clear test descriptions.',
  documenter: 'You are a technical documentation writer. Generate clear, comprehensive API docs, code comments, and usage examples.',
  debugger: 'You are a debugging expert. Analyze errors, stack traces, and code issues. Identify root causes and provide step-by-step fixes.',
  security: 'You are a security analyst. Scan code for vulnerabilities (XSS, SQL injection, auth issues, etc.). Provide severity ratings and remediation steps.',
  refactor: 'You are a refactoring specialist. Optimize code structure, reduce complexity, apply design patterns, and improve maintainability while preserving behavior.',
  devops: 'You are a DevOps engineer. Help with CI/CD pipelines, deployment configs, infrastructure as code, and operational tasks.',
}

async function callOllama(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: userMessage,
      system: systemPrompt,
      stream: false,
    }),
    signal: AbortSignal.timeout(60000), // 60s timeout
  })
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`)
  const data = await response.json()
  return data.response || ''
}

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`)
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callLLM(systemPrompt: string, userMessage: string): Promise<{ text: string; provider: string }> {
  // 'simulate' mode: skip LLM entirely
  if (LLM_PROVIDER === 'simulate') {
    throw new Error('simulate_mode')
  }

  // Try Ollama first if provider is 'ollama' or 'auto'
  if (LLM_PROVIDER === 'ollama' || LLM_PROVIDER === 'auto') {
    try {
      const text = await callOllama(systemPrompt, userMessage)
      return { text, provider: 'ollama' }
    } catch (e) {
      if (LLM_PROVIDER === 'ollama') throw e
      // auto: fall through to OpenAI
    }
  }

  // Try OpenAI if provider is 'openai' or 'auto' fallback
  if (LLM_PROVIDER === 'openai' || LLM_PROVIDER === 'auto') {
    try {
      const text = await callOpenAI(systemPrompt, userMessage)
      return { text, provider: 'openai' }
    } catch (e) {
      if (LLM_PROVIDER === 'openai') throw e
      // auto: fall through to simulation
    }
  }

  throw new Error('no_llm_available')
}

function buildUserMessage(step: WorkflowStep, prevOutputs: Record<string, any>): string {
  const parts: string[] = []
  const actionLabel = step.action_label || step.action

  parts.push(`Task: ${actionLabel}`)

  // Add all inputs
  for (const [key, value] of Object.entries(step.inputs || {})) {
    if (value) {
      // Replace {{step_id.output}} references with actual previous outputs
      let resolved = String(value)
      for (const [stepId, stepData] of Object.entries(prevOutputs)) {
        resolved = resolved.replace(`{{${stepId}.output}}`, (stepData as any).output || '')
      }
      parts.push(`${key}: ${resolved}`)
    }
  }

  return parts.join('\n\n')
}

// --- Simulated fallback responses (used when no LLM is available) ---

const SIMULATED_RESPONSES: Record<string, Record<string, (inputs: Record<string, any>) => string>> = {
  generator: {
    create_feature: (inputs) => `Generated feature: "${inputs.description || 'unnamed'}"\n\n// Feature code would be generated here based on the description.\n// Connect an LLM (Ollama or OpenAI) for real code generation.`,
    execute: (inputs) => `Generator completed task: "${inputs.task || 'unnamed'}"`,
  },
  reviewer: {
    analyze_code: (inputs) => `Code review complete.\n\nQuality Score: 8/10\nIssues Found: 2 minor\n- Consider adding input validation\n- Missing error handling on line 15\n\nCode reviewed: ${(inputs.code || '').substring(0, 50)}...`,
    execute: (inputs) => `Review completed: "${inputs.task || 'unnamed'}"`,
  },
  tester: {
    create_unit_tests: (inputs) => `Generated 5 unit tests with estimated ${inputs.coverage_target || 80}% coverage.\n\ndef test_happy_path(): ...\ndef test_edge_case(): ...\ndef test_error_handling(): ...`,
    execute: (inputs) => `Tests created for: "${inputs.task || 'unnamed'}"`,
  },
  documenter: {
    generate_api_docs: (inputs) => `## API Documentation\n\nGenerated documentation for the provided code.\n\n### Endpoints\n- GET /api/resource\n- POST /api/resource`,
    execute: (inputs) => `Documentation created: "${inputs.task || 'unnamed'}"`,
  },
  debugger: {
    debug_error: (inputs) => `## Debug Analysis\n\nError: ${(inputs.error || 'unknown').substring(0, 100)}\n\nRoot Cause: Likely a null reference.\nSuggested Fix: Add null check.`,
    fix_code: (inputs) => `Code fix applied. ${inputs.issues || 'Issues resolved'}.`,
    execute: (inputs) => `Debug task completed: "${inputs.task || 'unnamed'}"`,
  },
  security: {
    scan_vulnerabilities: (inputs) => `## Security Scan Results\n\nSeverity: 7/10\nFound: 1 medium — potential SQL injection\nFix: Use parameterized queries.`,
    execute: (inputs) => `Security scan completed: "${inputs.task || 'unnamed'}"`,
  },
  refactor: {
    refactor_code: (inputs) => `## Refactoring Complete\n\n- Extracted helper functions\n- Reduced complexity from 12 to 4\n- Applied DRY principle`,
    execute: (inputs) => `Refactoring completed: "${inputs.task || 'unnamed'}"`,
  },
  devops: {
    create_pull_request: (inputs) => `## PR Created\n\nTitle: ${inputs.title || 'Untitled'}\nDescription: ${inputs.description || 'No description'}\nFiles: ${inputs.files || 'auto-detected'}`,
    execute: (inputs) => `DevOps task completed: "${inputs.task || 'unnamed'}"`,
  },
}

function getSimulatedOutput(step: WorkflowStep): string {
  if (step.agent_category === 'custom') {
    const agentName = step.agent_name || step.agent
    const actionLabel = step.action_label || step.action
    const taskDesc = step.inputs.task || step.inputs.description || 'the requested task'
    return `## ${agentName} — ${actionLabel}\n\n✅ Task completed (simulated).\n\nProcessed: "${taskDesc}"\n\n> ⚠️ No LLM connected. Set OLLAMA_URL or OPENAI_API_KEY in .env.local for real AI responses.`
  }
  const agentResponses = SIMULATED_RESPONSES[step.agent] || {}
  const handler = agentResponses[step.action] || agentResponses['execute']
  return handler ? handler(step.inputs) : `Step ${step.id} completed (${step.agent}/${step.action})`
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: WorkflowPayload = await request.json()
    const { workflow, inputs } = body
    const steps = workflow.steps

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { status: 'failed', error: 'No steps in workflow' },
        { status: 400 }
      )
    }

    // Simulate step-by-step execution
    const outputs: Record<string, any> = {}
    let stepsCompleted = 0

    // Topological execution (respecting depends_on)
    const completed = new Set<string>()
    const remaining = [...steps]

    while (remaining.length > 0) {
      const readyIdx = remaining.findIndex((step) =>
        step.depends_on.every((dep) => completed.has(dep))
      )

      if (readyIdx === -1) {
        return NextResponse.json({
          status: 'failed',
          error: 'Circular dependency detected in workflow',
          steps_completed: stepsCompleted,
          total_steps: steps.length,
          execution_time: (Date.now() - startTime) / 1000,
        })
      }

      const step = remaining.splice(readyIdx, 1)[0]

      let output: string
      let provider = 'simulated'

      try {
        // Resolve system prompt: custom agent uses its own, system agents use built-in
        const systemPrompt = step.system_prompt || SYSTEM_AGENT_PROMPTS[step.agent] || `You are a helpful AI assistant performing the role of "${step.agent_name || step.agent}".`
        const userMessage = buildUserMessage(step, outputs)

        const llmResult = await callLLM(systemPrompt, userMessage)
        output = llmResult.text
        provider = llmResult.provider
      } catch {
        // Fallback to simulated response
        output = getSimulatedOutput(step)
        provider = 'simulated'
      }

      outputs[step.id] = { output, status: 'completed', provider }
      completed.add(step.id)
      stepsCompleted++
    }

    const executionTime = (Date.now() - startTime) / 1000

    return NextResponse.json({
      status: 'completed',
      workflow_id: `wf_${Date.now().toString(36)}`,
      outputs,
      execution_time: executionTime,
      steps_completed: stepsCompleted,
      total_steps: steps.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'failed',
        error: error.message || 'Internal server error',
        execution_time: (Date.now() - startTime) / 1000,
      },
      { status: 500 }
    )
  }
}

