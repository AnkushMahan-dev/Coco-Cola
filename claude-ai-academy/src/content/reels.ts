/**
 * Short vertical YouTube clips ("reels") for a bite-sized, engaging intro to
 * Claude topics. Every id is a real YouTube Short, fetched and confirmed live
 * (July 2026). Titles are trimmed for the card; author is the channel.
 */

export interface Reel {
  id: string;
  title: string;
  author: string;
  topic: string;
  /** Terms matched (case-insensitive) against a lesson's slug/title/keywords
   * to surface this reel inside that lesson's Video section. */
  match: string[];
}

export const reels: Reel[] = [
  {
    id: "g1C3q1coOPY",
    title: "What is Claude Code & how does it work?",
    author: "Cloud Champ",
    topic: "Claude Code",
    match: ["claude-code", "claude code", "terminal", "cli", "agentic coding"],
  },
  {
    id: "-u1Y6SGgL40",
    title: "Use Claude AI without code or a terminal",
    author: "Brooke Wright",
    topic: "Cowork",
    match: ["cowork", "agent", "no code", "no-code", "workspace"],
  },
  {
    id: "lm9ht8r-D8E",
    title: "The AI that thinks before it answers",
    author: "Topictrick",
    topic: "Meet Claude",
    match: ["what is claude", "meet claude", "getting-started", "intro", "extended thinking", "reasoning"],
  },
  {
    id: "5AdTQK798vc",
    title: "How to get the BEST out of Claude AI",
    author: "Learn With Shopify",
    topic: "Prompting",
    match: ["prompt", "prompting", "context", "role", "instruction", "chat"],
  },
  {
    id: "gFt7coSOKgE",
    title: "5 things to do before using Claude AI",
    author: "Jake Pfohl",
    topic: "Setup tips",
    match: ["setup", "install", "desktop", "windows", "account", "configure"],
  },
  {
    id: "Nn8s2xS5kOE",
    title: "Claude breakdown — you're using only 3%",
    author: "DeepWing",
    topic: "Overview",
    match: ["overview", "best-practice", "governance", "productivity", "tips"],
  },
];

/**
 * Pick the most relevant reel for a lesson by scoring each reel's `match`
 * terms against the lesson's slug, title and keywords. Returns undefined when
 * nothing matches well, so lessons without a clear fit show no reel.
 */
export function reelForLesson(lesson: {
  slug: string;
  title: string;
  keywords?: string[];
}): Reel | undefined {
  const haystack = [
    lesson.slug,
    lesson.title,
    ...(lesson.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  let best: Reel | undefined;
  let bestScore = 0;
  for (const reel of reels) {
    const score = reel.match.reduce(
      (n, term) => (haystack.includes(term.toLowerCase()) ? n + 1 : n),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = reel;
    }
  }
  return bestScore > 0 ? best : undefined;
}
