import type { LearningPreferences } from "@/types/generation";

export function buildCourseOutlinePrompt(prefs: LearningPreferences): string {
  return `You are an expert curriculum designer. Generate a structured course outline for the topic below.

TOPIC: ${prefs.topic}
${prefs.specificInterests ? `FOCUS AREAS: ${prefs.specificInterests}` : ""}
STUDENT LEVEL: ${prefs.knowledgeLevel}
LEARNING STYLE: ${prefs.learningStyle}
TIME BUDGET: ${prefs.timeBudget}

Requirements:
- Structure the course into 3-5 logical modules
- Each module should have 2-4 lessons
- Each module ends with a quiz
- Adapt depth and vocabulary to the student's level
- Include real-world examples for the "${prefs.learningStyle}" learning style

Respond with valid JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "modules": [
    {
      "title": "string",
      "description": "string",
      "lessons": [{ "title": "string", "description": "string" }],
      "quizTitle": "string"
    }
  ],
  "sourceLinks": ["string"]
}

IMPORTANT: Include source links (URLs) to authoritative resources you reference.
Respond ONLY with the JSON object, no markdown fences.`;
}

export function buildLessonContentPrompt(
  lessonTitle: string,
  lessonDescription: string,
  courseTopic: string,
  prefs: LearningPreferences
): string {
  return `You are an expert tutor. Write a comprehensive lesson on the topic below.

COURSE TOPIC: ${courseTopic}
LESSON: ${lessonTitle}
DESCRIPTION: ${lessonDescription}
STUDENT LEVEL: ${prefs.knowledgeLevel}
LEARNING STYLE: ${prefs.learningStyle}

Requirements:
- Write in Markdown format
- Use clear headings and subheadings
- Include practical examples and code snippets where relevant
- For "${prefs.learningStyle}" learners: ${getLearningStyleGuidance(prefs.learningStyle)}
- Adapt vocabulary and depth to ${prefs.knowledgeLevel} level
- Keep the lesson focused at approximately 700-1,000 words
- End with a brief summary of key takeaways
- Include source references as markdown links

Respond with valid JSON:
{
  "title": "string",
  "content": "string (markdown)",
  "sourceLinks": ["string"]
}

Respond ONLY with the JSON object, no markdown fences.`;
}

export function buildQuizPrompt(
  moduleTitle: string,
  lessonTitles: string[],
  courseTopic: string,
  prefs: LearningPreferences
): string {
  return `You are an expert educator. Generate a quiz to test understanding of the module below.

COURSE TOPIC: ${courseTopic}
MODULE: ${moduleTitle}
LESSONS COVERED: ${lessonTitles.join(", ")}
STUDENT LEVEL: ${prefs.knowledgeLevel}

Requirements:
- Generate 5-10 questions
- Mix question types: multiple_choice, true_false, short_answer
- Questions should test comprehension, not just recall
- Include clear explanations for each correct answer
- Difficulty should match ${prefs.knowledgeLevel} level

Respond with valid JSON:
{
  "title": "string",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "prompt": "string",
      "options": ["string"] (empty array for SHORT_ANSWER),
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Respond ONLY with the JSON object, no markdown fences.`;
}

export function buildStandaloneLessonPrompt(prefs: LearningPreferences): string {
  return `You are an expert tutor. Write a comprehensive, self-contained lesson on the topic below.

TOPIC: ${prefs.topic}
${prefs.specificInterests ? `FOCUS AREAS: ${prefs.specificInterests}` : ""}
STUDENT LEVEL: ${prefs.knowledgeLevel}
LEARNING STYLE: ${prefs.learningStyle}
TIME BUDGET: ${prefs.timeBudget}

Requirements:
- Write in Markdown format with clear structure
- Include an introduction, main content sections, examples, and summary
- For "${prefs.learningStyle}" learners: ${getLearningStyleGuidance(prefs.learningStyle)}
- Adapt depth to match a ${prefs.timeBudget === "15min" ? "15-minute read" : prefs.timeBudget === "1hour" ? "1-hour deep dive" : "thorough multi-session study"}
- Include source references as markdown links

Respond with valid JSON:
{
  "title": "string",
  "content": "string (markdown)",
  "sourceLinks": ["string"]
}

Respond ONLY with the JSON object, no markdown fences.`;
}

export function buildStandaloneQuizPrompt(prefs: LearningPreferences): string {
  return `You are an expert educator. Generate a quiz to test knowledge on the topic below.

TOPIC: ${prefs.topic}
${prefs.specificInterests ? `FOCUS AREAS: ${prefs.specificInterests}` : ""}
STUDENT LEVEL: ${prefs.knowledgeLevel}

Requirements:
- Generate ${prefs.timeBudget === "15min" ? "5-8" : prefs.timeBudget === "1hour" ? "10-15" : "15-20"} questions
- Mix question types: multiple_choice, true_false, short_answer
- Questions should test comprehension, not just recall
- Include clear explanations for each correct answer
- Difficulty should match ${prefs.knowledgeLevel} level

Respond with valid JSON:
{
  "title": "string",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "prompt": "string",
      "options": ["string"] (empty array for SHORT_ANSWER),
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Respond ONLY with the JSON object, no markdown fences.`;
}

function getLearningStyleGuidance(style: LearningPreferences["learningStyle"]): string {
  switch (style) {
    case "reading":
      return "Use detailed written explanations with clear prose. Prefer thorough text over visual aids.";
    case "examples":
      return "Lead with concrete examples before introducing theory. Use real-world scenarios and case studies.";
    case "exercises":
      return "Include hands-on exercises, practice problems, and challenges throughout the lesson.";
    case "walkthrough":
      return "Structure as a guided walkthrough with step-by-step instructions. Explain each step as you go.";
  }
}
