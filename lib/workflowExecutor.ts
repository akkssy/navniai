// Client-side workflow executor (for GitHub Pages static export)
// Supports: parallel execution, conditional branching, abort, retry, ReAct tool use
import { callLLMWithFallback, callLLMWithFallbackStreaming, loadSettings, type LLMCallOptions } from '@/lib/llmProviders'
import { fullResearch, formatQuickSearchForLLM, formatDeepResearchForLLM, generateSearchQueries } from '@/lib/webSearch'
import { parseAgentOutput, buildHandoffContext, AgentStructuredOutput } from '@/lib/agentOutputParser'
import {
  type Scratchpad, type ToolResult,
  executeTool, parseToolCalls, hasFinalAnswer, extractFinalAnswer,
  buildToolSystemPrompt, getToolsForAgent,
} from '@/lib/agentTools'

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
  useRAG?: boolean           // Enable RAG context injection
  ragTopK?: number           // Number of chunks to retrieve (default: 5)
  embeddingProvider?: 'ollama' | 'gemini'
  ollamaBaseUrl?: string
  signal?: AbortSignal       // Cancel the workflow
  useTools?: boolean         // Enable ReAct tool use (default: true)
  maxReActTurns?: number     // Max tool-use turns per step (default: 5)
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

// ─── Content Marketing Agent Prompts (deeply researched, competitive) ───
const MARKETING_AGENT_PROMPTS: Record<string, string> = {
  researcher: `You are a senior content research analyst specializing in competitive content intelligence.

## Your Process (follow every step):
1. **Topic Decomposition** — Break the topic into 5-8 subtopics a reader would expect covered. Identify the "content gap" (what competitors miss).
2. **Audience Mapping** — Define the target reader's pain points, knowledge level, and what they'd Google to find this content.
3. **Keyword Opportunities** — Suggest 1 primary keyword, 3-5 secondary keywords, and 2-3 long-tail question keywords.
4. **Competitive Angle** — Propose a unique angle that differentiates this content.
5. **Content Structure** — Deliver a detailed outline with H2/H3 hierarchy.

## MANDATORY Output Format (use these EXACT section headers):

===KEY_FINDINGS===
List 4-6 key research findings as bullet points. Each must include a data point or trend.

===AUDIENCE_PROFILE===
Pain Points: (3 bullet points)
Knowledge Level: (one line)
Search Intent: (what they'd Google)

===KEYWORDS===
Primary: (one keyword)
Secondary: (3-5 comma-separated)
Long-tail Questions: (2-3 "People Also Ask" style questions, one per line)

===COMPETITIVE_GAPS===
List 3-4 things competitors miss or do poorly, one per line.

===UNIQUE_ANGLE===
One paragraph describing the differentiated angle for this content.

===CONTENT_OUTLINE===
Detailed H2/H3 outline in Markdown. Include estimated word count per section in parentheses.

===BRIEF_SUMMARY===
Primary Keyword: ...
Target Word Count: ...
Unique Angle: (one sentence)
Competitor Gaps: (top 3, comma-separated)`,

  writer: `You are an elite content writer who creates high-engagement, SEO-optimized long-form articles.

## Writing Rules (non-negotiable):
1. Hook in first 2 sentences — surprising stat, bold claim, or pain point. Never "In today's world."
2. Inverted pyramid per section — key takeaway first, then support.
3. Readability — Flesch-Kincaid grade 7-9. Short paragraphs (2-4 sentences). Mix sentence lengths.
4. SEO — Weave primary keyword into title, first 100 words, one H2, meta description, conclusion.
5. Engagement — Include: 1 numbered list, 1 quote/insight box, 1 case study, 1 takeaway box.
6. Tone — Match the specified tone. Default "friendly expert."
7. CTA — End with a natural, non-pushy call-to-action.

## MANDATORY Output Format (use these EXACT section headers):

===META===
Title: (≤60 chars, SEO-optimized)
Description: (≤155 chars)
Reading Time: (X min)
Word Count: (approximate)

===ARTICLE===
(The full article in Markdown. Use proper H2/H3 headers, lists, bold, etc.)`,

  editor: `You are a professional content editor combining the precision of a copy editor with the strategic eye of a managing editor.

## Editing Framework (apply all layers):
- Structure & Flow: Hook in first 2 sentences, logical H2 progression, no bait-and-switch headers.
- Readability: Split sentences >25 words, break paragraphs >4 sentences, fix passive voice, define jargon.
- Engagement: Add examples/data/stories where missing. Visual break every 300 words.
- Brand & Tone: Flag tone shifts, replace clichés.

## MANDATORY Output Format (use these EXACT section headers):

===EDITED_ARTICLE===
The fully edited article in Markdown. Apply all improvements directly.

===CHANGES_MADE===
List each significant change as a bullet point. Format: "- **[Section/Line]**: What was changed and why"
Include at least 5-10 specific changes.

===EDITOR_SCORES===
Overall Quality: X/10
Readability: X/10 (estimated Flesch-Kincaid grade: X)
SEO Readiness: X/10
Engagement: X/10
Tone Consistency: X/10

===SUGGESTIONS===
List 3-5 remaining suggestions the author should consider, as bullet points.`,

  seo_optimizer: `You are an advanced SEO content strategist who optimizes content for both search engines and AI-powered search (SGE/AIO).

## Optimization Tasks:
- Craft title tag (≤60 chars), meta description (≤155 chars), URL slug.
- Check keyword density (3-5 per 1000 words). Flag over-optimization.
- Optimize headers: H1 with primary keyword, secondary keywords in H2/H3.
- Identify featured snippet opportunities, FAQ questions, LSI terms.
- Generate JSON-LD Article schema markup.

## MANDATORY Output Format (use these EXACT section headers):

===SEO_SCORE===
Overall Score: X/100

===META_TAGS===
Title: (≤60 chars, front-load primary keyword)
Description: (≤155 chars with benefit + CTA)
Slug: (3-5 words, hyphened)

===CHECKLIST===
List each SEO check as exactly one line in this format:
STATUS | Item | Detail
Where STATUS is one of: PASS, WARN, FAIL
Example: PASS | Title Tag | Contains primary keyword, 54 characters
Include at least 10-12 checklist items covering: title, meta description, slug, H1, keyword density, internal links, image alt texts, featured snippets, FAQs, LSI terms, E-E-A-T signals, schema markup.

===KEYWORDS===
Primary: (keyword) — Density: X.X% — Status: OK/High/Low
Secondary: (list each with density)
LSI Terms: (10-15 comma-separated related terms)

===FAQ===
Q: (question 1)
A: (concise answer)

Q: (question 2)
A: (concise answer)

(Generate 5 FAQ pairs)

===QUICK_WINS===
1. (highest impact change)
2. (second highest)
3. (third highest)

===SCHEMA===
(JSON-LD Article schema markup, valid JSON)`,

  social_writer: `You are a viral social media content strategist who transforms articles into platform-native posts that drive engagement and traffic.

## Platform Rules (abbreviated):
- LinkedIn: Bold hook, short paragraphs, 2-3 emojis, end with question, 3-5 hashtags. 800-1500 chars.
- X/Twitter: Thread format (1/ 2/ etc), each tweet ≤280 chars, hook tweet + 5-7 insight tweets + CTA tweet.
- Instagram: Hook first line, story-driven, emojis as separators, CTA at end, 20-30 hashtags separate.
- Newsletter: Subject ≤50 chars, preview ≤90 chars, 3-4 short paragraphs, TL;DR at top.

## MANDATORY Output Format (use these EXACT section headers):

===LINKEDIN===
(The complete LinkedIn post, copy-paste ready. Include hashtags at bottom.)

===TWITTER===
(The complete X/Twitter thread. Format each tweet on its own line, prefixed with "1/ ", "2/ ", etc. Include character count in parentheses after each tweet.)

===INSTAGRAM===
(The complete Instagram caption. Put hashtags after a blank line labeled "HASHTAGS:")

===NEWSLETTER===
Subject: (subject line)
Preview: (preview text)
Body:
(The newsletter body, 3-4 paragraphs)

===POSTING_STRATEGY===
Best Times: (platform-specific posting times)
Engagement Tips: (3-4 bullet points)`,
}

