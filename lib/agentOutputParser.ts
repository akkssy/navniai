// NavniAI - Agent Output Parser
// Parses ===SECTION=== delimited agent text into typed JSON for structured inter-agent handoffs

// ─── Per-Agent Output Types ───

export interface ResearcherOutput {
  key_findings: string[]
  audience: { pain_points: string[]; knowledge_level: string; search_intent: string }
  keywords: { primary: string; secondary: string[]; long_tail: string[] }
  competitive_gaps: string[]
  unique_angle: string
  content_outline: string
  brief: { primary_keyword: string; target_word_count: string; unique_angle: string; competitor_gaps: string[] }
}

export interface WriterOutput {
  meta: { title: string; description: string; reading_time: string; word_count: string }
  article: string
}

export interface EditorOutput {
  edited_article: string
  changes_made: string[]
  scores: { overall: number; readability: number; seo: number; engagement: number; tone: number }
  suggestions: string[]
}

export interface SeoOutput {
  seo_score: number
  meta_tags: { title: string; description: string; slug: string }
  checklist: { status: 'PASS' | 'WARN' | 'FAIL'; item: string; detail: string }[]
  keywords: { primary: string; secondary: string[]; lsi_terms: string[] }
  faq: { question: string; answer: string }[]
  quick_wins: string[]
  schema: string
}

export interface SocialOutput {
  linkedin: string
  twitter: string
  instagram: string
  newsletter: { subject: string; preview: string; body: string }
  posting_strategy: string
}

export type AgentStructuredOutput =
  | { type: 'researcher'; data: ResearcherOutput }
  | { type: 'writer'; data: WriterOutput }
  | { type: 'editor'; data: EditorOutput }
  | { type: 'seo_optimizer'; data: SeoOutput }
  | { type: 'social_writer'; data: SocialOutput }
  | null

// ─── Helpers ───

function extractSection(text: string, name: string): string {
  const re = new RegExp(`===\\s*${name}\\s*===([\\s\\S]*?)(?====\\s*[A-Z_]+\\s*===|$)`, 'i')
  return text.match(re)?.[1]?.trim() ?? ''
}

function bulletLines(text: string): string[] {
  return text.split('\n').map(l => l.replace(/^[\d.)\-*•]\s*/, '').trim()).filter(Boolean)
}

// ─── Per-Agent Parsers ───

function parseResearcher(raw: string): ResearcherOutput {
  const brief_raw = extractSection(raw, 'BRIEF_SUMMARY')
  const audience_raw = extractSection(raw, 'AUDIENCE_PROFILE')
  const keywords_raw = extractSection(raw, 'KEYWORDS')
  const pain_raw = audience_raw.match(/Pain Points:([\s\S]*?)(?=Knowledge Level:|Search Intent:|$)/i)?.[1] ?? ''
  const longtail_raw = keywords_raw.match(/Long-tail Questions:([\s\S]*?)$/i)?.[1] ?? ''
  return {
    key_findings: bulletLines(extractSection(raw, 'KEY_FINDINGS')),
    audience: {
      pain_points: bulletLines(pain_raw),
      knowledge_level: audience_raw.match(/Knowledge Level:\s*(.+)/i)?.[1]?.trim() ?? '',
      search_intent: audience_raw.match(/Search Intent:\s*(.+)/i)?.[1]?.trim() ?? '',
    },
    keywords: {
      primary: keywords_raw.match(/Primary:\s*(.+)/i)?.[1]?.trim() ?? '',
      secondary: (keywords_raw.match(/Secondary:\s*(.+)/i)?.[1]?.trim() ?? '').split(',').map(s => s.trim()).filter(Boolean),
      long_tail: bulletLines(longtail_raw),
    },
    competitive_gaps: bulletLines(extractSection(raw, 'COMPETITIVE_GAPS')),
    unique_angle: extractSection(raw, 'UNIQUE_ANGLE'),
    content_outline: extractSection(raw, 'CONTENT_OUTLINE'),
    brief: {
      primary_keyword: brief_raw.match(/Primary Keyword:\s*(.+)/i)?.[1]?.trim() ?? '',
      target_word_count: brief_raw.match(/Target Word Count:\s*(.+)/i)?.[1]?.trim() ?? '',
      unique_angle: brief_raw.match(/Unique Angle:\s*(.+)/i)?.[1]?.trim() ?? '',
      competitor_gaps: (brief_raw.match(/Competitor Gaps:\s*(.+)/i)?.[1]?.trim() ?? '').split(',').map(s => s.trim()).filter(Boolean),
    },
  }
}

