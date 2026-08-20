"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Globe2,
  LayoutDashboard,
  PlusCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/learn/onboarding", label: "Learn", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/courses", label: "Explore", icon: <Globe2 className="h-4 w-4" /> },
];

const teacherNav: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/teacher/create", label: "Create Course", icon: <PlusCircle className="h-4 w-4" /> },
  { href: "/teacher/students", label: "Students", icon: <Users className="h-4 w-4" /> },
  { href: "/courses", label: "Explore", icon: <Globe2 className="h-4 w-4" /> },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string) ?? "STUDENT";
  const isTeacher = role === "TEACHER";
  const navItems = isTeacher ? teacherNav : studentNav;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5 lg:gap-8">
          <Brand />
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "text-muted-foreground shadow-none",
                  pathname === item.href && "text-secondary-foreground"
                )}
              >
                <Link href={item.href}>
                  {item.icon}
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Teacher
            </Badge>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-9 ring-2 ring-border",
              },
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 border-t px-3 py-2 md:hidden">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            size="sm"
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="flex-1 shadow-none"
          >
            <Link href={item.href}>
              {item.icon}
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