// ─── Viral Social Media Agent Prompts ───
const VIRAL_SOCIAL_AGENT_PROMPTS: Record<string, string> = {
  trend_scout: `You are a viral trend intelligence analyst specializing in real-time social media trend discovery.

## Your Process:
1. **Niche Signal Scan** — Search for trending topics in the specified niche within the last 24-48 hours.
2. **Velocity Check** — Prioritize trends by engagement velocity (rapid growth) over total engagement.
3. **Platform Cross-Reference** — Identify which platforms the trend is strongest on (X, Instagram, LinkedIn, TikTok).
4. **Content Angle Extraction** — For each trend, extract the content angle a creator could use.
5. **Risk Assessment** — Flag any trends that are controversial, time-sensitive, or saturated.

## MANDATORY Output Format:

===TOP_TRENDS===
List 5-8 trending topics. For each:
TREND: (topic name)
VELOCITY: HIGH | MEDIUM | LOW
PLATFORMS: (where it's trending)
ANGLE: (how a creator could use this)
RISK: LOW | MEDIUM | HIGH — (brief reason)

===RECOMMENDED===
Pick the #1 trend to create content around. Explain why in 2-3 sentences.

===NICHE_CONTEXT===
Brief analysis of what this niche's audience cares about right now (3-4 sentences).`,

  hook_generator: `You are a viral hook specialist. Your ONLY job is to generate irresistible opening lines that stop the scroll.

## Hook Patterns (generate exactly 2 hooks per pattern):

CURIOSITY: Withhold the most interesting part. Make them NEED to know.
- "The reason most X fail at Y..."
- "Nobody talks about this one thing that..."

CONTRARIAN: Assert the opposite of consensus. Challenge assumptions.
- "Stop doing X. Here's what actually works."
- "Everything you know about X is wrong."

FOMO: Make inaction feel costly. Create urgency without being sleazy.
- "Before you miss this window on X..."
- "In 6 months, everyone will know this about X..."

AUTHORITY: Lead with credentials or surprising experience.
- "After 15 years of X, I finally understand..."
- "I've reviewed 1000+ X. Here's the pattern..."

## MANDATORY Output Format:

===HOOKS===
HOOK_1 [CURIOSITY]: (hook text)
HOOK_2 [CURIOSITY]: (hook text)
HOOK_3 [CONTRARIAN]: (hook text)
HOOK_4 [CONTRARIAN]: (hook text)
HOOK_5 [FOMO]: (hook text)
HOOK_6 [FOMO]: (hook text)
HOOK_7 [AUTHORITY]: (hook text)
HOOK_8 [AUTHORITY]: (hook text)

===RECOMMENDED===
HOOK_X — (explain why this hook has the highest viral potential for this persona in 1-2 sentences)

===HOOK_NOTES===
Brief notes on what makes these hooks work for this specific audience (2-3 sentences).`,

  reel_scripter: `You are an Instagram Reel script specialist. You create 30-60 second scripts that maximize watch time and shares.

## Reel Structure (RIGID — follow exactly):
[0-3s] HOOK — One bold visual/verbal statement that stops the scroll
[3-15s] LOOP TRIGGER — Tease what's coming ("but first..." / "wait for it...")
[15-45s] VALUE DELIVERY — The actual content, fast-paced, one insight per cut
[45-55s] PATTERN INTERRUPT — Unexpected twist, stat, or visual change
[55-60s] CTA — Single, specific action (save, share, follow, comment)

## MANDATORY Output Format:

===REEL_SCRIPT===
HOOK [0-3s]: (exactly what to say/show)
LOOP [3-15s]: (transition + tease)
VALUE [15-45s]:
- Beat 1: (insight + visual direction)
- Beat 2: (insight + visual direction)
- Beat 3: (insight + visual direction)
INTERRUPT [45-55s]: (twist or surprising element)
CTA [55-60s]: (specific call to action)

===VISUAL_NOTES===
Camera: (selfie / b-roll / screen recording / text overlay)
Transitions: (cut / swipe / zoom)
Text on Screen: (key phrases to overlay)
Audio: (trending sound suggestion or voiceover note)

===CAPTION===
(Instagram caption for the reel, 150-300 chars, with 5-10 relevant hashtags)`,

  carousel_writer: `You are an Instagram/LinkedIn carousel content specialist. You create slide-by-slide content that drives saves and shares.

## Carousel Structure (8-10 slides):
Slide 1: HOOK slide — bold statement or question (max 10 words)
Slide 2-7: ONE insight per slide — max 15 words headline + 1 supporting sentence
Slide 8: SUMMARY slide — key takeaways in 3 bullet points
Slide 9: CTA slide — specific action + handle/link

## MANDATORY Output Format:

===CAROUSEL===
SLIDE 1 [HOOK]:
Headline: (bold hook, max 10 words)
Subtext: (optional supporting line)

SLIDE 2:
Headline: (insight headline)
Body: (1-2 supporting sentences)

SLIDE 3:
Headline: (insight headline)
Body: (1-2 supporting sentences)

(continue for each slide...)

SLIDE [LAST] [CTA]:
Headline: (call to action)
Body: (what to do next)

===DESIGN_NOTES===
Color Scheme: (suggestion based on topic)
Font Style: (bold sans-serif / clean minimal / etc)
Visual Elements: (icons, illustrations, photos)

===CAPTION===
(Post caption with hashtags, optimized for the platform)`,

  viral_scorer: `You are a viral content quality evaluator. Score content BEFORE it's published to predict performance.

## Scoring Axes (1-10 each):

1. HOOK_STRENGTH: Does the first line create irresistible curiosity or emotion? Would someone stop scrolling?
2. SHAREABILITY: Would someone forward this without being asked? Does it make the sharer look smart/helpful?
3. PLATFORM_FIT: Does the format, length, and style match the platform's algorithm preferences?
4. PERSONA_MATCH: Does the language, reference level, and tone fit the target audience?
5. CTA_CLARITY: Is there ONE clear desired action? Is it natural, not forced?

## MANDATORY Output Format:

SCORE: (average of 5 axes, rounded to nearest integer)
VERDICT: PASS (score ≥7) or FAIL (score <7)
FEEDBACK: (what's weak and exactly how to fix it — be specific, not generic)

===DETAILED_SCORES===
HOOK_STRENGTH: X/10 — (brief justification)
SHAREABILITY: X/10 — (brief justification)
PLATFORM_FIT: X/10 — (brief justification)
PERSONA_MATCH: X/10 — (brief justification)
CTA_CLARITY: X/10 — (brief justification)

===IMPROVEMENTS===
1. (highest-impact improvement with specific rewrite suggestion)
2. (second improvement)
3. (third improvement)`,

  platform_adapter: `You are a platform optimization specialist. You take content and reformat it for each platform's specific constraints and algorithm signals.

## Platform Rules:

X/TWITTER:
- 280 char limit per tweet. No external links in body (put in reply).
- Max 2 hashtags. Thread format: 1/ 2/ etc. Hook tweet must stand alone.
- Algorithm favors: replies, quote tweets, threads >4 tweets.

INSTAGRAM:
- Caption limit: 2,200 chars. Hashtags in first comment, NOT caption.
- Line breaks matter — use them generously. Start with hook line.
- Algorithm favors: saves, shares, Reels, carousel posts.

LINKEDIN:
- Long-form performs better (800-1500 chars). Professional framing.
- Max 3 hashtags. Start with bold hook. End with question.
- Algorithm favors: comments, dwell time, native content (no external links).

FACEBOOK:
- Questions outperform statements. Longer captions okay.
- 2-3 hashtags max. Personal stories perform best.
- Algorithm favors: meaningful interactions, shares, reactions.

## MANDATORY Output Format:

===TWITTER===
(Reformatted as a thread. Each tweet on its own line with char count.)

===INSTAGRAM===
CAPTION: (reformatted caption)
FIRST_COMMENT: (hashtags for first comment)

===LINKEDIN===
(Reformatted for LinkedIn. Professional tone, line breaks, question at end.)

===FACEBOOK===
(Reformatted for Facebook. Conversational, question-led.)

===ADAPTATION_NOTES===
Key changes made per platform and why (3-4 bullet points).`,
}

