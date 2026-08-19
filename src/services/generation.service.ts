import { CopilotClient, approveAll } from "@github/copilot-sdk";
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
import { getCopilotClient } from "@/lib/copilot/client";

async function sendPrompt(prompt: string): Promise<string> {
  const client = await getCopilotClient();
  const session = await client.createSession({
    onPermissionRequest: approveAll,
  });

  const response = await session.sendAndWait(prompt, 120_000);
  await session.disconnect();
  return response?.data?.content ?? "";
}

function parseJsonResponse<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export async function generateCourseOutline(
  prefs: LearningPreferences
): Promise<CourseOutline> {
  const prompt = buildCourseOutlinePrompt(prefs);
  const raw = await sendPrompt(prompt);
  return parseJsonResponse<CourseOutline>(raw);
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
  const raw = await sendPrompt(prompt);
  return parseJsonResponse<GeneratedLesson>(raw);
}

export async function generateModuleQuiz(
  moduleTitle: string,
  lessonTitles: string[],
  courseTopic: string,
  prefs: LearningPreferences
): Promise<GeneratedQuiz> {
  const prompt = buildQuizPrompt(moduleTitle, lessonTitles, courseTopic, prefs);
  const raw = await sendPrompt(prompt);
  return parseJsonResponse<GeneratedQuiz>(raw);
}

export async function generateStandaloneLesson(
  prefs: LearningPreferences
): Promise<GeneratedLesson> {
  const prompt = buildStandaloneLessonPrompt(prefs);
  const raw = await sendPrompt(prompt);
  return parseJsonResponse<GeneratedLesson>(raw);
}

export async function generateStandaloneQuiz(
  prefs: LearningPreferences
): Promise<GeneratedQuiz> {
  const prompt = buildStandaloneQuizPrompt(prefs);
  const raw = await sendPrompt(prompt);
  return parseJsonResponse<GeneratedQuiz>(raw);
}