function parseWriter(raw: string): WriterOutput {
  const meta_raw = extractSection(raw, 'META')
  return {
    meta: {
      title: meta_raw.match(/Title:\s*(.+)/i)?.[1]?.trim() ?? '',
      description: meta_raw.match(/Description:\s*(.+)/i)?.[1]?.trim() ?? '',
      reading_time: meta_raw.match(/Reading Time:\s*(.+)/i)?.[1]?.trim() ?? '',
      word_count: meta_raw.match(/Word Count:\s*(.+)/i)?.[1]?.trim() ?? '',
    },
    article: extractSection(raw, 'ARTICLE'),
  }
}

function parseEditor(raw: string): EditorOutput {
  const scores_raw = extractSection(raw, 'EDITOR_SCORES')
  const score = (key: string) => parseInt(scores_raw.match(new RegExp(`${key}:\\s*(\\d+)`, 'i'))?.[1] ?? '0', 10)
  return {
    edited_article: extractSection(raw, 'EDITED_ARTICLE'),
    changes_made: bulletLines(extractSection(raw, 'CHANGES_MADE')),
    scores: {
      overall: score('Overall Quality'),
      readability: score('Readability'),
      seo: score('SEO Readiness'),
      engagement: score('Engagement'),
      tone: score('Tone Consistency'),
    },
    suggestions: bulletLines(extractSection(raw, 'SUGGESTIONS')),
  }
}

function parseSeo(raw: string): SeoOutput {
  const meta_raw = extractSection(raw, 'META_TAGS')
  const kw_raw = extractSection(raw, 'KEYWORDS')
  const faq_raw = extractSection(raw, 'FAQ')
  const checklist = extractSection(raw, 'CHECKLIST').split('\n').filter(Boolean).map(line => {
    const [status = 'PASS', item = '', detail = ''] = line.split('|').map(p => p.trim())
    return { status: status as 'PASS' | 'WARN' | 'FAIL', item, detail }
  })
  const faq = [...faq_raw.matchAll(/Q:\s*(.+)\nA:\s*(.+)/g)].map(m => ({ question: m[1].trim(), answer: m[2].trim() }))
  return {
    seo_score: parseInt(extractSection(raw, 'SEO_SCORE').match(/Overall Score:\s*(\d+)/i)?.[1] ?? '0', 10),
    meta_tags: {
      title: meta_raw.match(/Title:\s*(.+)/i)?.[1]?.trim() ?? '',
      description: meta_raw.match(/Description:\s*(.+)/i)?.[1]?.trim() ?? '',
      slug: meta_raw.match(/Slug:\s*(.+)/i)?.[1]?.trim() ?? '',
    },
    checklist,
    keywords: {
      primary: kw_raw.match(/Primary:\s*(.+)/i)?.[1]?.trim() ?? '',
      secondary: (kw_raw.match(/Secondary:([\s\S]+?)(?=LSI Terms:|$)/i)?.[1] ?? '').split('\n').map(s => s.trim()).filter(Boolean),
      lsi_terms: (kw_raw.match(/LSI Terms:\s*(.+)/i)?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean),
    },
    faq,
    quick_wins: bulletLines(extractSection(raw, 'QUICK_WINS')),
    schema: extractSection(raw, 'SCHEMA'),
  }
}