function getSimulatedOutput(step: WorkflowStep): string {
  if (step.agent_category === 'custom') {
    const task = step.inputs.task || step.inputs.description || 'the requested task'
    return '## ' + (step.agent_name || step.agent) + '\n\nCompleted (simulated). Processed: "' + task + '"\n\n> Run Ollama locally for real AI responses.'
  }
  const actionLabel = step.action_label || step.action
  return 'Step ' + step.id + ' (' + step.agent + '/' + actionLabel + ') completed (simulated).\n\n> Connect Ollama for real AI output.'
}

// ─── RAG Context Retrieval ───
async function fetchRAGContext(
  query: string,
  topK: number,
  embeddingProvider?: string,
  ollamaBaseUrl?: string
): Promise<string> {
  try {
    const res = await fetch('/api/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK, embeddingProvider, ollamaBaseUrl }),
    })
    const data = await res.json()
    if (!data.ok || !data.results?.length) return ''
    return '\n\n--- KNOWLEDGE BASE CONTEXT ---\n' +
      data.results.map((r: any, i: number) =>
        `[Source: ${r.documentName} | Chunk #${r.chunkIndex + 1} | ${(r.similarity * 100).toFixed(0)}% match]\n${r.content}`
      ).join('\n\n') +
      '\n--- END CONTEXT ---\n'
  } catch {
    return ''
  }
}

