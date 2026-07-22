# Claude AI Academy for SAP Developers

A production-quality training portal and reference guide that teaches SAP ABAP
developers, technical leads and solution architects how to use Claude AI in
their daily work — with real SAP scenarios (S/4HANA migration, ATC
remediation, CDS views, RAP, OData) and Windows-first guidance.

## Tech stack

- **React 19** + **Vite** + **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**-style component system (Radix primitives)
- **Framer Motion** animations, **Lucide** icons
- **react-router** (hash routing — works from any static host or file share)
- **cmdk** command-palette global search

## Features

- 🔍 Global search (Ctrl+K) across all lessons, keywords and objectives
- 📚 Collapsible left navigation with per-module completion counts
- 🧭 Breadcrumb navigation on every page
- 🌙 Dark / light / system theme (persisted, no flash on load)
- 📱 Fully responsive (mobile drawer navigation)
- 📊 Learning dashboard with progress tracking and quiz scores (localStorage)
- 💬 Interactive code blocks with one-click copy
- 🧪 Practice exercises with collapsible solutions
- ❓ Interactive quizzes with instant feedback and saved best scores
- 💾 Downloadable prompt packs and checklists (per lesson + bundle)
- 📄 Printable PDF guides (print stylesheet — Ctrl+P → Save as PDF)
- 🎥 Video placeholders ready for real embeds (set `video.url`)
- 🖼️ Screenshot placeholders with accessibility descriptions

## Curriculum

8 modules · 32 lessons covering: Claude Desktop, Claude Web, Chat, Claude
Code, Claude Commands, Prompt Engineering, Prompt Library, Working with Code,
Cowork, Agents, Skills, Connectors, MCP Servers, GitHub/VS Code/Chrome/Excel
integrations, SAP GUI, Eclipse ADT, SAP ABAP MCP Server, AI Coding Best
Practices, Security Guidelines, Troubleshooting, Real SAP Project Examples,
S/4HANA Migration, ATC Remediation, CDS Views, RAP Development, OData,
Performance Optimization, Code Reviews and Documentation Generation.

Every lesson contains: Overview · Learning Objectives · Step-by-Step
Instructions · Screenshots · Video · Real SAP Example · Best Practices ·
Common Mistakes · Tips · Practice Exercise · Quiz · Summary · Download ·
Related Topics · Next Lesson.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build
```

## Adding a lesson

Content is fully data-driven. Add a `Lesson` object to a module file in
`src/content/modules/` (see `src/content/types.ts` for the schema) — the
sidebar, search index, dashboard, downloads page and lesson renderer pick it
up automatically. No component changes required.

## Project structure

```
src/
  components/
    layout/     AppShell, Header, Sidebar, Breadcrumbs
    lesson/     CodeBlock, Callout, Quiz, MediaPlaceholders
    search/     CommandPalette (Ctrl+K)
    ui/         shadcn/ui-style primitives
  content/
    types.ts    Content model (Lesson, Module, Quiz, ...)
    curriculum.ts  Module registry + lesson lookup/next/prev
    modules/    module-1 ... module-8 lesson data
  lib/          theme, progress store, search, utils
  pages/        Home, Dashboard, Module, Lesson, Downloads, 404
```
