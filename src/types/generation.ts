import { z } from "zod";

export const LEARNING_STYLES = {
  READING: "reading",
  EXAMPLES: "examples",
  EXERCISES: "exercises",
  WALKTHROUGH: "walkthrough",
} as const;

export const KNOWLEDGE_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
} as const;

export const GENERATION_GOALS = {
  QUICK_QUIZ: "quick_quiz",
  LEARN_CONCEPT: "learn_concept",
  MASTER_SUBJECT: "master_subject",
} as const;

export const TIME_BUDGETS = {
  FIFTEEN_MIN: "15min",
  ONE_HOUR: "1hour",
  MULTI_DAY: "multi_day",
} as const;

export const learningPreferencesSchema = z.object({
  topic: z.string().min(1),
  specificInterests: z.string().optional(),
  knowledgeLevel: z.enum(["beginner", "intermediate", "advanced"]),
  learningStyle: z.enum(["reading", "examples", "exercises", "walkthrough"]),
  goal: z.enum(["quick_quiz", "learn_concept", "master_subject"]),
  timeBudget: z.enum(["15min", "1hour", "multi_day"]),
});

export type LearningPreferences = z.infer<typeof learningPreferencesSchema>;

export type GenerationMode = "QUIZ" | "LESSON" | "FULL_COURSE";

export function mapGoalToMode(goal: LearningPreferences["goal"]): GenerationMode {
  switch (goal) {
    case "quick_quiz":
      return "QUIZ";
    case "learn_concept":
      return "LESSON";
    case "master_subject":
      return "FULL_COURSE";
  }
}

export type CourseOutline = {
  title: string;
  description: string;
  modules: ModuleOutline[];
  sourceLinks: string[];
};

export type ModuleOutline = {
  title: string;
  description: string;
  lessons: LessonOutline[];
  quizTitle: string;
};

export type LessonOutline = {
  title: string;
  description: string;
};

export type GeneratedLesson = {
  title: string;
  content: string;
  sourceLinks: string[];
};

export type GeneratedQuiz = {
  title: string;
  questions: GeneratedQuestion[];
};

export type GeneratedQuestion = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};
