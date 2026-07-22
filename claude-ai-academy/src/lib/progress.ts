import { useCallback, useSyncExternalStore } from "react";

/**
 * Progress tracking backed by localStorage.
 * Tracks completed lessons and per-lesson quiz scores.
 * Uses useSyncExternalStore so every subscribed component
 * (sidebar, dashboard, lesson page) updates immediately.
 */

const STORAGE_KEY = "academy-progress-v1";

export interface ProgressState {
  /** lesson slug -> ISO date completed */
  completed: Record<string, string>;
  /** lesson slug -> best quiz score, 0..100 */
  quizScores: Record<string, number>;
  lastVisitedSlug?: string;
}

const EMPTY: ProgressState = { completed: {}, quizScores: {} };

let cache: ProgressState = load();
const listeners = new Set<() => void>();

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completed: parsed.completed ?? {},
      quizScores: parsed.quizScores ?? {},
      lastVisitedSlug: parsed.lastVisitedSlug,
    };
  } catch {
    return EMPTY;
  }
}

function persist(next: ProgressState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable: keep in-memory state.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ProgressState {
  return cache;
}

export const progressStore = {
  markComplete(slug: string) {
    if (cache.completed[slug]) return;
    persist({
      ...cache,
      completed: { ...cache.completed, [slug]: new Date().toISOString() },
    });
  },
  markIncomplete(slug: string) {
    if (!cache.completed[slug]) return;
    const completed = { ...cache.completed };
    delete completed[slug];
    persist({ ...cache, completed });
  },
  recordQuizScore(slug: string, score: number) {
    const best = Math.max(cache.quizScores[slug] ?? 0, score);
    persist({ ...cache, quizScores: { ...cache.quizScores, [slug]: best } });
  },
  setLastVisited(slug: string) {
    if (cache.lastVisitedSlug === slug) return;
    persist({ ...cache, lastVisitedSlug: slug });
  },
  reset() {
    persist(EMPTY);
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useLessonProgress(slug: string) {
  const state = useProgress();
  const toggle = useCallback(() => {
    if (cache.completed[slug]) progressStore.markIncomplete(slug);
    else progressStore.markComplete(slug);
  }, [slug]);
  return {
    isComplete: Boolean(state.completed[slug]),
    quizScore: state.quizScores[slug],
    toggle,
  };
}
