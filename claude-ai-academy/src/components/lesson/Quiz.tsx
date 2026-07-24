import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, HelpCircle, RotateCcw, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { progressStore } from "@/lib/progress";
import type { QuizQuestion } from "@/content/types";

interface QuizProps {
  lessonSlug: string;
  questions: QuizQuestion[];
}

/**
 * Interactive quiz: one question at a time, immediate feedback with
 * explanations, final score recorded into progress tracking.
 */
export function Quiz({ lessonSlug, questions }: QuizProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const isLast = current === questions.length - 1;

  const submit = () => {
    if (selected === null || revealed) return;
    setRevealed(true);
    if (selected === question.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const next = () => {
    if (isLast) {
      const finalCorrect =
        correctCount; // already includes current question via submit()
      const score = Math.round((finalCorrect / questions.length) * 100);
      progressStore.recordQuizScore(lessonSlug, score);
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setFinished(false);
  };

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              score >= 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
            )}
          >
            <Trophy className="h-8 w-8" aria-hidden />
          </motion.div>
          <div>
            <p className="text-2xl font-bold">
              {correctCount} / {questions.length} correct
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {score >= 70
                ? "Great job — you passed this lesson's quiz. Your best score is saved to your dashboard."
                : "Below 70%. Review the lesson sections above and try again — your best score is kept."}
            </p>
          </div>
          <Button variant="outline" onClick={restart}>
            <RotateCcw aria-hidden /> Retake quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" aria-hidden />
            Question {current + 1} of {questions.length}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {correctCount} correct so far
          </span>
        </div>
        <Progress value={(current / questions.length) * 100} aria-label="Quiz progress" />
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <p className="font-medium leading-relaxed">{question.question}</p>
            <div role="radiogroup" aria-label="Answer options" className="grid gap-2">
              {question.options.map((option, i) => {
                const isCorrect = revealed && i === question.correctIndex;
                const isWrongPick =
                  revealed && i === selected && i !== question.correctIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected === i}
                    disabled={revealed}
                    onClick={() => setSelected(i)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !revealed && selected === i && "border-primary bg-accent",
                      !revealed && selected !== i && "hover:bg-muted",
                      isCorrect && "border-success bg-success/10",
                      isWrongPick && "border-destructive bg-destructive/10",
                      revealed && !isCorrect && !isWrongPick && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                        isCorrect && "border-success bg-success text-success-foreground",
                        isWrongPick &&
                          "border-destructive bg-destructive text-destructive-foreground",
                      )}
                    >
                      {isCorrect ? (
                        <Check className="h-3 w-3" aria-hidden />
                      ) : isWrongPick ? (
                        <X className="h-3 w-3" aria-hidden />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={cn(
                  "rounded-lg border p-3 text-sm leading-relaxed",
                  selected === question.correctIndex
                    ? "border-success/40 bg-success/5"
                    : "border-warning/40 bg-warning/5",
                )}
              >
                <p className="font-semibold">
                  {selected === question.correctIndex ? "Correct!" : "Not quite."}
                </p>
                <p className="mt-1 text-muted-foreground">{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end gap-2">
          {!revealed ? (
            <Button onClick={submit} disabled={selected === null}>
              Check answer
            </Button>
          ) : (
            <Button onClick={next}>
              {isLast ? "See results" : "Next question"}
              <ChevronRight aria-hidden />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
