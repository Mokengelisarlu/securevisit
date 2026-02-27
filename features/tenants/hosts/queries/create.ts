// "use server";

// import { db } from "@/db/tenants/";
// import { departments } from "@/db/schema";
// import { revalidatePath } from "next/cache";

// export async function createDepartment(name: string) {
//   const dept = await db
//     .insert(departments)
//     .values({ name })
//     .returning();

//   // optionnel: revalidate une page
//   revalidatePath("/departments");

//   return dept[0];
// }
