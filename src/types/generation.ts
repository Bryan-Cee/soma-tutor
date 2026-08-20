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

const sourceLinksSchema = z.array(z.url()).max(20);

export const lessonOutlineSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const moduleOutlineSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  lessons: z.array(lessonOutlineSchema).min(1).max(5),
  quizTitle: z.string().min(1),
});

export const courseOutlineSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  modules: z.array(moduleOutlineSchema).min(1).max(6),
  sourceLinks: sourceLinksSchema,
});

export const generatedLessonSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  sourceLinks: sourceLinksSchema,
});

export const generatedQuestionSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).max(8),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
});

export const generatedQuizSchema = z.object({
  title: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(1).max(20),
});

export type CourseOutline = z.infer<typeof courseOutlineSchema>;
export type ModuleOutline = z.infer<typeof moduleOutlineSchema>;
export type LessonOutline = z.infer<typeof lessonOutlineSchema>;
export type GeneratedLesson = z.infer<typeof generatedLessonSchema>;
export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
