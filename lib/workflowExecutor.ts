// Client-side workflow executor (for GitHub Pages static export)

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
  workflow: { name: string; version: string; steps: WorkflowStep[] }
  inputs: Record<string, any>
  user_id: string
}

const SYSTEM_AGENT_PROMPTS: Record<string, string> = {
  generator: 'You are an expert code generator. Create clean, production-ready code.',
  reviewer: 'You are a senior code reviewer. Analyze code for quality and bugs.',
  tester: 'You are a test engineering expert. Generate comprehensive unit tests.',
  documenter: 'You are a technical documentation writer.',
  debugger: 'You are a debugging expert. Analyze errors and provide fixes.',
  security: 'You are a security analyst. Scan code for vulnerabilities.',
  refactor: 'You are a refactoring specialist. Optimize code structure.',
  devops: 'You are a DevOps engineer. Help with CI/CD and deployment.',
}

function getSimulatedOutput(step: WorkflowStep): string {
  if (step.agent_category === 'custom') {
    const task = step.inputs.task || step.inputs.description || 'the requested task'
    return '## ' + (step.agent_name || step.agent) + '\n\nCompleted (simulated). Processed: "' + task + '"\n\n> Run Ollama locally for real AI responses.'
  }
  const actionLabel = step.action_label || step.action
  return 'Step ' + step.id + ' (' + step.agent + '/' + actionLabel + ') completed (simulated).\n\n> Connect Ollama for real AI output.'
}

export async function executeWorkflowClientSide(payload: WorkflowPayload) {
  const start = Date.now()
  const steps = payload.workflow.steps
  if (!steps || steps.length === 0) return { status: 'failed', error: 'No steps in workflow' }

  const outputs: Record<string, any> = {}
  let done = 0
  const completed = new Set<string>()
  const remaining = [...steps]

  while (remaining.length > 0) {
    const idx = remaining.findIndex((s) => s.depends_on.every((d) => completed.has(d)))
    if (idx === -1) {
      return { status: 'failed', error: 'Circular dependency', steps_completed: done, total_steps: steps.length, execution_time: (Date.now() - start) / 1000 }
    }

    const step = remaining.splice(idx, 1)[0]
    let output: string
    let provider = 'simulated'

    try {
      const sys = step.system_prompt || SYSTEM_AGENT_PROMPTS[step.agent] || 'You are a helpful AI assistant.'
      const parts: string[] = ['Task: ' + (step.action_label || step.action)]
      for (const [k, v] of Object.entries(step.inputs || {})) {
        if (v) {
          let r = String(v)
          for (const [sid, sd] of Object.entries(outputs)) {
            r = r.replace('{{' + sid + '.output}}', (sd as any).output || '')
          }
          parts.push(k + ': ' + r)
        }
      }
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3.2', prompt: parts.join('\n\n'), system: sys, stream: false }),
        signal: AbortSignal.timeout(60000),
      })
      if (!res.ok) throw new Error('Ollama unavailable')
      output = (await res.json()).response || ''
      provider = 'ollama'
    } catch {
      output = getSimulatedOutput(step)
    }

    outputs[step.id] = { output, status: 'completed', provider }
    completed.add(step.id)
    done++
  }

  return {
    status: 'completed',
    workflow_id: 'wf_' + Date.now().toString(36),
    outputs,
    execution_time: (Date.now() - start) / 1000,
    steps_completed: done,
    total_steps: steps.length,
  }
}
