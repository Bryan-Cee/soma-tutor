export type CourseWithModules = {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "DRAFT" | "GENERATING" | "PUBLISHED" | "ARCHIVED";
  sourceLinks: string[];
  createdAt: Date;
  modules: ModuleWithLessons[];
};

export type ModuleWithLessons = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonSummary[];
  quizzes: QuizSummary[];
};

export type LessonSummary = {
  id: string;
  title: string;
  order: number;
};

export type QuizSummary = {
  id: string;
  title: string;
  order: number;
};

export type LessonDetail = {
  id: string;
  title: string;
  content: string;
  order: number;
  sourceLinks: string[];
  moduleId: string;
};
