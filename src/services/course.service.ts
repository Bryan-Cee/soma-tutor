import { db } from "@/lib/db";
import type { LearningPreferences, CourseOutline, GeneratedLesson, GeneratedQuiz } from "@/types/generation";
import {
  generateCourseOutline,
  generateLessonContent,
  generateModuleQuiz,
  generateStandaloneLesson,
  generateStandaloneQuiz,
} from "@/services/generation.service";

export async function createFullCourse(
  userId: string,
  sessionId: string,
  prefs: LearningPreferences
): Promise<string> {
  // Update session status
  await db.learningSession.update({
    where: { id: sessionId },
    data: { status: "GENERATING" },
  });

  try {
    // Step 1: Generate course outline
    const outline = await generateCourseOutline(prefs);

    // Step 2: Create course in DB
    const course = await db.course.create({
      data: {
        title: outline.title,
        description: outline.description,
        topic: prefs.topic,
        difficulty: prefs.knowledgeLevel.toUpperCase() as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        status: "GENERATING",
        sourceLinks: outline.sourceLinks,
        creatorId: userId,
      },
    });

    // Step 3: Create modules and generate content
    for (let mi = 0; mi < outline.modules.length; mi++) {
      const mod = outline.modules[mi];

      const dbModule = await db.module.create({
        data: {
          title: mod.title,
          description: mod.description,
          order: mi,
          courseId: course.id,
        },
      });

      // Generate lesson content for each lesson in the module
      for (let li = 0; li < mod.lessons.length; li++) {
        const lessonOutline = mod.lessons[li];
        const generated = await generateLessonContent(
          lessonOutline.title,
          lessonOutline.description,
          prefs.topic,
          prefs
        );

        await db.lesson.create({
          data: {
            title: generated.title,
            content: generated.content,
            order: li,
            sourceLinks: generated.sourceLinks,
            moduleId: dbModule.id,
          },
        });
      }

      // Generate quiz for the module
      const quiz = await generateModuleQuiz(
        mod.title,
        mod.lessons.map((l) => l.title),
        prefs.topic,
        prefs
      );

      const dbQuiz = await db.quiz.create({
        data: {
          title: quiz.title,
          order: 0,
          moduleId: dbModule.id,
        },
      });

      for (let qi = 0; qi < quiz.questions.length; qi++) {
        const q = quiz.questions[qi];
        await db.question.create({
          data: {
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: qi,
            quizId: dbQuiz.id,
          },
        });
      }
    }

    // Step 4: Publish course and update session
    await db.course.update({
      where: { id: course.id },
      data: { status: "PUBLISHED" },
    });

    await db.learningSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETE", courseId: course.id },
    });

    // Auto-enroll the student
    await db.enrollment.create({
      data: { userId, courseId: course.id },
    });

    await db.studentProgress.create({
      data: { userId, courseId: course.id },
    });

    return course.id;
  } catch (error) {
    await db.learningSession.update({
      where: { id: sessionId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function createStandaloneLesson(
  userId: string,
  sessionId: string,
  prefs: LearningPreferences
): Promise<string> {
  await db.learningSession.update({
    where: { id: sessionId },
    data: { status: "GENERATING" },
  });

  try {
    const generated = await generateStandaloneLesson(prefs);

    const course = await db.course.create({
      data: {
        title: generated.title,
        description: `A lesson on ${prefs.topic}`,
        topic: prefs.topic,
        difficulty: prefs.knowledgeLevel.toUpperCase() as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        status: "PUBLISHED",
        sourceLinks: generated.sourceLinks,
        creatorId: userId,
      },
    });

    const dbModule = await db.module.create({
      data: {
        title: generated.title,
        description: `Lesson module`,
        order: 0,
        courseId: course.id,
      },
    });

    await db.lesson.create({
      data: {
        title: generated.title,
        content: generated.content,
        order: 0,
        sourceLinks: generated.sourceLinks,
        moduleId: dbModule.id,
      },
    });

    await db.learningSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETE", courseId: course.id },
    });

    await db.enrollment.create({
      data: { userId, courseId: course.id },
    });

    await db.studentProgress.create({
      data: { userId, courseId: course.id },
    });

    return course.id;
  } catch (error) {
    await db.learningSession.update({
      where: { id: sessionId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function createStandaloneQuiz(
  userId: string,
  sessionId: string,
  prefs: LearningPreferences
): Promise<string> {
  await db.learningSession.update({
    where: { id: sessionId },
    data: { status: "GENERATING" },
  });

  try {
    const generated = await generateStandaloneQuiz(prefs);

    const course = await db.course.create({
      data: {
        title: `Quiz: ${prefs.topic}`,
        description: `A quiz on ${prefs.topic}`,
        topic: prefs.topic,
        difficulty: prefs.knowledgeLevel.toUpperCase() as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        status: "PUBLISHED",
        sourceLinks: [],
        creatorId: userId,
      },
    });

    const dbModule = await db.module.create({
      data: {
        title: `${prefs.topic} Quiz`,
        description: "Quiz module",
        order: 0,
        courseId: course.id,
      },
    });

    const dbQuiz = await db.quiz.create({
      data: {
        title: generated.title,
        order: 0,
        moduleId: dbModule.id,
      },
    });

    for (let qi = 0; qi < generated.questions.length; qi++) {
      const q = generated.questions[qi];
      await db.question.create({
        data: {
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: qi,
          quizId: dbQuiz.id,
        },
      });
    }

    await db.learningSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETE", courseId: course.id },
    });

    await db.enrollment.create({
      data: { userId, courseId: course.id },
    });

    return course.id;
  } catch (error) {
    await db.learningSession.update({
      where: { id: sessionId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
