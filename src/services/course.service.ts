import { db } from "@/lib/db";
import {
  courseOutlineSchema,
  learningPreferencesSchema,
  type CourseOutline,
  type LearningPreferences,
} from "@/types/generation";
import {
  generateCourseOutline,
  generateLessonContent,
  generateModuleQuiz,
  generateStandaloneLesson,
  generateStandaloneQuiz,
} from "@/services/generation.service";

type GenerationContext = {
  courseId: string;
  sessionId: string;
  prefs: LearningPreferences;
};

async function runGenerationStep<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}: ${detail}`, { cause: error });
  }
}

async function updateGenerationProgress(
  sessionId: string,
  generationProgress: number,
  generationMessage: string
): Promise<void> {
  await db.learningSession.update({
    where: { id: sessionId },
    data: {
      generationProgress,
      generationMessage,
    },
  });
}

async function populateFullCourse({
  courseId,
  sessionId,
  prefs,
}: GenerationContext): Promise<void> {
  const outline = await getOrCreateCourseOutline(sessionId, courseId, prefs);

  const totalUnits = Math.max(
    1,
    outline.modules.reduce(
      (sum, module) => sum + module.lessons.length + 1,
      0
    )
  );
  let completedUnits = 0;

  for (let moduleIndex = 0; moduleIndex < outline.modules.length; moduleIndex++) {
    const moduleOutline = outline.modules[moduleIndex];
    const courseModule = await db.module.upsert({
      where: {
        courseId_order: {
          courseId,
          order: moduleIndex,
        },
      },
      update: {
        title: moduleOutline.title,
        description: moduleOutline.description,
      },
      create: {
        title: moduleOutline.title,
        description: moduleOutline.description,
        order: moduleIndex,
        courseId,
      },
    });

    for (
      let lessonIndex = 0;
      lessonIndex < moduleOutline.lessons.length;
      lessonIndex++
    ) {
      const lessonOutline = moduleOutline.lessons[lessonIndex];
      const existingLesson = await db.lesson.findUnique({
        where: {
          moduleId_order: {
            moduleId: courseModule.id,
            order: lessonIndex,
          },
        },
        select: { content: true },
      });

      if (existingLesson?.content.trim()) {
        completedUnits++;
        continue;
      }

      await updateGenerationProgress(
        sessionId,
        15 + Math.round((completedUnits / totalUnits) * 80),
        `Writing "${lessonOutline.title}"`
      );

      const generatedLesson = await runGenerationStep(
        `Lesson "${lessonOutline.title}" failed`,
        () =>
          generateLessonContent(
            lessonOutline.title,
            lessonOutline.description,
            prefs.topic,
            prefs
          )
      );

      await db.lesson.upsert({
        where: {
          moduleId_order: {
            moduleId: courseModule.id,
            order: lessonIndex,
          },
        },
        update: {
          title: generatedLesson.title,
          content: generatedLesson.content,
          sourceLinks: generatedLesson.sourceLinks,
        },
        create: {
          title: generatedLesson.title,
          content: generatedLesson.content,
          order: lessonIndex,
          sourceLinks: generatedLesson.sourceLinks,
          moduleId: courseModule.id,
        },
      });
      completedUnits++;
    }

    const existingQuiz = await db.quiz.findUnique({
      where: {
        moduleId_order: {
          moduleId: courseModule.id,
          order: 0,
        },
      },
      select: {
        _count: { select: { questions: true } },
      },
    });

    if (existingQuiz && existingQuiz._count.questions > 0) {
      completedUnits++;
      continue;
    }

    await updateGenerationProgress(
      sessionId,
      15 + Math.round((completedUnits / totalUnits) * 80),
      `Creating the knowledge check for "${moduleOutline.title}"`
    );
    const generatedQuiz = await runGenerationStep(
      `Quiz for "${moduleOutline.title}" failed`,
      () =>
        generateModuleQuiz(
          moduleOutline.title,
          moduleOutline.lessons.map((lesson) => lesson.title),
          prefs.topic,
          prefs
        )
    );

    const questions = generatedQuiz.questions.map(
      (question, questionIndex) => ({
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        order: questionIndex,
      })
    );

    await db.quiz.upsert({
      where: {
        moduleId_order: {
          moduleId: courseModule.id,
          order: 0,
        },
      },
      update: {
        title: generatedQuiz.title,
        questions: {
          deleteMany: {},
          create: questions,
        },
      },
      create: {
        title: generatedQuiz.title,
        order: 0,
        moduleId: courseModule.id,
        questions: {
          create: questions,
        },
      },
    });
    completedUnits++;
  }
}

async function getOrCreateCourseOutline(
  sessionId: string,
  courseId: string,
  prefs: LearningPreferences
): Promise<CourseOutline> {
  const session = await db.learningSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { generationPlan: true },
  });

  if (session.generationPlan) {
    return courseOutlineSchema.parse(session.generationPlan);
  }

  await updateGenerationProgress(
    sessionId,
    8,
    "Planning the course map and learning sequence"
  );
  const outline = await runGenerationStep("Course outline failed", () =>
    generateCourseOutline(prefs)
  );

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: {
        title: outline.title,
        description: outline.description,
        sourceLinks: outline.sourceLinks,
      },
    }),
    db.learningSession.update({
      where: { id: sessionId },
      data: { generationPlan: outline },
    }),
  ]);

  return outline;
}

async function populateStandaloneLesson({
  courseId,
  sessionId,
  prefs,
}: GenerationContext): Promise<void> {
  const existingModule = await db.module.findUnique({
    where: {
      courseId_order: {
        courseId,
        order: 0,
      },
    },
    include: {
      lessons: {
        where: { order: 0 },
        select: { content: true },
        take: 1,
      },
    },
  });

  if (existingModule?.lessons[0]?.content.trim()) {
    await updateGenerationProgress(sessionId, 90, "Lesson content is ready");
    return;
  }

  await updateGenerationProgress(
    sessionId,
    15,
    "Researching examples and shaping your lesson"
  );
  const generated = await runGenerationStep("Standalone lesson failed", () =>
    generateStandaloneLesson(prefs)
  );

  await updateGenerationProgress(
    sessionId,
    85,
    "Organizing the lesson and its sources"
  );
  const courseModule = await db.module.upsert({
    where: {
      courseId_order: {
          courseId,
          order: 0,
      },
    },
    update: {
      title: generated.title,
      description: `A guided lesson on ${prefs.topic}`,
    },
    create: {
      title: generated.title,
      description: `A guided lesson on ${prefs.topic}`,
      order: 0,
      courseId,
    },
  });

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: {
        title: generated.title,
        description: `A guided lesson on ${prefs.topic}`,
        sourceLinks: generated.sourceLinks,
      },
    }),
    db.lesson.upsert({
      where: {
        moduleId_order: {
          moduleId: courseModule.id,
          order: 0,
        },
      },
      update: {
        title: generated.title,
        content: generated.content,
        sourceLinks: generated.sourceLinks,
      },
      create: {
        title: generated.title,
        content: generated.content,
        order: 0,
        sourceLinks: generated.sourceLinks,
        moduleId: courseModule.id,
      },
    }),
  ]);
}

async function populateStandaloneQuiz({
  courseId,
  sessionId,
  prefs,
}: GenerationContext): Promise<void> {
  const existingQuiz = await db.quiz.findFirst({
    where: {
      order: 0,
      module: {
        courseId,
        order: 0,
      },
    },
    select: {
      _count: { select: { questions: true } },
    },
  });

  if (existingQuiz && existingQuiz._count.questions > 0) {
    await updateGenerationProgress(sessionId, 90, "Quiz questions are ready");
    return;
  }

  await updateGenerationProgress(
    sessionId,
    15,
    "Choosing useful questions for your level"
  );
  const generated = await runGenerationStep("Standalone quiz failed", () =>
    generateStandaloneQuiz(prefs)
  );

  await updateGenerationProgress(
    sessionId,
    85,
    "Adding answers and explanations"
  );
  const courseModule = await db.module.upsert({
    where: {
      courseId_order: {
      courseId,
      order: 0,
      },
    },
    update: {
      title: `${prefs.topic} Quiz`,
      description: `A focused quiz on ${prefs.topic}`,
    },
    create: {
      title: `${prefs.topic} Quiz`,
      description: `A focused quiz on ${prefs.topic}`,
      order: 0,
      courseId,
    },
  });

  const questions = generated.questions.map((question, questionIndex) => ({
    type: question.type,
    prompt: question.prompt,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    order: questionIndex,
  }));

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: {
        title: `Quiz: ${prefs.topic}`,
        description: `A focused quiz on ${prefs.topic}`,
      },
    }),
    db.quiz.upsert({
      where: {
        moduleId_order: {
          moduleId: courseModule.id,
          order: 0,
        },
      },
      update: {
        title: generated.title,
        questions: {
          deleteMany: {},
          create: questions,
        },
      },
      create: {
        title: generated.title,
        order: 0,
        moduleId: courseModule.id,
        questions: {
          create: questions,
        },
      },
    }),
  ]);
}

export async function generateCourseForSession(
  sessionId: string
): Promise<string> {
  const session = await db.learningSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { course: true },
  });

  if (!session.course) {
    throw new Error(`Learning session ${sessionId} has no course`);
  }

  if (
    session.status === "COMPLETE" &&
    session.course.status === "PUBLISHED"
  ) {
    return session.course.id;
  }

  const prefs = learningPreferencesSchema.parse(session.preferences);
  const startedAt = session.startedAt ?? new Date();

  await db.$transaction([
    db.course.update({
      where: { id: session.course.id },
      data: {
        status: "GENERATING",
      },
    }),
    db.learningSession.update({
      where: { id: session.id },
      data: {
        status: "GENERATING",
        generationProgress: Math.max(session.generationProgress, 2),
        generationMessage: "Gathering the right material for your learning path",
        errorMessage: null,
        startedAt,
        completedAt: null,
      },
    }),
  ]);

  const context: GenerationContext = {
    courseId: session.course.id,
    sessionId: session.id,
    prefs,
  };

  switch (session.generationMode) {
    case "FULL_COURSE":
      await populateFullCourse(context);
      break;
    case "LESSON":
      await populateStandaloneLesson(context);
      break;
    case "QUIZ":
      await populateStandaloneQuiz(context);
      break;
  }

  await updateGenerationProgress(
    session.id,
    97,
    "Polishing the final details"
  );

  await db.$transaction([
    db.course.update({
      where: { id: session.course.id },
      data: { status: "PUBLISHED" },
    }),
    db.learningSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETE",
        generationProgress: 100,
        generationMessage: "Your learning path is ready",
        errorMessage: null,
        completedAt: new Date(),
      },
    }),
  ]);

  return session.course.id;
}
