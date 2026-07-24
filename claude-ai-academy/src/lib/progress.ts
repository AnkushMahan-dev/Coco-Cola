import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * Progress tracking backed by localStorage. Tracks completed lessons, quiz
 * scores, time spent, bookmarks, per-lesson notes, "was this helpful"
 * feedback, recently-viewed, and active days (for the streak). Uses
 * useSyncExternalStore so every subscribed component updates immediately.
 */

const STORAGE_KEY = "academy-progress-v2";
const RECENT_LIMIT = 8;

export interface ProgressState {
  /** lesson slug -> ISO date completed */
  completed: Record<string, string>;
  /** lesson slug -> best quiz score, 0..100 */
  quizScores: Record<string, number>;
  /** lesson slug -> seconds spent reading */
  secondsSpent: Record<string, number>;
  /** bookmarked lesson slugs */
  bookmarks: Record<string, true>;
  /** lesson slug -> "yes" | "no" feedback */
  helpful: Record<string, "yes" | "no">;
  /** lesson slug -> free-text note */
  notes: Record<string, string>;
  /** recently viewed lesson slugs, most-recent first */
  recent: string[];
  /** active day keys (YYYY-MM-DD, local) for the streak */
  activeDays: string[];
  lastVisitedSlug?: string;
}

const EMPTY: ProgressState = {
  completed: {},
  quizScores: {},
  secondsSpent: {},
  bookmarks: {},
  helpful: {},
  notes: {},
  recent: [],
  activeDays: [],
};

let cache: ProgressState = load();
const listeners = new Set<() => void>();

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateOld();
    return normalize(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

/** Pick up progress from the earlier v1 store, if present. */
function migrateOld(): ProgressState {
  try {
    const raw = localStorage.getItem("academy-progress-v1");
    if (!raw) return EMPTY;
    const old = JSON.parse(raw);
    return normalize({
      completed: old.completed,
      quizScores: old.quizScores,
      lastVisitedSlug: old.lastVisitedSlug,
    });
  } catch {
    return EMPTY;
  }
}

function normalize(p: Partial<ProgressState>): ProgressState {
  return {
    completed: p.completed ?? {},
    quizScores: p.quizScores ?? {},
    secondsSpent: p.secondsSpent ?? {},
    bookmarks: p.bookmarks ?? {},
    helpful: p.helpful ?? {},
    notes: p.notes ?? {},
    recent: Array.isArray(p.recent) ? p.recent : [],
    activeDays: Array.isArray(p.activeDays) ? p.activeDays : [],
    lastVisitedSlug: p.lastVisitedSlug,
  };
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

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function computeStreak(activeDays: string[]): number {
  const set = new Set(activeDays);
  let streak = 0;
  const base = new Date();
  for (let i = 0; ; i++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() - i);
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    const key = `${dt.getFullYear()}-${m}-${day}`;
    if (set.has(key)) {
      streak += 1;
    } else if (i === 0) {
      continue; // today not active yet — keep the streak from yesterday
    } else {
      break;
    }
  }
  return streak;
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
  addTime(slug: string, seconds: number) {
    if (seconds <= 0) return;
    persist({
      ...cache,
      secondsSpent: {
        ...cache.secondsSpent,
        [slug]: (cache.secondsSpent[slug] ?? 0) + seconds,
      },
    });
  },
  toggleBookmark(slug: string) {
    const bookmarks = { ...cache.bookmarks };
    if (bookmarks[slug]) delete bookmarks[slug];
    else bookmarks[slug] = true;
    persist({ ...cache, bookmarks });
  },
  setHelpful(slug: string, value: "yes" | "no") {
    persist({ ...cache, helpful: { ...cache.helpful, [slug]: value } });
  },
  setNote(slug: string, note: string) {
    const notes = { ...cache.notes };
    if (note.trim()) notes[slug] = note;
    else delete notes[slug];
    persist({ ...cache, notes });
  },
  pushRecent(slug: string) {
    const recent = [slug, ...cache.recent.filter((s) => s !== slug)].slice(
      0,
      RECENT_LIMIT,
    );
    persist({ ...cache, recent });
  },
  recordActiveDay() {
    const key = todayKey();
    if (cache.activeDays.includes(key)) return;
    persist({ ...cache, activeDays: [...cache.activeDays, key] });
  },
  setLastVisited(slug: string) {
    if (cache.lastVisitedSlug === slug) return;
    persist({ ...cache, lastVisitedSlug: slug });
  },
  exportJSON(): string {
    return JSON.stringify(cache, null, 2);
  },
  importJSON(raw: string): boolean {
    try {
      persist(normalize(JSON.parse(raw)));
      return true;
    } catch {
      return false;
    }
  },
  reset() {
    persist({ ...EMPTY, recent: [], activeDays: [] });
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
    isBookmarked: Boolean(state.bookmarks[slug]),
    helpful: state.helpful[slug],
    note: state.notes[slug] ?? "",
    toggle,
    toggleBookmark: useCallback(() => progressStore.toggleBookmark(slug), [slug]),
    setHelpful: useCallback(
      (v: "yes" | "no") => progressStore.setHelpful(slug, v),
      [slug],
    ),
    setNote: useCallback((n: string) => progressStore.setNote(slug, n), [slug]),
  };
}

/**
 * Accumulates reading time while a lesson is open and visible, records the
 * active day (for the streak) and pushes the lesson to "recently viewed".
 */
export function useLessonTimer(slug: string) {
  useEffect(() => {
    if (!slug) return;
    progressStore.recordActiveDay();
    progressStore.pushRecent(slug);

    const TICK = 5; // seconds
    let acc = 0;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        acc += TICK;
        if (acc >= 15) {
          progressStore.addTime(slug, acc);
          acc = 0;
        }
      }
    }, TICK * 1000);

    return () => {
      if (acc > 0) progressStore.addTime(slug, acc);
      window.clearInterval(id);
    };
  }, [slug]);
}
