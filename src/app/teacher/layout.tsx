import { AppNav } from "@/components/layout/app-nav";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
