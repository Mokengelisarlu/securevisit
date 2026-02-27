"use server";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { master_db } from "@/db/master";
import { users } from "@/db/master/schema";

export async function syncUser() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Utilisateur non connecté.");
  }

  const exist = await master_db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!exist) {
    await master_db.insert(users).values({
      id: user.id,
      role: "Tenant", // ou: user.publicMetadata.role
      nom: user.firstName ?? "",
      email: user.emailAddresses[0].emailAddress,
    });
  }

  return { ok: true };
}
