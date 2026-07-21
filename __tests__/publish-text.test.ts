/**
 * Tests for the publish-text extraction logic used by the "Publish" bar.
 *
 * The WorkflowBuilder selects text like this:
 *   1. Use the platform_adapter node's output if present and non-empty.
 *   2. Fall back to concatenating ALL step outputs.
 * X post text is then truncated to 275 chars with "…" appended.
 *
 * We extract the logic into pure functions here so it can be tested
 * without mounting a React component.
 */

// ── pure helpers extracted from WorkflowBuilder ────────────────────────────

interface NodeOutput { output: string; status: string; provider?: string }
interface SimpleNode { id: string; data?: { agent?: { id?: string } } }

function getPublishText(
  nodes: SimpleNode[],
  executionOutputs: Record<string, NodeOutput>,
): string {
  const padNode = nodes.find(n => n.data?.agent?.id === 'platform_adapter')
  const padOut = padNode ? executionOutputs[padNode.id]?.output : ''
  return (padOut && padOut.trim())
    ? padOut.trim()
    : Object.values(executionOutputs).map(r => r.output).join('\n\n').trim()
}

function getXPostText(fullText: string): string {
  return fullText.length > 275 ? fullText.slice(0, 272) + '…' : fullText
}

// ── tests ───────────────────────────────────────────────────────────────────

const PA_NODE: SimpleNode = { id: 'pa-1', data: { agent: { id: 'platform_adapter' } } }
const OTHER_NODE: SimpleNode = { id: 'step-1', data: { agent: { id: 'hook_generator' } } }

describe('getPublishText — platform_adapter priority', () => {
  it('returns platform_adapter output when present', () => {
    const outputs: Record<string, NodeOutput> = {
      'step-1': { output: 'hook output', status: 'completed' },
      'pa-1':   { output: 'platform post text', status: 'completed' },
    }
    expect(getPublishText([OTHER_NODE, PA_NODE], outputs)).toBe('platform post text')
  })

  it('falls back to concatenated outputs when platform_adapter is absent', () => {
    const outputs: Record<string, NodeOutput> = {
      'step-1': { output: 'first', status: 'completed' },
      'step-2': { output: 'second', status: 'completed' },
    }
    const nodes: SimpleNode[] = [OTHER_NODE, { id: 'step-2' }]
    const result = getPublishText(nodes, outputs)
    expect(result).toBe('first\n\nsecond')
  })

  it('falls back when platform_adapter output is blank/whitespace', () => {
    const outputs: Record<string, NodeOutput> = {
      'pa-1':   { output: '   ', status: 'completed' },
      'step-1': { output: 'fallback text', status: 'completed' },
    }
    expect(getPublishText([PA_NODE, OTHER_NODE], outputs)).toBe('fallback text')
  })

  it('returns empty string when all outputs are empty', () => {
    const outputs: Record<string, NodeOutput> = {
      'step-1': { output: '', status: 'completed' },
    }
    expect(getPublishText([OTHER_NODE], outputs)).toBe('')
  })
})

describe('getXPostText — truncation', () => {
  it('leaves text unchanged when <= 275 chars', () => {
    const text = 'A'.repeat(275)
    expect(getXPostText(text)).toBe(text)
    expect(getXPostText(text).length).toBe(275)
  })

  it('truncates to 272 chars and appends "…" when > 275 chars', () => {
    const text = 'B'.repeat(300)
    const result = getXPostText(text)
    expect(result.length).toBe(273) // 272 + 1 for the ellipsis character
    expect(result.endsWith('…')).toBe(true)
  })

  it('handles exact 276-char input', () => {
    const text = 'C'.repeat(276)
    const result = getXPostText(text)
    expect(result.length).toBe(273)
    expect(result.endsWith('…')).toBe(true)
  })

  it('preserves short text verbatim', () => {
    const text = 'Hello world!'
    expect(getXPostText(text)).toBe('Hello world!')
  })
})

describe('getPublishText + getXPostText integration', () => {
  it('pipeline: selects PA output then truncates for X', () => {
    const longOutput = 'Z'.repeat(300)
    const outputs: Record<string, NodeOutput> = {
      'pa-1': { output: longOutput, status: 'completed' },
    }
    const full = getPublishText([PA_NODE], outputs)
    const xText = getXPostText(full)
    expect(full.length).toBe(300)
    expect(xText.length).toBe(273)
    expect(xText.endsWith('…')).toBe(true)
  })
})
