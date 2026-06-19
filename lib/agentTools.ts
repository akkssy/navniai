// NavniAI - Agent Tool System (ReAct Pattern)
// Tools that agents can invoke mid-reasoning via Thought→Action→Observation loop.
// The LLM outputs structured action calls; the executor runs them and feeds results back.

import { quickSearch, formatQuickSearchForLLM, type SearchResponse } from './webSearch'

// ─── Tool Definitions ───

export interface ToolDefinition {
  name: string
  description: string
  parameters: { name: string; type: string; description: string; required?: boolean }[]
}

export interface ToolCall {
  tool: string
  args: Record<string, any>
}

export interface ToolResult {
  tool: string
  success: boolean
  output: string
  durationMs: number
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for current information. Returns titles, URLs, and snippets from top results.',
    parameters: [
      { name: 'query', type: 'string', description: 'The search query', required: true },
    ],
  },
  rag_search: {
    name: 'rag_search',
    description: 'Search the user\'s uploaded knowledge base documents for relevant context. Uses semantic similarity.',
    parameters: [
      { name: 'query', type: 'string', description: 'What to search for in the knowledge base', required: true },
      { name: 'top_k', type: 'number', description: 'Number of results to return (default: 3)', required: false },
    ],
  },
  calculator: {
    name: 'calculator',
    description: 'Evaluate a mathematical expression. Supports basic arithmetic, percentages, and common functions.',
    parameters: [
      { name: 'expression', type: 'string', description: 'Math expression to evaluate, e.g. "100 * 1.15 / 3"', required: true },
    ],
  },
  json_extract: {
    name: 'json_extract',
    description: 'Parse and extract specific fields from JSON or structured text. Useful for processing upstream agent output.',
    parameters: [
      { name: 'text', type: 'string', description: 'The text/JSON to parse', required: true },
      { name: 'fields', type: 'string', description: 'Comma-separated field names to extract', required: true },
    ],
  },
  scratchpad: {
    name: 'scratchpad',
    description: 'Store or retrieve notes in the run\'s shared scratchpad. Use action "write" to save, "read" to retrieve.',
    parameters: [
      { name: 'action', type: 'string', description: '"write" or "read"', required: true },
      { name: 'key', type: 'string', description: 'The key to store/retrieve under', required: true },
      { name: 'value', type: 'string', description: 'The value to store (only for "write")', required: false },
    ],
  },
}

// ─── Tool Executors ───

export type Scratchpad = Map<string, string>

