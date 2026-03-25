# NavniAI

**Visual AI Agent Orchestration Platform**

NavniAI lets you build, connect, and run multi-agent AI workflows visually. Create agents for any domain and orchestrate them on an interactive canvas.

## Features

- **Visual Workflow Builder** - Drag-and-drop agents onto a React Flow canvas
- **Domain-Agnostic Agents** - Create custom agents for any role with system prompts
- **8 Built-in Coding Agents** - Generator, Reviewer, Tester, Documenter, Debugger, Security, Refactor, DevOps
- **10 Template Agents** - Pre-built agents for HR, Legal, Marketing, Finance, Education, Support, Data
- **Real LLM Integration** - Ollama (local) and OpenAI (cloud) with automatic fallback
- **Persistent Custom Agents** - Agents survive page refreshes via localStorage
- **Topological Execution** - Steps run in dependency order with context passing

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 and navigate to the Workflow Builder.

## LLM Configuration

Edit `.env.local`:

```bash
LLM_PROVIDER=auto
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Canvas**: React Flow
- **Language**: TypeScript

## Project Structure

```
navniai/
  app/                    - Next.js pages and API routes
    api/workflow/          - Workflow execution API
    dashboard/            - Dashboard page
    workflow/builder/     - Visual workflow builder
    page.tsx              - Landing page
  components/             - React components
    WorkflowBuilder.tsx   - Main canvas + execution
    AgentPalette.tsx      - Agent list + templates
    AgentNode.tsx         - Canvas node rendering
    NodeConfigPanel.tsx   - Agent configuration panel
  .env.example            - Environment template
  package.json
  README.md
```

## License

MIT
