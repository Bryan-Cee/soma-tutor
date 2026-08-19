import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import type { UserModel } from "@/generated/prisma/models/User";

export async function getAuthUser(): Promise<UserModel | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return user ?? syncClerkUser();
}

export async function requireAuth(): Promise<UserModel> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: Role): Promise<UserModel> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Requires ${role} role`);
  }
  return user;
}

export async function syncClerkUser(): Promise<UserModel | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("The authenticated Clerk user has no email address");
  }

  const metadataRole = clerkUser.publicMetadata?.role;
  const role: Role = metadataRole === "TEACHER" ? "TEACHER" : "STUDENT";
  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name,
      role,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      role,
    },
  });
}