async function executeWebSearch(args: Record<string, any>): Promise<string> {
  const query = args.query
  if (!query) return 'Error: query is required'
  try {
    const result: SearchResponse = await quickSearch(query, 5)
    if (!result.results.length) return `No results found for "${query}"`
    return formatQuickSearchForLLM([result])
  } catch (err) {
    return `Search failed: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function executeRAGSearch(args: Record<string, any>): Promise<string> {
  const query = args.query
  if (!query) return 'Error: query is required'
  try {
    const res = await fetch('/api/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: args.top_k || 3 }),
    })
    const data = await res.json()
    if (!data.ok || !data.results?.length) return `No knowledge base results for "${query}"`
    return data.results
      .map((r: any) => `[${r.documentName} | ${(r.similarity * 100).toFixed(0)}% match]\n${r.content}`)
      .join('\n\n')
  } catch (err) {
    return `RAG search failed: ${err instanceof Error ? err.message : String(err)}`
  }
}

function executeCalculator(args: Record<string, any>): string {
  const expr = args.expression
  if (!expr) return 'Error: expression is required'
  try {
    // Safe math evaluation — only allows numbers, operators, parens, and Math functions
    const sanitized = expr.replace(/[^0-9+\-*/().,%\s]/g, '')
    if (!sanitized.trim()) return 'Error: invalid expression'
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)()
    return `Result: ${result}`
  } catch (err) {
    return `Calculation error: ${err instanceof Error ? err.message : String(err)}`
  }
}

function executeJsonExtract(args: Record<string, any>): string {
  const { text, fields } = args
  if (!text || !fields) return 'Error: text and fields are required'
  try {
    const obj = JSON.parse(text)
    const fieldList = fields.split(',').map((f: string) => f.trim())
    const extracted: Record<string, any> = {}
    for (const f of fieldList) {
      extracted[f] = obj[f] ?? '(not found)'
    }
    return JSON.stringify(extracted, null, 2)
  } catch {
    // Try extracting with regex patterns if not valid JSON
    const fieldList = fields.split(',').map((f: string) => f.trim())
    const results: string[] = []
    for (const f of fieldList) {
      const re = new RegExp(`${f}[:\\s]+(.+)`, 'i')
      const match = text.match(re)
      results.push(`${f}: ${match?.[1]?.trim() || '(not found)'}`)
    }
    return results.join('\n')
  }
}

function executeScratchpad(args: Record<string, any>, scratchpad: Scratchpad): string {
  const { action, key, value } = args
  if (!key) return 'Error: key is required'
  if (action === 'write') {
    scratchpad.set(key, value || '')
    return `Stored "${key}" in scratchpad`
  } else if (action === 'read') {
    const val = scratchpad.get(key)
    return val !== undefined ? val : `Key "${key}" not found in scratchpad`
  }
  return 'Error: action must be "write" or "read"'
}

// ─── Execute a Tool Call ───

export async function executeTool(call: ToolCall, scratchpad: Scratchpad): Promise<ToolResult> {
  const start = Date.now()
  let output: string

  switch (call.tool) {
    case 'web_search':
      output = await executeWebSearch(call.args)
      break
    case 'rag_search':
      output = await executeRAGSearch(call.args)
      break
    case 'calculator':
      output = executeCalculator(call.args)
      break
    case 'json_extract':
      output = executeJsonExtract(call.args)
      break
    case 'scratchpad':
      output = executeScratchpad(call.args, scratchpad)
      break
    default:
      output = `Unknown tool: ${call.tool}`
  }

  return {
    tool: call.tool,
    success: !output.startsWith('Error:'),
    output,
    durationMs: Date.now() - start,
  }
}

// ─── Parse Tool Calls from LLM Output ───
// The LLM is instructed to use this format:
// ACTION: tool_name({"param": "value"})
// Multiple actions per response are supported.

export function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = []
  const re = /ACTION:\s*([a-z_]+)\s*\(\s*(\{[\s\S]*?\})\s*\)/gi
  let match
  while ((match = re.exec(text)) !== null) {
    const tool = match[1].toLowerCase()
    if (TOOL_REGISTRY[tool]) {
      try {
        const args = JSON.parse(match[2])
        calls.push({ tool, args })
      } catch {
        // Try relaxed JSON parsing (single quotes, unquoted keys)
        try {
          const fixed = match[2].replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":')
          const args = JSON.parse(fixed)
          calls.push({ tool, args })
        } catch {
          // Skip malformed tool call
        }
      }
    }
  }
  return calls
}

// ─── Check if response contains FINAL ANSWER ───
export function hasFinalAnswer(text: string): boolean {
  return /FINAL\s*ANSWER\s*:/i.test(text)
}

export function extractFinalAnswer(text: string): string {
  const match = text.match(/FINAL\s*ANSWER\s*:([\s\S]*?)$/i)
  return match ? match[1].trim() : text
}

// ─── Build Tool System Prompt ───
// Appended to the agent's system prompt to enable ReAct behavior.

export function buildToolSystemPrompt(enabledTools: string[]): string {
  const tools = enabledTools
    .map(t => TOOL_REGISTRY[t])
    .filter(Boolean)

  if (tools.length === 0) return ''

  const toolDescs = tools.map(t => {
    const params = t.parameters
      .map(p => `  - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`)
      .join('\n')
    return `• ${t.name}: ${t.description}\n  Parameters:\n${params}`
  }).join('\n\n')

  return `

## Tool Use (ReAct Pattern)

You have access to the following tools:

${toolDescs}

### How to use tools:
1. Think about what you need → write your reasoning as "THOUGHT: ..."
2. If you need information, call a tool: ACTION: tool_name({"param": "value"})
3. Wait for the result — it will appear as "OBSERVATION: ..."
4. You can chain multiple tool calls across turns.
5. When you have enough information, write: FINAL ANSWER: <your complete response>

### Rules:
- You MUST use FINAL ANSWER: when you're ready to give your complete response.
- Only call tools when you actually need external information.
- If you don't need any tools, skip straight to FINAL ANSWER.
- Each ACTION must be on its own line.
- Tool arguments must be valid JSON.

### Example:
THOUGHT: I need to find current statistics about AI adoption.
ACTION: web_search({"query": "AI adoption statistics 2026"})
OBSERVATION: [results will appear here]
THOUGHT: Now I have the data I need.
FINAL ANSWER: Based on my research, AI adoption has reached...
`
}

// ─── Default tool sets per agent type ───
export const AGENT_DEFAULT_TOOLS: Record<string, string[]> = {
  researcher: ['web_search', 'rag_search', 'scratchpad'],
  writer: ['rag_search', 'scratchpad', 'json_extract'],
  editor: ['scratchpad'],
  seo_optimizer: ['web_search', 'calculator', 'scratchpad'],
  social_writer: ['web_search', 'scratchpad'],
  generator: ['rag_search', 'scratchpad'],
  reviewer: ['rag_search', 'scratchpad'],
  debugger: ['web_search', 'rag_search'],
  // ─── Viral Social Media Agents ───
  trend_scout: ['web_search', 'scratchpad'],
  hook_generator: ['scratchpad'],
  reel_scripter: ['scratchpad'],
  viral_scorer: ['scratchpad'],
  platform_adapter: ['scratchpad'],
  carousel_writer: ['scratchpad'],
}

/** Get the tools enabled for a given agent, with fallback */
export function getToolsForAgent(agentId: string): string[] {
  return AGENT_DEFAULT_TOOLS[agentId] || ['scratchpad']
}
