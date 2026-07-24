/**
 * Official Claude products & features from claude.com — surfaced in the app
 * so developers can jump straight to the authoritative source. Ordered to
 * mirror the claude.com navigation. Every URL was fetched and confirmed live
 * (July 2026); blurbs use Anthropic's own page wording. `hue` is an HSL
 * triplet used via the --ah CSS var.
 */

export interface EcosystemItem {
  icon: string; // emoji
  name: string;
  /** Short line from the official claude.com page */
  blurb: string;
  url: string;
  domain: string;
  hue: string;
  /** Grouping shown as a small eyebrow on the card */
  group: "Meet Claude" | "Products" | "Features" | "Explore";
  /** Optional in-app lesson this maps to, for a "covered here" tag */
  lessonSlug?: string;
}

export const ecosystem: EcosystemItem[] = [
  {
    icon: "🧠",
    name: "Meet Claude",
    blurb:
      "Anthropic's AI, built for problem solvers — tackle complex challenges, analyze data, write code and think through your hardest work.",
    url: "https://claude.com/product/overview",
    domain: "claude.com/product/overview",
    hue: "262 83% 58%",
    group: "Meet Claude",
    lessonSlug: "claude-web",
  },
  {
    icon: "💻",
    name: "Claude Code",
    blurb:
      "The agentic coding tool — understands your codebase, edits files and runs commands in your terminal, IDE and desktop.",
    url: "https://claude.com/product/claude-code",
    domain: "claude.com/product/claude-code",
    hue: "224 76% 56%",
    group: "Products",
    lessonSlug: "claude-code",
  },
  {
    icon: "🤝",
    name: "Claude Cowork",
    blurb:
      "Hand off a multi-step task and come back to a finished deck, doc or spreadsheet. Runs unattended and on any device.",
    url: "https://claude.com/product/cowork",
    domain: "claude.com/product/cowork",
    hue: "346 84% 57%",
    group: "Products",
    lessonSlug: "cowork",
  },
  {
    icon: "💬",
    name: "@Claude",
    blurb:
      "Tag @Claude into any Slack thread — it reads the room, does the work, and posts back where everyone can see it. (Team & Enterprise)",
    url: "https://claude.com/product/tag",
    domain: "claude.com/product/tag",
    hue: "34 95% 48%",
    group: "Products",
    lessonSlug: "claude-tag",
  },
  {
    icon: "🌐",
    name: "Claude for Chrome",
    blurb:
      "Claude works right in your browser — clicks, fills forms and navigates sites so you can automate everyday web tasks.",
    url: "https://claude.com/claude-for-chrome",
    domain: "claude.com/claude-for-chrome",
    hue: "189 94% 40%",
    group: "Features",
    lessonSlug: "chrome-extension",
  },
  {
    icon: "📊",
    name: "Claude for Microsoft 365",
    blurb:
      "Bring Claude into Excel, Word, Outlook and Teams — analyze spreadsheets and draft documents where you already work.",
    url: "https://claude.com/claude-for-microsoft-365",
    domain: "claude.com/claude-for-microsoft-365",
    hue: "173 80% 38%",
    group: "Features",
    lessonSlug: "excel-extension",
  },
  {
    icon: "🧩",
    name: "Skills",
    blurb:
      "Package your procedures and expertise so Claude delivers consistent, expert-level output on specialized tasks.",
    url: "https://claude.com/skills",
    domain: "claude.com/skills",
    hue: "291 70% 55%",
    group: "Features",
    lessonSlug: "skills",
  },
  {
    icon: "🧰",
    name: "Claude apps, built for work",
    blurb:
      "Browse practical examples across research, writing, coding and analysis — whether you work solo or with a team.",
    url: "https://claude.com/resources/use-cases",
    domain: "claude.com/resources/use-cases",
    hue: "152 60% 44%",
    group: "Explore",
    lessonSlug: "real-sap-project-examples",
  },
  {
    icon: "🎨",
    name: "Claude Design",
    blurb:
      "Describe a prototype, deck or one-pager and Claude builds a draft — refine it yourself or hand it to your tools or Claude Code.",
    url: "https://claude.com/product/design",
    domain: "claude.com/product/design",
    hue: "322 80% 58%",
    group: "Explore",
    lessonSlug: "claude-design",
  },
  {
    icon: "🔗",
    name: "Connectors",
    blurb:
      "Connect Claude to the tools you already use — built on the Model Context Protocol (MCP).",
    url: "https://claude.com/connectors",
    domain: "claude.com/connectors",
    hue: "158 72% 38%",
    group: "Explore",
    lessonSlug: "connectors",
  },
  {
    icon: "🔌",
    name: "Plugins",
    blurb:
      "Bundle skills, connectors and sub-agents into a single install so Claude shows up as a specialist from day one.",
    url: "https://claude.com/plugins",
    domain: "claude.com/plugins",
    hue: "217 91% 56%",
    group: "Explore",
  },
  {
    icon: "📚",
    name: "Developer Platform",
    blurb:
      "Build with the Claude API and Agent SDK — models, tool use, MCP and prompt caching, fully documented.",
    url: "https://platform.claude.com/docs",
    domain: "platform.claude.com/docs",
    hue: "262 70% 60%",
    group: "Explore",
  },
];