function parseSocial(raw: string): SocialOutput {
  const nl_raw = extractSection(raw, 'NEWSLETTER')
  return {
    linkedin: extractSection(raw, 'LINKEDIN'),
    twitter: extractSection(raw, 'TWITTER'),
    instagram: extractSection(raw, 'INSTAGRAM'),
    newsletter: {
      subject: nl_raw.match(/Subject:\s*(.+)/i)?.[1]?.trim() ?? '',
      preview: nl_raw.match(/Preview:\s*(.+)/i)?.[1]?.trim() ?? '',
      body: nl_raw.match(/Body:\s*([\s\S]+)/i)?.[1]?.trim() ?? '',
    },
    posting_strategy: extractSection(raw, 'POSTING_STRATEGY'),
  }
}

// ─── Public Parse API ───

const PARSERS: Record<string, (raw: string) => any> = {
  researcher: parseResearcher,
  writer: parseWriter,
  editor: parseEditor,
  seo_optimizer: parseSeo,
  social_writer: parseSocial,
}

export function parseAgentOutput(agentId: string, raw: string): AgentStructuredOutput {
  const parser = PARSERS[agentId]
  if (!parser) return null
  try {
    return { type: agentId as any, data: parser(raw) }
  } catch {
    return null
  }
}

// ─── Structured Handoff Context Builder ───
// Converts structured output into a concise, typed prompt context for downstream agents.
// Replaces raw {{stepId.output}} blobs with focused, field-level context.

export function buildHandoffContext(structured: AgentStructuredOutput): string {
  if (!structured) return ''

  switch (structured.type) {
    case 'researcher': {
      const d = structured.data
      const lines = ['## Research Handoff']
      if (d.brief.primary_keyword) lines.push(`**Primary Keyword:** ${d.brief.primary_keyword}`)
      if (d.brief.unique_angle) lines.push(`**Unique Angle:** ${d.brief.unique_angle}`)
      if (d.brief.target_word_count) lines.push(`**Target Word Count:** ${d.brief.target_word_count}`)
      if (d.key_findings.length) lines.push(`\n**Key Findings:**\n${d.key_findings.map(f => `- ${f}`).join('\n')}`)
      if (d.keywords.secondary.length) lines.push(`\n**Secondary Keywords:** ${d.keywords.secondary.join(', ')}`)
      if (d.keywords.long_tail.length) lines.push(`\n**Long-tail Questions:**\n${d.keywords.long_tail.map(q => `- ${q}`).join('\n')}`)
      if (d.competitive_gaps.length) lines.push(`\n**Gaps to Cover:**\n${d.competitive_gaps.map(g => `- ${g}`).join('\n')}`)
      if (d.audience.pain_points.length) lines.push(`\n**Audience Pain Points:**\n${d.audience.pain_points.map(p => `- ${p}`).join('\n')}`)
      if (d.content_outline) lines.push(`\n**Content Outline:**\n${d.content_outline}`)
      return lines.join('\n')
    }
    case 'writer': {
      const d = structured.data
      const lines = ['## Writer Handoff']
      if (d.meta.title) lines.push(`**Title:** ${d.meta.title}`)
      if (d.meta.description) lines.push(`**Meta Description:** ${d.meta.description}`)
      if (d.meta.word_count) lines.push(`**Word Count:** ${d.meta.word_count}`)
      if (d.article) lines.push(`\n${d.article}`)
      return lines.join('\n')
    }
    case 'editor': {
      const d = structured.data
      const lines = ['## Editor Handoff']
      if (d.scores.overall) lines.push(`**Quality Score:** ${d.scores.overall}/10 | SEO: ${d.scores.seo}/10 | Readability: ${d.scores.readability}/10`)
      if (d.edited_article) lines.push(`\n${d.edited_article}`)
      return lines.join('\n')
    }
    case 'seo_optimizer': {
      const d = structured.data
      const lines = ['## SEO Handoff']
      if (d.seo_score) lines.push(`**SEO Score:** ${d.seo_score}/100`)
      if (d.meta_tags.title) lines.push(`**Optimized Title:** ${d.meta_tags.title}`)
      if (d.meta_tags.description) lines.push(`**Meta Description:** ${d.meta_tags.description}`)
      if (d.quick_wins.length) lines.push(`\n**Quick Wins:**\n${d.quick_wins.map(w => `- ${w}`).join('\n')}`)
      return lines.join('\n')
    }
    default:
      return ''
  }
}
