import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } =
      event.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || null;
    const role = (public_metadata?.role as Role) ?? "STUDENT";

    await db.user.upsert({
      where: { clerkId: id },
      update: { email, name, role },
      create: { clerkId: id, email, name, role },
    });
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    if (id) {
      await db.user.delete({ where: { clerkId: id } }).catch(() => {
        // User may not exist in our DB yet
      });
    }
  }

  return NextResponse.json({ received: true });
}
