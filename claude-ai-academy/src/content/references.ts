/**
 * Authoritative "further reading" links per lesson.
 * Every URL here was fetched and confirmed live (July 2026). Sources:
 *   - Claude Code docs      https://code.claude.com/docs
 *   - Claude Platform docs  https://platform.claude.com/docs
 *   - Model Context Protocol https://modelcontextprotocol.io
 *   - SAP Help Portal        https://help.sap.com
 *   - SAP open-source        github.com/SAP, github.com/SAP-samples, docs.abapgit.org
 * To change a lesson's references, edit this one file — the lesson page
 * renders whatever is mapped by slug.
 */

export type ReferenceSource =
  | "Claude Docs"
  | "Claude Platform"
  | "Anthropic"
  | "MCP"
  | "SAP"
  | "abapGit"
  | "GitHub";

export interface Reference {
  label: string;
  url: string;
  source: ReferenceSource;
  /** Optional one-line note on why it's relevant */
  note?: string;
}

// Reusable canonical links -------------------------------------------------
const CC = "https://code.claude.com/docs/en";
const PLAT = "https://platform.claude.com/docs/en";

const cleanAbap: Reference = {
  label: "Clean ABAP style guide (SAP)",
  url: "https://github.com/SAP/styleguides/blob/main/clean-abap/CleanABAP.md",
  source: "GitHub",
  note: "SAP's official clean-code guidelines — give these to Claude as context.",
};
const abapCheatSheets: Reference = {
  label: "SAP ABAP Cheat Sheets (SAP-samples)",
  url: "https://github.com/SAP-samples/abap-cheat-sheets",
  source: "GitHub",
  note: "Executable examples for CDS, SQL, internal tables, RAP and more.",
};
const abapCodeReview: Reference = {
  label: "ABAP Code Review guidelines (SAP)",
  url: "https://github.com/SAP/styleguides/blob/main/abap-code-review/ABAPCodeReview.md",
  source: "GitHub",
};
const abapGit: Reference = {
  label: "abapGit documentation",
  url: "https://docs.abapgit.org/",
  source: "abapGit",
  note: "The bridge that turns ABAP packages into git repos Claude can work on.",
};
const mcpIntro: Reference = {
  label: "Model Context Protocol — Introduction",
  url: "https://modelcontextprotocol.io/introduction",
  source: "MCP",
};
const rapHelp: Reference = {
  label: "ABAP RESTful Application Programming Model (SAP Help)",
  url: "https://help.sap.com/docs/abap-cloud/abap-rap/abap-restful-application-programming-model",
  source: "SAP",
};

