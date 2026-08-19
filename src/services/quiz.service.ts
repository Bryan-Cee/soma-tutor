import { db } from "@/lib/db";
import type { QuizResult, QuizSubmission } from "@/types/quiz";

export async function submitQuiz(
  userId: string,
  submission: QuizSubmission
): Promise<QuizResult> {
  const quiz = await db.quiz.findUniqueOrThrow({
    where: { id: submission.quizId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  const results: QuizResult["results"] = [];
  let score = 0;

  for (const question of quiz.questions) {
    const userAnswer = submission.answers[question.id] ?? "";
    const correct =
      userAnswer.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase();

    if (correct) score++;

    results.push({
      questionId: question.id,
      correct,
      userAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  }

  await db.quizAttempt.create({
    data: {
      score,
      maxScore: quiz.questions.length,
      answers: submission.answers,
      userId,
      quizId: quiz.id,
    },
  });

  return {
    score,
    maxScore: quiz.questions.length,
    results,
  };
}

export async function getQuizWithQuestions(quizId: string) {
  return db.quiz.findUniqueOrThrow({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          prompt: true,
          options: true,
          order: true,
        },
      },
    },
  });
}
