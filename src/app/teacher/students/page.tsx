import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StudentsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user || user.role !== "TEACHER") redirect("/dashboard");

  const courses = await db.course.findMany({
    where: { creatorId: user.id },
    include: {
      enrollments: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const studentMap = new Map<
    string,
    { id: string; name: string | null; email: string; courseCount: number }
  >();

  for (const course of courses) {
    for (const enrollment of course.enrollments) {
      const existing = studentMap.get(enrollment.user.id);
      if (existing) {
        existing.courseCount++;
      } else {
        studentMap.set(enrollment.user.id, {
          ...enrollment.user,
          courseCount: 1,
        });
      }
    }
  }

  const students = Array.from(studentMap.values());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeading
        eyebrow="Classroom"
        title="Your students"
        description={`${students.length} student${students.length === 1 ? "" : "s"} enrolled across your courses.`}
      />

      {students.length === 0 ? (
        <Card className="mt-10 border-2 border-dashed bg-card/70 py-14 text-center">
          <CardContent className="mx-auto flex max-w-md flex-col items-center">
            <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <Users className="size-7" />
            </span>
            <CardTitle className="text-xl">No students yet</CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
            Students will appear here once they enrol in your courses.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-10">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                          <GraduationCap className="size-5" />
                        </span>
                        <span className="font-semibold">
                          {student.name ?? "Unnamed student"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                    {student.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        <BookOpen className="size-3.5" />
                        {student.courseCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
              ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