const references: Record<string, Reference[]> = {
  // Module 1 — Getting Started
  "claude-desktop": [
    { label: "Claude Desktop overview", url: `${CC}/desktop`, source: "Claude Docs" },
    { label: "Desktop quickstart", url: `${CC}/desktop-quickstart`, source: "Claude Docs" },
    { label: "Claude Code — Overview", url: `${CC}/overview`, source: "Claude Docs" },
  ],
  "claude-web": [
    { label: "Claude Code on the web — quickstart", url: `${CC}/web-quickstart`, source: "Claude Docs" },
    { label: "Claude Code on the web", url: `${CC}/claude-code-on-the-web`, source: "Claude Docs" },
    { label: "Features overview", url: `${CC}/features-overview`, source: "Claude Docs" },
  ],
  chat: [
    { label: "Prompt engineering — Overview", url: `${PLAT}/build-with-claude/prompt-engineering/overview`, source: "Claude Platform" },
    { label: "Prompt library", url: `${CC}/prompt-library`, source: "Claude Docs" },
    { label: "Best practices", url: `${CC}/best-practices`, source: "Claude Docs" },
  ],
  "claude-code": [
    { label: "Claude Code — official product page", url: "https://claude.com/product/claude-code", source: "Anthropic" },
    { label: "Claude Code — Overview", url: `${CC}/overview`, source: "Claude Docs" },
    { label: "Claude Code — Quickstart", url: `${CC}/quickstart`, source: "Claude Docs" },
    { label: "CLI reference", url: `${CC}/cli-reference`, source: "Claude Docs" },
    abapGit,
  ],
  "claude-commands": [
    { label: "CLI reference", url: `${CC}/cli-reference`, source: "Claude Docs" },
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    { label: "Memory (CLAUDE.md)", url: `${CC}/memory`, source: "Claude Docs" },
    { label: "Settings", url: `${CC}/settings`, source: "Claude Docs" },
  ],

  // Module 2 — Prompt Engineering
  "prompt-engineering": [
    { label: "Prompt engineering — Overview", url: `${PLAT}/build-with-claude/prompt-engineering/overview`, source: "Claude Platform" },
    { label: "Claude prompting best practices", url: `${PLAT}/build-with-claude/prompt-engineering/claude-prompting-best-practices`, source: "Claude Platform" },
    { label: "Interactive prompt-engineering tutorial", url: "https://github.com/anthropics/prompt-eng-interactive-tutorial", source: "Anthropic" },
  ],
  "prompt-library": [
    { label: "Claude Code prompt library", url: `${CC}/prompt-library`, source: "Claude Docs" },
    { label: "Prompt engineering — Overview", url: `${PLAT}/build-with-claude/prompt-engineering/overview`, source: "Claude Platform" },
    cleanAbap,
  ],
  code: [
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    { label: "Best practices", url: `${CC}/best-practices`, source: "Claude Docs" },
    cleanAbap,
  ],

  // Module 3 — Advanced Capabilities
  cowork: [
    { label: "Claude Cowork — official product page", url: "https://claude.com/product/cowork", source: "Anthropic", note: "What Cowork is, core capabilities, plans and the intro video." },
    { label: "Getting started with Cowork", url: "https://support.claude.com/en/articles/13345190-getting-started-with-cowork", source: "Anthropic" },
    { label: "Using Cowork safely (permissions)", url: "https://support.claude.com/en/articles/13364135-using-cowork-safely", source: "Anthropic" },
    { label: "Claude Desktop", url: `${CC}/desktop`, source: "Claude Docs" },
  ],
  agent: [
    { label: "Subagents", url: `${CC}/sub-agents`, source: "Claude Docs" },
    { label: "Claude Agent SDK — Overview", url: `${CC}/agent-sdk/overview`, source: "Claude Docs" },
    { label: "Permission modes", url: `${CC}/permission-modes`, source: "Claude Docs" },
  ],
  skills: [
    { label: "Skills — official product page", url: "https://claude.com/skills", source: "Anthropic" },
    { label: "Agent Skills", url: `${CC}/skills`, source: "Claude Docs" },
    { label: "Hooks", url: `${CC}/hooks`, source: "Claude Docs" },
  ],
  "claude-tag": [
    { label: "Claude in Slack (@Claude) — official product page", url: "https://claude.com/product/tag", source: "Anthropic", note: "Tag @Claude into any Slack thread; Team & Enterprise, with Teams coming." },
    { label: "Claude in Slack", url: `${CC}/slack`, source: "Claude Docs" },
    { label: "Connectors", url: "https://claude.com/connectors", source: "Anthropic" },
  ],
  "claude-design": [
    { label: "Claude Design — official product page", url: "https://claude.com/product/design", source: "Anthropic", note: "Describe a prototype, deck or one-pager and Claude builds a draft." },
    { label: "Claude apps, built for work (use cases)", url: "https://claude.com/resources/use-cases", source: "Anthropic" },
    { label: "Meet Claude", url: "https://claude.com/product/overview", source: "Anthropic" },
  ],
  connectors: [
    { label: "Connectors — official product page", url: "https://claude.com/connectors", source: "Anthropic" },
    { label: "Model Context Protocol (MCP)", url: `${CC}/mcp`, source: "Claude Docs" },
    mcpIntro,
    { label: "Third-party integrations", url: `${CC}/third-party-integrations`, source: "Claude Docs" },
  ],

  // Module 4 — Integrations & Extensions
  "mcp-servers": [
    { label: "MCP in Claude Code", url: `${CC}/mcp`, source: "Claude Docs" },
    { label: "MCP quickstart", url: `${CC}/mcp-quickstart`, source: "Claude Docs" },
    mcpIntro,
  ],
  "github-integration": [
    { label: "Claude Code GitHub Actions", url: `${CC}/github-actions`, source: "Claude Docs", note: "Set up with /install-github-app, then trigger Claude with @claude on any issue or PR." },
    { label: "GitHub code review", url: `${CC}/code-review`, source: "Claude Docs" },
    { label: "anthropics/claude-code-action", url: "https://github.com/anthropics/claude-code-action", source: "GitHub" },
    abapGit,
  ],
  "vscode-integration": [
    { label: "Claude Code for VS Code", url: `${CC}/vs-code`, source: "Claude Docs" },
    { label: "Claude Code — Quickstart", url: `${CC}/quickstart`, source: "Claude Docs" },
  ],
  "chrome-extension": [
    { label: "Claude for Chrome — official product page", url: "https://claude.com/claude-for-chrome", source: "Anthropic" },
    { label: "Claude in Chrome", url: `${CC}/chrome`, source: "Claude Docs" },
    { label: "Computer use / browsing", url: `${CC}/computer-use`, source: "Claude Docs" },
  ],
  "excel-extension": [
    { label: "Claude for Microsoft 365 — official product page", url: "https://claude.com/claude-for-microsoft-365", source: "Anthropic" },
    { label: "Features overview", url: `${CC}/features-overview`, source: "Claude Docs" },
    { label: "Claude Desktop (Cowork with files)", url: `${CC}/desktop`, source: "Claude Docs" },
  ],

  // Module 5 — SAP Toolchain
  "sap-gui": [
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    cleanAbap,
    abapCheatSheets,
  ],
  "eclipse-adt": [
    abapGit,
    abapCheatSheets,
    { label: "Claude Code for VS Code (IDE comparison)", url: `${CC}/vs-code`, source: "Claude Docs" },
  ],
  "sap-abap-mcp-server": [
    { label: "MCP in Claude Code", url: `${CC}/mcp`, source: "Claude Docs" },
    { label: "MCP quickstart", url: `${CC}/mcp-quickstart`, source: "Claude Docs" },
    mcpIntro,
    abapGit,
  ],

  // Module 6 — Best Practices & Governance
  "ai-coding-best-practices": [
    { label: "Claude Code best practices", url: `${CC}/best-practices`, source: "Claude Docs" },
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    cleanAbap,
  ],
  "security-guidelines": [
    { label: "Permission modes", url: `${CC}/permission-modes`, source: "Claude Docs" },
    { label: "claude-code-action — Security docs", url: "https://github.com/anthropics/claude-code-action/blob/main/docs/security.md", source: "GitHub" },
    mcpIntro,
  ],
  troubleshooting: [
    { label: "Troubleshooting", url: `${CC}/troubleshooting`, source: "Claude Docs" },
    { label: "Troubleshoot installation", url: `${CC}/troubleshoot-install`, source: "Claude Docs" },
    { label: "Setup", url: `${CC}/setup`, source: "Claude Docs" },
  ],

  // Module 7 — Real SAP Projects
  "real-sap-project-examples": [
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    abapCheatSheets,
    cleanAbap,
  ],
  "s4hana-migration": [
    abapCheatSheets,
    cleanAbap,
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
  ],
  "atc-remediation": [
    abapCodeReview,
    cleanAbap,
    { label: "GitHub code review with Claude", url: `${CC}/code-review`, source: "Claude Docs" },
  ],
  "cds-views": [
    { label: "Claude Code — common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    abapCheatSheets,
    rapHelp,
    cleanAbap,
  ],
  "rap-development": [
    { label: "Claude Code — common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    rapHelp,
    abapCheatSheets,
    cleanAbap,
  ],
  odata: [
    { label: "Claude Code — common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    rapHelp,
    abapCheatSheets,
  ],

  // Module 8 — Quality & Productivity
  "performance-optimization": [
    abapCheatSheets,
    cleanAbap,
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
  ],
  "code-reviews": [
    abapCodeReview,
    { label: "GitHub code review with Claude", url: `${CC}/code-review`, source: "Claude Docs" },
    { label: "Best practices", url: `${CC}/best-practices`, source: "Claude Docs" },
  ],
  "documentation-generation": [
    { label: "Common workflows", url: `${CC}/common-workflows`, source: "Claude Docs" },
    { label: "Memory (CLAUDE.md)", url: `${CC}/memory`, source: "Claude Docs" },
    cleanAbap,
  ],
};

export function getLessonReferences(slug: string): Reference[] {
  return references[slug] ?? [];
}