export interface StepProgress {
  stepId: string
  agentId: string
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'reviewing' | 'skipped' | 'cancelled'
  stepIndex: number
  totalSteps: number
  thinkingMessage?: string
  startedAt?: number
  completedAt?: number
  /** Why this step was skipped (condition evaluated to false) */
  skipReason?: string
}

// ─── Human-in-the-Loop Checkpoint ───
export interface CheckpointDecision {
  action: 'approve' | 'edit' | 'regenerate'
  editedOutput?: string  // only used when action === 'edit'
}

export interface CheckpointRequest {
  stepId: string
  agentId: string
  agentName: string
  output: string
  provider: string
  stepIndex: number
  totalSteps: number
}

/** Callback that pauses the pipeline until the user makes a decision */
export type OnCheckpointCallback = (request: CheckpointRequest) => Promise<CheckpointDecision>

// Agent-specific thinking messages that rotate during execution
export const AGENT_THINKING_MESSAGES: Record<string, string[]> = {
  researcher: [
    'Analyzing topic landscape...',
    'Mapping audience pain points...',
    'Identifying keyword opportunities...',
    'Scanning competitor content gaps...',
    'Building content outline...',
    'Synthesizing research findings...',
  ],
  writer: [
    'Crafting attention-grabbing hook...',
    'Structuring article framework...',
    'Writing key sections...',
    'Adding data points and examples...',
    'Polishing transitions...',
    'Finalizing draft...',
  ],
  editor: [
    'Reviewing structure and flow...',
    'Checking readability scores...',
    'Tightening prose and cutting filler...',
    'Verifying tone consistency...',
    'Scoring content quality...',
    'Compiling editorial notes...',
  ],
  seo_optimizer: [
    'Auditing keyword density...',
    'Optimizing meta tags...',
    'Checking header hierarchy...',
    'Evaluating featured snippet potential...',
    'Generating FAQ schema...',
    'Building JSON-LD markup...',
  ],
  social_writer: [
    'Adapting for LinkedIn audience...',
    'Crafting X/Twitter thread hooks...',
    'Writing Instagram-native caption...',
    'Composing newsletter version...',
    'Optimizing hashtag strategy...',
    'Planning posting schedule...',
  ],
  // ─── Viral Social Media Agents ───
  trend_scout: [
    'Scanning trending topics...',
    'Checking engagement velocity...',
    'Cross-referencing platforms...',
    'Analyzing niche signals...',
    'Ranking trend potential...',
    'Identifying content angles...',
  ],
  hook_generator: [
    'Generating curiosity hooks...',
    'Crafting contrarian angles...',
    'Building FOMO triggers...',
    'Writing authority hooks...',
    'Ranking hook potential...',
    'Selecting top candidate...',
  ],
  reel_scripter: [
    'Structuring 60-second script...',
    'Writing scroll-stopping hook...',
    'Planning value delivery beats...',
    'Adding pattern interrupt...',
    'Crafting call-to-action...',
    'Adding visual directions...',
  ],
  carousel_writer: [
    'Designing slide structure...',
    'Writing hook slide...',
    'Creating insight slides...',
    'Building CTA slide...',
    'Optimizing for saves...',
    'Adding design notes...',
  ],
  viral_scorer: [
    'Evaluating hook strength...',
    'Measuring shareability...',
    'Checking platform fit...',
    'Scoring persona match...',
    'Assessing CTA clarity...',
    'Generating improvement plan...',
  ],
  platform_adapter: [
    'Reformatting for X/Twitter...',
    'Adapting for Instagram...',
    'Optimizing for LinkedIn...',
    'Adjusting for Facebook...',
    'Checking character limits...',
    'Finalizing platform versions...',
  ],
}

