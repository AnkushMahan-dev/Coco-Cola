/**
 * Official Claude products & features from claude.com — surfaced in the app
 * so developers can jump straight to the authoritative source. Every URL was
 * fetched and confirmed live (July 2026); blurbs paraphrase Anthropic's own
 * page descriptions. `hue` is an HSL triplet used via the --ah CSS var.
 */

export interface EcosystemItem {
  icon: string; // emoji
  name: string;
  blurb: string;
  url: string;
  domain: string;
  hue: string;
  /** Optional in-app lesson this maps to, for a "learn it here" link */
  lessonSlug?: string;
}

export const ecosystem: EcosystemItem[] = [
  {
    icon: "🤝",
    name: "Claude Cowork",
    blurb:
      "Hand off a multi-step task and come back to a finished deck, doc or spreadsheet. Runs unattended and on any device.",
    url: "https://claude.com/product/cowork",
    domain: "claude.com/product/cowork",
    hue: "346 84% 57%",
    lessonSlug: "cowork",
  },
  {
    icon: "💻",
    name: "Claude Code",
    blurb:
      "The agentic coding tool — understands your codebase, edits files and runs commands in your terminal, IDE and desktop.",
    url: "https://claude.com/product/claude-code",
    domain: "claude.com/product/claude-code",
    hue: "262 83% 58%",
    lessonSlug: "claude-code",
  },
  {
    icon: "🌐",
    name: "Claude for Chrome",
    blurb:
      "Claude works right in your browser — clicks, fills forms and navigates sites so you can automate everyday web tasks.",
    url: "https://claude.com/claude-for-chrome",
    domain: "claude.com/claude-for-chrome",
    hue: "189 94% 40%",
    lessonSlug: "chrome-extension",
  },
  {
    icon: "🧩",
    name: "Skills",
    blurb:
      "Package your procedures and expertise so Claude delivers consistent, expert-level output on specialized tasks.",
    url: "https://claude.com/skills",
    domain: "claude.com/skills",
    hue: "291 70% 55%",
    lessonSlug: "skills",
  },
  {
    icon: "🔗",
    name: "Connectors",
    blurb:
      "Connect Claude to the tools you already use — built on the Model Context Protocol (MCP).",
    url: "https://claude.com/connectors",
    domain: "claude.com/connectors",
    hue: "158 72% 38%",
    lessonSlug: "connectors",
  },
  {
    icon: "📊",
    name: "Claude for Microsoft 365",
    blurb:
      "Bring Claude into Excel, Word, Outlook and Teams — analyze spreadsheets and draft documents where you already work.",
    url: "https://claude.com/claude-for-microsoft-365",
    domain: "claude.com/claude-for-microsoft-365",
    hue: "173 80% 38%",
    lessonSlug: "excel-extension",
  },
  {
    icon: "💬",
    name: "@Claude in Slack",
    blurb:
      "Mention @Claude in Slack to research, summarize and take action right where your team already talks.",
    url: "https://claude.com/product/tag",
    domain: "claude.com/product/tag",
    hue: "34 95% 48%",
  },
  {
    icon: "🔌",
    name: "Plugins",
    blurb:
      "Bundle skills, connectors and sub-agents into a single install so Claude shows up as a specialist from day one.",
    url: "https://claude.com/plugins",
    domain: "claude.com/plugins",
    hue: "217 91% 56%",
  },
  {
    icon: "📚",
    name: "Developer Platform",
    blurb:
      "Build with the Claude API and Agent SDK — models, tool use, MCP and prompt caching, fully documented.",
    url: "https://platform.claude.com/docs",
    domain: "platform.claude.com/docs",
    hue: "262 83% 58%",
  },
];
