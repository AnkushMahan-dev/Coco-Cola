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
}

export const reels: Reel[] = [
  {
    id: "g1C3q1coOPY",
    title: "What is Claude Code & how does it work?",
    author: "Cloud Champ",
    topic: "Claude Code",
  },
  {
    id: "-u1Y6SGgL40",
    title: "Use Claude AI without code or a terminal",
    author: "Brooke Wright",
    topic: "Cowork",
  },
  {
    id: "lm9ht8r-D8E",
    title: "The AI that thinks before it answers",
    author: "Topictrick",
    topic: "Meet Claude",
  },
  {
    id: "5AdTQK798vc",
    title: "How to get the BEST out of Claude AI",
    author: "Learn With Shopify",
    topic: "Prompting",
  },
  {
    id: "gFt7coSOKgE",
    title: "5 things to do before using Claude AI",
    author: "Jake Pfohl",
    topic: "Setup tips",
  },
  {
    id: "Nn8s2xS5kOE",
    title: "Claude breakdown — you're using only 3%",
    author: "DeepWing",
    topic: "Overview",
  },
];
