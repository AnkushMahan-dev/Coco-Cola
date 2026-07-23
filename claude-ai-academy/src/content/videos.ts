/**
 * Real, publicly available YouTube videos mapped to lessons.
 * Sourced via web search (July 2026); titles/channels as listed on YouTube.
 * Embeds use the privacy-enhanced youtube-nocookie.com domain.
 * To change a lesson's video, edit this one file.
 */

export interface LessonVideo {
  /** YouTube video id */
  id: string;
  title: string;
  channel: string;
}

const embed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

const videos: Record<string, LessonVideo> = {
  // Module 1 — Getting Started
  "claude-desktop": {
    id: "0vZ_UVLhSQQ",
    title: "Getting started with Claude.ai",
    channel: "Anthropic",
  },
  "claude-web": {
    id: "0vZ_UVLhSQQ",
    title: "Getting started with Claude.ai",
    channel: "Anthropic",
  },
  chat: {
    id: "-xEF5WrdIWs",
    title: "Claude Tutorial for Beginners — How to Use Claude AI Step by Step",
    channel: "YouTube",
  },
  "claude-code": {
    id: "AJpK3YTTKZ4",
    title: "Introducing Claude Code",
    channel: "Anthropic",
  },
  "claude-commands": {
    id: "6eBSHbLKuN0",
    title: "Mastering Claude Code in 30 minutes",
    channel: "Anthropic",
  },

  // Module 2 — Prompt Engineering
  "prompt-engineering": {
    id: "ysPbXH0LpIE",
    title: "Prompting 101 | Code w/ Claude",
    channel: "Anthropic",
  },
  "prompt-library": {
    id: "GJ5jTgcbRHA",
    title: "Getting started with projects in Claude.ai",
    channel: "Anthropic",
  },
  code: {
    id: "C2GpeepcmYs",
    title: "Claude Code Crash Course For Developers",
    channel: "Traversy Media",
  },

  // Module 3 — Advanced Capabilities
  cowork: {
    id: "UAmKyyZ-b9E",
    title: "Introducing Cowork: Claude Code for the rest of your work",
    channel: "Anthropic",
  },
  agent: {
    id: "eSP7PLTXNy8",
    title: "Build a proactive agent workflow with Claude Code",
    channel: "Claude (Anthropic)",
  },
  skills: {
    id: "mS5ojqQ7zzw",
    title: "Claude Skills: Build Your First AI Assistant",
    channel: "Teacher's Tech",
  },
  connectors: {
    id: "7j_NE6Pjv-E",
    title: "Model Context Protocol (MCP), clearly explained (why it matters)",
    channel: "YouTube",
  },
  "claude-tag": {
    id: "VojDzHaciKQ",
    title: "Tag Claude in, right where you already work",
    channel: "Claude (Anthropic)",
  },
  "claude-design": {
    id: "ii9MJCBHqjM",
    title: "Claude Design Tutorial for Beginners — Master 99% in under 20 min",
    channel: "Kate Hayes",
  },

  // Module 4 — Integrations & Extensions
  "mcp-servers": {
    id: "PLyCki2K0Lg",
    title: "Why we built — and donated — the Model Context Protocol (MCP)",
    channel: "Anthropic",
  },
  "github-integration": {
    id: "7pKN_pjPW04",
    title: "Claude Code Tutorial #9 — Claude Code with GitHub",
    channel: "Net Ninja",
  },
  "vscode-integration": {
    id: "SUysp3sJHbA",
    title: "Claude Code Tutorial #1 — Introduction & Setup",
    channel: "Net Ninja",
  },
  "chrome-extension": {
    id: "IypXvHej9eY",
    title: "Claude for Chrome brings AI where you're already working",
    channel: "Anthropic",
  },
  "excel-extension": {
    id: "22R3UKaTWKo",
    title: "How to Use Claude for Excel — Complete Beginner Guide",
    channel: "Teacher's Tech",
  },

  // Module 5 — SAP Toolchain
  "sap-gui": {
    id: "28TGfTZweqw",
    title: "How To Use Claude Better Than 99% Of People",
    channel: "Sandeep Swadia",
  },
  "eclipse-adt": {
    id: "LCi-TJleq70",
    title: "Eclipse for ABAP development | Set up Eclipse for your ABAP IDE",
    channel: "YouTube",
  },
  "sap-abap-mcp-server": {
    id: "RhTiAOGwbYE",
    title: "MCP Tutorial: Build Your First MCP Server and Client",
    channel: "YouTube",
  },
  "abap-adt-mcp-setup": {
    id: "PLyCki2K0Lg",
    title: "Why we built — and donated — the Model Context Protocol (MCP)",
    channel: "Anthropic",
  },

  // Module 6 — Best Practices & Governance
  "ai-coding-best-practices": {
    id: "tuY2ChJIx48",
    title: "Beyond the basics with Claude Code",
    channel: "Claude",
  },
  "security-guidelines": {
    id: "jrHRe9lSqqA",
    title: "What Is a Prompt Injection Attack?",
    channel: "IBM Technology",
  },
  troubleshooting: {
    id: "ntDIxaeo3Wg",
    title: "Claude Code — Full Tutorial for Beginners (install & setup)",
    channel: "YouTube",
  },

  // Module 7 — Real SAP Projects
  "real-sap-project-examples": {
    id: "IuyVVtr1uhY",
    title: "Claude Code Tutorial — Build Apps 10x Faster with AI",
    channel: "YouTube",
  },
  "s4hana-migration": {
    id: "O1dujBEeD1Q",
    title: "S/4HANA Readiness Check by ATC (ABAP Test Cockpit)",
    channel: "YouTube",
  },
  "atc-remediation": {
    id: "csxA5O4FlLY",
    title: "ABAP Test Cockpit (ATC) — Overview",
    channel: "SAP",
  },
  "cds-views": {
    id: "_846kzfcANc",
    title: "ABAP CDS Views — Introduction",
    channel: "YouTube",
  },
  "rap-development": {
    id: "iXYlD_xtQ68",
    title: "Introduction to ABAP RESTful Application Programming (RAP)",
    channel: "YouTube",
  },
  odata: {
    id: "kJP4h_PylHA",
    title: "Learn SAP Gateway | RESTful API | OData | ABAP — Full Course",
    channel: "Code With Brandon",
  },

  // Module 8 — Quality & Productivity
  "performance-optimization": {
    id: "xx_sm4alocc",
    title: "ABAP Performance Tuning (SELECTs in loops, internal tables)",
    channel: "YouTube",
  },
  "code-reviews": {
    id: "ApRygPY_bs4",
    title: "How to Review Code Using Claude Code",
    channel: "YouTube",
  },
  "documentation-generation": {
    id: "qOvc9IUKEIc",
    title: "How Anthropic Engineers ACTUALLY Prompt Claude Code",
    channel: "Austin Marchese",
  },
};

export function getLessonVideo(
  slug: string,
): (LessonVideo & { url: string }) | undefined {
  const v = videos[slug];
  return v ? { ...v, url: embed(v.id) } : undefined;
}