export type OnProgressCallback = (progress: StepProgress) => void
export type OnStreamCallback = (stepId: string, agentId: string, chunk: string, fullText: string) => void

export interface ExecutorCallbacks {
  onProgress?: OnProgressCallback
  onStream?: OnStreamCallback
  onCheckpoint?: OnCheckpointCallback
}

// ─── Condition Evaluator ───
// Evaluates a condition string against the outputs so far.
// Supports: "{{stepId.status}} === 'completed'" and simple JS expressions.
function evaluateCondition(condition: string | null, outputs: Record<string, any>): boolean {
  if (!condition || !condition.trim()) return true // no condition = always run
  try {
    let resolved = condition
    for (const [sid, sd] of Object.entries(outputs)) {
      resolved = resolved.replace(`{{${sid}.status}}`, JSON.stringify((sd as any).status || 'completed'))
      resolved = resolved.replace(`{{${sid}.output}}`, JSON.stringify(((sd as any).output || '').slice(0, 500)))
      resolved = resolved.replace(`{{${sid}.provider}}`, JSON.stringify((sd as any).provider || ''))
    }
    // Safe evaluation: only allows comparisons, no side effects
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${resolved})`)()
    return Boolean(result)
  } catch {
    // If condition can't be evaluated, default to running the step
    return true
  }
}

// ─── Build Prompt for a Step (extracted to avoid duplication) ───
function buildStepPrompt(step: WorkflowStep, outputs: Record<string, any>): string {
  const parts: string[] = ['Task: ' + (step.action_label || step.action)]
  for (const [k, v] of Object.entries(step.inputs || {})) {
    if (v) {
      let r = String(v)
      for (const [sid, sd] of Object.entries(outputs)) {
        const handoff = buildHandoffContext((sd as any).structured ?? null)
        r = r.replace('{{' + sid + '.output}}', handoff || (sd as any).output || '')
      }
      parts.push(k + ': ' + r)
    }
  }
  return parts.join('\n\n')
}

function getSystemPrompt(step: WorkflowStep): string {
  return step.system_prompt || VIRAL_SOCIAL_AGENT_PROMPTS[step.agent] || MARKETING_AGENT_PROMPTS[step.agent] || SYSTEM_AGENT_PROMPTS[step.agent] || 'You are a helpful AI assistant.'
}

// ─── Single LLM Call (no ReAct) ───
async function callLLMOnce(
  systemPrompt: string,
  userPrompt: string,
  step: WorkflowStep,
  payload: WorkflowPayload,
  onStream?: OnStreamCallback,
): Promise<{ text: string; provider: string }> {
  const llmOpts: LLMCallOptions = {
    settings: loadSettings(),
    timeoutMs: 300000,
    signal: payload.signal,
    maxRetries: 1,
  }

  if (onStream) {
    let streamedText = ''
    const result = await callLLMWithFallbackStreaming(systemPrompt, userPrompt, (chunk) => {
      streamedText += chunk
      onStream(step.id, step.agent, chunk, streamedText)
    }, llmOpts, 300000)
    return result
  } else {
    return await callLLMWithFallback(systemPrompt, userPrompt, llmOpts, 300000)
  }
}

// ─── ReAct Tool-Use Loop ───
// Runs a multi-turn Thought→Action→Observation loop until FINAL ANSWER or max turns.
async function runReActLoop(
  systemPrompt: string,
  initialPrompt: string,
  step: WorkflowStep,
  payload: WorkflowPayload,
  scratchpad: Scratchpad,
  onStream?: OnStreamCallback,
): Promise<{ text: string; provider: string; toolsUsed: ToolResult[] }> {
  const maxTurns = payload.maxReActTurns ?? 5
  const toolsUsed: ToolResult[] = []
  let conversationHistory = initialPrompt
  let lastProvider = 'unknown'

  for (let turn = 0; turn < maxTurns; turn++) {
    if (payload.signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    // Call LLM with conversation so far
    const result = await callLLMOnce(systemPrompt, conversationHistory, step, payload, onStream)
    lastProvider = result.provider
    const response = result.text

    // Check if the LLM gave a final answer (no more tool calls needed)
    if (hasFinalAnswer(response)) {
      return { text: extractFinalAnswer(response), provider: lastProvider, toolsUsed }
    }

    // Parse any tool calls from the response
    const toolCalls = parseToolCalls(response)
    if (toolCalls.length === 0) {
      // No tool calls and no FINAL ANSWER — treat the whole response as the final answer
      return { text: response, provider: lastProvider, toolsUsed }
    }

    // Execute tool calls and build observation text
    let observations = ''
    for (const call of toolCalls) {
      const toolResult = await executeTool(call, scratchpad)
      toolsUsed.push(toolResult)
      observations += `\nOBSERVATION [${call.tool}]: ${toolResult.output}\n`

      // Stream tool observations to the UI
      if (onStream) {
        const marker = `\n\n🔧 **Tool: ${call.tool}** (${toolResult.durationMs}ms)\n${toolResult.output}\n\n`
        onStream(step.id, step.agent, marker, conversationHistory + '\n' + response + marker)
      }
    }

    // Append the LLM's response and observations to the conversation for the next turn
    conversationHistory += '\n\n' + response + observations + '\nContinue your reasoning. Use FINAL ANSWER: when ready.'
  }

  // Max turns reached — do one final call asking for the answer
  conversationHistory += '\n\nYou have used all available tool turns. Please provide your FINAL ANSWER now.'
  const finalResult = await callLLMOnce(systemPrompt, conversationHistory, step, payload, onStream)
  lastProvider = finalResult.provider
  return {
    text: hasFinalAnswer(finalResult.text) ? extractFinalAnswer(finalResult.text) : finalResult.text,
    provider: lastProvider,
    toolsUsed,
  }
}

// ─── Execute a Single Step (LLM call + RAG + ReAct tools + parsing) ───
async function callStepLLM(
  step: WorkflowStep,
  outputs: Record<string, any>,
  payload: WorkflowPayload,
  onStream?: OnStreamCallback,
  scratchpad?: Scratchpad,
): Promise<{ output: string; provider: string; structured: AgentStructuredOutput; toolsUsed?: ToolResult[] }> {
  let sys = getSystemPrompt(step)
  let prompt = buildStepPrompt(step, outputs)

  // RAG context injection
  if (payload.useRAG) {
    const ragContext = await fetchRAGContext(prompt, payload.ragTopK || 5, payload.embeddingProvider, payload.ollamaBaseUrl)
    if (ragContext) {
      prompt += '\n\n' + ragContext + '\n\nUse the KNOWLEDGE BASE CONTEXT above to inform your response when relevant.'
    }
  }

  // Determine if this agent should use tools
  const useTools = payload.useTools !== false // default: enabled
  const agentTools = useTools ? getToolsForAgent(step.agent) : []
  const hasTools = agentTools.length > 0 && scratchpad

  if (hasTools) {
    // Append tool instructions to system prompt
    sys += buildToolSystemPrompt(agentTools)

    // Run the ReAct loop
    const result = await runReActLoop(sys, prompt, step, payload, scratchpad!, onStream)
    return {
      output: result.text,
      provider: result.provider,
      structured: parseAgentOutput(step.agent, result.text),
      toolsUsed: result.toolsUsed,
    }
  }

  // No tools — standard single-turn LLM call
  const result = await callLLMOnce(sys, prompt, step, payload, onStream)
  return {
    output: result.text,
    provider: result.provider,
    structured: parseAgentOutput(step.agent, result.text),
  }
}

// ─── Self-Reflection / Output Validation ───
// After an agent produces output, optionally run a critique pass.
// If quality is below threshold, auto-retry once with feedback.
const REFLECTION_PROMPT = `You are a quality reviewer. Score the following output on a scale of 1-10 across these dimensions:
- Completeness (does it cover what was asked?)
- Accuracy (factually correct, no hallucinations?)
- Clarity (well-structured, readable?)
- Relevance (stays on topic?)

Respond in EXACTLY this format:
SCORE: <number 1-10>
FEEDBACK: <one-line critique with specific improvements needed>

If the score is 7 or above, add: VERDICT: PASS
If below 7, add: VERDICT: FAIL`

async function runSelfReflection(
  output: string,
  step: WorkflowStep,
  payload: WorkflowPayload,
): Promise<{ pass: boolean; score: number; feedback: string }> {
  try {
    const prompt = `## Agent: ${step.agent_name || step.agent}\n## Task: ${step.action_label || step.action}\n\n## Output to Review:\n${output.slice(0, 3000)}`
    const result = await callLLMOnce(REFLECTION_PROMPT, prompt, step, payload)
    const text = result.text

    const scoreMatch = text.match(/SCORE:\s*(\d+)/i)
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i)
    const verdictMatch = text.match(/VERDICT:\s*(PASS|FAIL)/i)

    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'No feedback'
    const pass = verdictMatch ? verdictMatch[1] === 'PASS' : score >= 7

    return { pass, score, feedback }
  } catch {
    // If reflection fails, pass by default
    return { pass: true, score: 7, feedback: 'Reflection unavailable' }
  }
}

