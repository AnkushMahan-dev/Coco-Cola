import type { Lesson, Module } from "./types";
import { module1 } from "./modules/module-1-getting-started";
import { module2 } from "./modules/module-2-prompt-engineering";
import { module3 } from "./modules/module-3-advanced-capabilities";
import { module4 } from "./modules/module-4-integrations";
import { module5 } from "./modules/module-5-sap-toolchain";
import { module6 } from "./modules/module-6-best-practices";
import { module7 } from "./modules/module-7-real-sap-projects";
import { module8 } from "./modules/module-8-quality-productivity";

export const curriculum: Module[] = [
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
  module8,
];

export interface LessonRef {
  lesson: Lesson;
  module: Module;
  /** Index of the lesson within its module */
  index: number;
  /** Position in the full linear curriculum, 0-based */
  position: number;
}

const lessonIndex = new Map<string, LessonRef>();
const linear: LessonRef[] = [];

let position = 0;
for (const module of curriculum) {
  module.lessons.forEach((lesson, index) => {
    const ref: LessonRef = { lesson, module, index, position };
    lessonIndex.set(lesson.slug, ref);
    linear.push(ref);
    position += 1;
  });
}

export const allLessons: LessonRef[] = linear;
export const totalLessonCount = linear.length;

export function findLesson(slug: string): LessonRef | undefined {
  return lessonIndex.get(slug);
}

export function findModule(slug: string): Module | undefined {
  return curriculum.find((m) => m.slug === slug);
}

export function nextLesson(slug: string): LessonRef | undefined {
  const ref = lessonIndex.get(slug);
  if (!ref) return undefined;
  return linear[ref.position + 1];
}

export function previousLesson(slug: string): LessonRef | undefined {
  const ref = lessonIndex.get(slug);
  if (!ref) return undefined;
  return ref.position > 0 ? linear[ref.position - 1] : undefined;
}
