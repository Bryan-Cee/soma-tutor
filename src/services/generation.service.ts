import { approveAll } from "@github/copilot-sdk";
import { z } from "zod";
import {
  buildCourseOutlinePrompt,
  buildLessonContentPrompt,
  buildQuizPrompt,
  buildStandaloneLessonPrompt,
  buildStandaloneQuizPrompt,
} from "@/lib/copilot/prompts";
import type {
  LearningPreferences,
  CourseOutline,
  GeneratedLesson,
  GeneratedQuiz,
} from "@/types/generation";
import {
  courseOutlineSchema,
  generatedLessonSchema,
  generatedQuizSchema,
} from "@/types/generation";
import { getCopilotClient } from "@/lib/copilot/client";

const OUTLINE_TIMEOUT_MS = 3 * 60 * 1000;
const LESSON_TIMEOUT_MS = 5 * 60 * 1000;
const QUIZ_TIMEOUT_MS = 3 * 60 * 1000;

async function sendPrompt(prompt: string, timeoutMs: number): Promise<string> {
  const client = await getCopilotClient();
  const session = await client.createSession({
    onPermissionRequest: approveAll,
  });

  try {
    const response = await session.sendAndWait(prompt, timeoutMs);
    return response?.data?.content ?? "";
  } finally {
    await session.disconnect();
  }
}

function parseJsonResponse<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  return schema.parse(parsed);
}

export async function generateCourseOutline(
  prefs: LearningPreferences
): Promise<CourseOutline> {
  const prompt = buildCourseOutlinePrompt(prefs);
  const raw = await sendPrompt(prompt, OUTLINE_TIMEOUT_MS);
  return parseJsonResponse(raw, courseOutlineSchema);
}

export async function generateLessonContent(
  lessonTitle: string,
  lessonDescription: string,
  courseTopic: string,
  prefs: LearningPreferences
): Promise<GeneratedLesson> {
  const prompt = buildLessonContentPrompt(
    lessonTitle,
    lessonDescription,
    courseTopic,
    prefs
  );
  const raw = await sendPrompt(prompt, LESSON_TIMEOUT_MS);
  return parseJsonResponse(raw, generatedLessonSchema);
}

export async function generateModuleQuiz(
  moduleTitle: string,
  lessonTitles: string[],
  courseTopic: string,
  prefs: LearningPreferences
): Promise<GeneratedQuiz> {
  const prompt = buildQuizPrompt(moduleTitle, lessonTitles, courseTopic, prefs);
  const raw = await sendPrompt(prompt, QUIZ_TIMEOUT_MS);
  return parseJsonResponse(raw, generatedQuizSchema);
}

export async function generateStandaloneLesson(
  prefs: LearningPreferences
): Promise<GeneratedLesson> {
  const prompt = buildStandaloneLessonPrompt(prefs);
  const raw = await sendPrompt(prompt, LESSON_TIMEOUT_MS);
  return parseJsonResponse(raw, generatedLessonSchema);
}

export async function generateStandaloneQuiz(
  prefs: LearningPreferences
): Promise<GeneratedQuiz> {
  const prompt = buildStandaloneQuizPrompt(prefs);
  const raw = await sendPrompt(prompt, QUIZ_TIMEOUT_MS);
  return parseJsonResponse(raw, generatedQuizSchema);
}
