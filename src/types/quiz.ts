export type QuizWithQuestions = {
  id: string;
  title: string;
  moduleId: string;
  questions: QuestionDetail[];
};

export type QuestionDetail = {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  prompt: string;
  options: string[];
  order: number;
};

export type QuizSubmission = {
  quizId: string;
  answers: Record<string, string>;
};

export type QuizResult = {
  score: number;
  maxScore: number;
  results: QuestionResult[];
};

export type QuestionResult = {
  questionId: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
};