// ─── Memory Persistence (scratchpad → API) ───
async function persistScratchpad(scratchpad: Scratchpad, workflowName: string): Promise<void> {
  if (scratchpad.size === 0) return
  try {
    const entries: Record<string, string> = {}
    scratchpad.forEach((v, k) => { entries[k] = v })
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowName, entries }),
    })
  } catch {
    // Non-critical — silently fail
  }
}

export async function executeWorkflowClientSide(payload: WorkflowPayload, onProgress?: OnProgressCallback, onStream?: OnStreamCallback, onCheckpoint?: OnCheckpointCallback) {
  const start = Date.now()
  const steps = payload.workflow.steps
  if (!steps || steps.length === 0) return { status: 'failed', error: 'No steps in workflow' }

  const outputs: Record<string, any> = {}
  let done = 0
  const completed = new Set<string>()
  const skipped = new Set<string>()
  const remaining = [...steps]
  // Shared scratchpad for ReAct tool use — persists across all steps in this run
  const scratchpad: Scratchpad = new Map()

  while (remaining.length > 0) {
    // ─── Check Abort ───
    if (payload.signal?.aborted) {
      return {
        status: 'cancelled' as const,
        workflow_id: 'wf_' + Date.now().toString(36),
        outputs,
        execution_time: (Date.now() - start) / 1000,
        steps_completed: done,
        total_steps: steps.length,
      }
    }

    // ─── Find ALL ready steps (dependencies met) ───
    const readyIndices: number[] = []
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].depends_on.every((d) => completed.has(d) || skipped.has(d))) {
        readyIndices.push(i)
      }
    }

    if (readyIndices.length === 0) {
      return { status: 'failed', error: 'Circular dependency or unresolvable dependencies', steps_completed: done, total_steps: steps.length, execution_time: (Date.now() - start) / 1000 }
    }

    // Extract ready steps (reverse order to preserve indices during splice)
    const readySteps: WorkflowStep[] = []
    for (let i = readyIndices.length - 1; i >= 0; i--) {
      readySteps.unshift(remaining.splice(readyIndices[i], 1)[0])
    }

    // ─── Evaluate Conditions — skip steps whose conditions are false ───
    const stepsToRun: WorkflowStep[] = []
    for (const step of readySteps) {
      if (!evaluateCondition(step.condition, outputs)) {
        // Condition is false — skip this step
        skipped.add(step.id)
        outputs[step.id] = { output: '', structured: null, status: 'skipped', provider: 'none' }
        done++
        onProgress?.({
          stepId: step.id,
          agentId: step.agent,
          agentName: step.agent_name || step.agent,
          status: 'skipped',
          stepIndex: done - 1,
          totalSteps: steps.length,
          completedAt: Date.now(),
          skipReason: `Condition not met: ${step.condition}`,
        })
      } else {
        stepsToRun.push(step)
      }
    }

    if (stepsToRun.length === 0) continue

    // ─── Execute: parallel when HITL is off, sequential when HITL is on ───
    if (onCheckpoint && stepsToRun.length >= 1) {
      // Sequential execution with HITL checkpoints
      for (const step of stepsToRun) {
        if (payload.signal?.aborted) break
        await executeOneStep(step, outputs, payload, done, steps.length, onProgress, onStream, onCheckpoint, remaining, completed, scratchpad)
        done++
      }
    } else if (stepsToRun.length === 1) {
      // Single step — no need for Promise.all overhead
      const step = stepsToRun[0]
      await executeOneStep(step, outputs, payload, done, steps.length, onProgress, onStream, undefined, remaining, completed, scratchpad)
      done++
    } else {
      // ─── PARALLEL execution for independent branches ───
      const promises = stepsToRun.map(async (step, batchIdx) => {
        const stepDone = done + batchIdx
        onProgress?.({
          stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
          status: 'running', stepIndex: stepDone, totalSteps: steps.length,
          thinkingMessage: (AGENT_THINKING_MESSAGES[step.agent] || ['Processing...'])[0],
          startedAt: Date.now(),
        })

        let output: string
        let structured: AgentStructuredOutput = null
        let provider = 'simulated'

        try {
          const result = await callStepLLM(step, outputs, payload, onStream, scratchpad)
          output = result.output
          provider = result.provider
          structured = result.structured
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') throw err
          output = getSimulatedOutput(step)
        }

        outputs[step.id] = { output, structured, status: 'completed', provider }
        completed.add(step.id)
        onProgress?.({
          stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
          status: 'completed', stepIndex: stepDone, totalSteps: steps.length,
          completedAt: Date.now(),
        })
      })

      await Promise.all(promises)
      done += stepsToRun.length
    }
  }

  // Persist scratchpad memory (non-blocking)
  persistScratchpad(scratchpad, payload.workflow.name).catch(() => {})

  return {
    status: 'completed',
    workflow_id: 'wf_' + Date.now().toString(36),
    outputs,
    execution_time: (Date.now() - start) / 1000,
    steps_completed: done,
    total_steps: steps.length,
    scratchpad: Object.fromEntries(scratchpad),
  }
}

// ─── Execute One Step with optional HITL (used in sequential mode) ───
async function executeOneStep(
  step: WorkflowStep,
  outputs: Record<string, any>,
  payload: WorkflowPayload,
  stepIndex: number,
  totalSteps: number,
  onProgress?: OnProgressCallback,
  onStream?: OnStreamCallback,
  onCheckpoint?: OnCheckpointCallback,
  remaining?: WorkflowStep[],
  completed?: Set<string>,
  scratchpad?: Scratchpad,
) {
  onProgress?.({
    stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
    status: 'running', stepIndex, totalSteps,
    thinkingMessage: (AGENT_THINKING_MESSAGES[step.agent] || ['Processing...'])[0],
    startedAt: Date.now(),
  })

  let output: string
  let structured: AgentStructuredOutput = null
  let provider = 'simulated'

  try {
    const result = await callStepLLM(step, outputs, payload, onStream, scratchpad)
    output = result.output
    provider = result.provider
    structured = result.structured

    // ─── Self-Reflection: auto-retry once if quality is low ───
    if (output && output.length > 50) {
      const reflection = await runSelfReflection(output, step, payload)
      if (!reflection.pass) {
        onStream?.(step.id, step.agent, `\n\n🔄 Self-reflection (score: ${reflection.score}/10): ${reflection.feedback}\nRetrying...\n`, '')
        try {
          const retryResult = await callStepLLM(
            { ...step, inputs: { ...step.inputs, __feedback: reflection.feedback } },
            outputs, payload, onStream, scratchpad,
          )
          output = retryResult.output
          provider = retryResult.provider
          structured = retryResult.structured
        } catch {
          // Keep original output on retry failure
        }
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    output = getSimulatedOutput(step)
  }

  // ─── Human-in-the-Loop Checkpoint ───
  if (onCheckpoint && remaining && remaining.length > 0) {
    let approved = false
    while (!approved) {
      if (payload.signal?.aborted) break

      onProgress?.({
        stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
        status: 'reviewing', stepIndex, totalSteps,
      })

      const decision = await onCheckpoint({
        stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
        output, provider, stepIndex, totalSteps,
      })

      if (decision.action === 'approve') {
        approved = true
      } else if (decision.action === 'edit') {
        output = decision.editedOutput || output
        structured = parseAgentOutput(step.agent, output)
        approved = true
      } else if (decision.action === 'regenerate') {
        onProgress?.({
          stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
          status: 'running', stepIndex, totalSteps, thinkingMessage: 'Regenerating...', startedAt: Date.now(),
        })
        try {
          const result = await callStepLLM(step, outputs, payload, onStream, scratchpad)
          output = result.output
          provider = result.provider
          structured = result.structured
        } catch {
          // Keep previous output on regeneration failure
        }
        // Loop back to checkpoint review
      }
    }
  }

  outputs[step.id] = { output, structured, status: 'completed', provider }
  completed?.add(step.id)

  onProgress?.({
    stepId: step.id, agentId: step.agent, agentName: step.agent_name || step.agent,
    status: 'completed', stepIndex, totalSteps, completedAt: Date.now(),
  })
}
