"use server";

import { getTenantDbBySlug } from "@/db/tenants";
import { departments, hosts, visitors, users, services, visitorTypes, visits, devices, settings, vehicles, authorizedUsers, businessSettings } from "@/db/tenants/schema";
import { and, gte, lte, eq, between, desc, or, ilike, asc, isNotNull, inArray } from "drizzle-orm";
import { format, addMinutes } from "date-fns";
import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
import { verifyTenantOwnership, requireRole } from "../server/authorization";
import { withRetry } from "@/lib/db-retry";
import { randomBytes } from "crypto";
import { auth } from "@clerk/nextjs/server";

/* =======================================
   USER SESSION & PROFILE
======================================= */

export async function getCurrentUser(tenantSlug: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

/* =======================================
   DEVICE PAIRING & SECURITY
======================================= */

/**
 * Verify if a device token is valid and paired for this tenant
 */
export async function verifyDeviceToken(tenantSlug: string, deviceToken: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  const device = await db.query.devices.findFirst({
    where: and(eq(devices.deviceToken, deviceToken), eq(devices.isPaired, 1)),
  });

  if (!device) {
    throw new Error("Périphérique non autorisé ou non appairé");
  }

  // Update last active
  await db.update(devices).set({ lastActiveAt: new Date() }).where(eq(devices.id, device.id));

  return device;
}

/**
 * [PUBLIC/SECURE] Heartbeat ping — keeps lastActiveAt fresh so the admin
 * dashboard can show online/offline status. No-op if the token is invalid.
 */
export async function pingDevice(tenantSlug: string, deviceToken: string) {
  try {
    await verifyDeviceToken(tenantSlug, deviceToken);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * [PUBLIC] Generate a pairing code for a new kiosk
 */
export async function generatePairingCode(tenantSlug: string, deviceId: string) {
  const db = await getTenantDbBySlug(tenantSlug);

  // Generate a 6-character uppercase code
  const pairingCode = randomBytes(3).toString("hex").toUpperCase();
  const expiresAt = addMinutes(new Date(), 10); // Expires in 10 minutes

  // Idempotency: reuse existing device row for the same physical device.
  const existingDevice = await db.query.devices.findFirst({
    where: eq(devices.deviceId, deviceId),
  });

  if (existingDevice) {
    const [updatedDevice] = await db.update(devices).set({
      pairingCode,
      pairingCodeExpiresAt: expiresAt,
      isPaired: 0,
      deviceToken: null,
      pairedAt: null,
      lastActiveAt: null,
    }).where(eq(devices.id, existingDevice.id)).returning();

    return {
      deviceId: updatedDevice.id,
      pairingCode,
    };
  }

  const [device] = await db.insert(devices).values({
    deviceId,
    pairingCode,
    pairingCodeExpiresAt: expiresAt,
    isPaired: 0,
    deviceToken: null,
    pairedAt: null,
    lastActiveAt: null,
  }).returning();

  return {
    deviceId: device.id,
    pairingCode,
  };
}


/**
 * [PUBLIC] Generate a pairing code for an EXISTING device (reconnect flow)
 * Updates the existing device record with a new pairing code instead of creating a new one
 * Accepts any existing device regardless of pairing state
 */
export async function generateReconnectPairingCode(tenantSlug: string, deviceId: string) {
  console.log('[generateReconnectPairingCode] tenantSlug:', tenantSlug, 'deviceId:', deviceId);
  const db = await getTenantDbBySlug(tenantSlug);

  // Check if device exists at all (any pairing state)
  const existingDevice = await db.query.devices.findFirst({
    where: eq(devices.id, deviceId),
  });

  console.log('[generateReconnectPairingCode] existingDevice found:', existingDevice ? 'yes' : 'no');
  if (existingDevice) {
    console.log('[generateReconnectPairingCode] existingDevice:', {
      id: existingDevice.id,
      isPaired: existingDevice.isPaired,
      deviceToken: existingDevice.deviceToken ? 'yes' : 'no',
      name: existingDevice.name,
      pairingCode: existingDevice.pairingCode
    });
  }

  if (!existingDevice) {
    console.log('[generateReconnectPairingCode] FAIL: device not found in database');
    throw new Error('Device not found');
  }

  // Generate new pairing code
  const pairingCode = randomBytes(3).toString("hex").toUpperCase();
  const expiresAt = addMinutes(new Date(), 10);

  // Update the EXISTING device with new pairing code, reset pairing state
  await db.update(devices).set({
    pairingCode,
    pairingCodeExpiresAt: expiresAt,
    isPaired: 0,
    deviceToken: null,
    pairedAt: null,
  }).where(eq(devices.id, deviceId));

  return {
    deviceId,
    pairingCode,
  };
}

/**
 * [PUBLIC] Check if a device has been paired yet
 * This is polled by the kiosk after showing the pairing code
 */
export async function checkPairingStatus(tenantSlug: string, deviceId: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  const device = await db.query.devices.findFirst({
    // Support checking by either the DB row id or the stable physical device id
    where: or(eq(devices.id, deviceId), eq(devices.deviceId, deviceId)),
  });

  if (device?.isPaired === 1 && device.deviceToken) {
    return { isPaired: true, deviceToken: device.deviceToken };
  }

  return { isPaired: false };
}

/**
 * [ADMIN] Pair a device using the code generated by the kiosk
 */
export async function pairDevice(
  tenantSlug: string,
  pairingCode: string,
  deviceName: string,
  location?: string,
  description?: string
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const device = await db.query.devices.findFirst({
    where: and(
      eq(devices.pairingCode, pairingCode.toUpperCase()),
      eq(devices.isPaired, 0),
      gte(devices.pairingCodeExpiresAt, new Date())
    ),
  });

  if (!device) {
    throw new Error("Code d'appairage invalide ou expiré");
  }

  const deviceToken = randomBytes(32).toString("hex");

  const [updatedDevice] = await db.update(devices).set({
    name: deviceName,
    location: location || null,
    description: description || null,
    deviceToken,
    isPaired: 1,
    pairedAt: new Date(),
    lastActiveAt: new Date(),
    pairingCode: null, // Clear the code
    pairingCodeExpiresAt: null,
  }).where(eq(devices.id, device.id)).returning();

  return updatedDevice;
}

/**
 * [ADMIN] Update device metadata
 */
export async function updateDevice(
  tenantSlug: string,
  deviceId: string,
  data: { name?: string; location?: string; description?: string }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [updated] = await db
    .update(devices)
    .set({
      ...data,
    })
    .where(eq(devices.id, deviceId))
    .returning();

  return updated;
}

/**
 * [ADMIN] Reconnect an existing device record to a new physical device
 * using a pairing code generated by that new device.
 */
export async function reconnectDevice(
  tenantSlug: string,
  deviceId: string,
  pairingCode: string
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  // 1. Find the transient record created by the new device
  const transientDevice = await db.query.devices.findFirst({
    where: and(
      eq(devices.pairingCode, pairingCode.toUpperCase()),
      eq(devices.isPaired, 0),
      gte(devices.pairingCodeExpiresAt, new Date())
    ),
  });

  if (!transientDevice) {
    throw new Error("Code d'appairage invalide ou expiré");
  }

  // 2. Generate a new token for the target physical device
  const deviceToken = randomBytes(32).toString("hex");

  // 3. Update the EXISTING record with the new authorization
  const [updatedDevice] = await db
    .update(devices)
    .set({
      deviceToken,
      isPaired: 1,
      pairedAt: new Date(),
      lastActiveAt: new Date(),
      pairingCode: null,
      pairingCodeExpiresAt: null,
    })
    .where(eq(devices.id, deviceId))
    .returning();

  // 4. Update the transient record so the polling kiosk sees success
  await db
    .update(devices)
    .set({
      deviceToken,
      isPaired: 1,
      pairedAt: new Date(),
      lastActiveAt: new Date(),
      pairingCode: null,
      pairingCodeExpiresAt: null,
    })
    .where(eq(devices.id, transientDevice.id));

  return updatedDevice;
}

/**
 * [ADMIN] Get all devices for this tenant
 */
export async function getDevices(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  // Only return paired devices — pending/waiting entries are transient
  return await db.query.devices.findMany({
    where: eq(devices.isPaired, 1),
    orderBy: [desc(devices.createdAt)],
  });
}

/**
 * [ADMIN] Delete a device
 */
export async function deleteDevice(tenantSlug: string, deviceId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  await db.delete(devices).where(eq(devices.id, deviceId));
  return { success: true };
}

/* =======================================
   DEPARTMENTS
======================================= */

export async function createDepartment(
  tenantSlug: string,
  name: string,
  abbreviation?: string
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [dept] = await db
    .insert(departments)
    .values({
      name,
      abbreviation: abbreviation || null
    })
    .returning();

  return dept;
}

export async function getDepartments(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.departments.findMany();
}

/**
 * [PUBLIC/SECURE] Get departments for Kiosk
 */
export async function getPublicDepartments(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.departments.findMany();
}

export async function deleteDepartment(tenantSlug: string, departmentId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.delete(departments).where(eq(departments.id, departmentId));
}

export async function updateDepartment(
  tenantSlug: string,
  departmentId: string,
  name: string,
  abbreviation?: string
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [dept] = await db
    .update(departments)
    .set({
      name,
      abbreviation: abbreviation || null
    })
    .where(eq(departments.id, departmentId))
    .returning();

  return dept;
}

/* =======================================
   SERVICES CRUD
 ======================================= */

export async function createService(
  tenantSlug: string,
  data: { name: string; description?: string; departmentId?: string }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [service] = await db
    .insert(services)
    .values({
      name: data.name,
      description: data.description || null,
      departmentId: data.departmentId || null,
    })
    .returning();

  return service;
}

export async function getServices(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.services.findMany({
    with: {
      department: true,
    },
  });
}

/**
 * [PUBLIC/SECURE] Get services for Kiosk
 */
export async function getPublicServices(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.services.findMany();
}

export async function deleteService(tenantSlug: string, serviceId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.delete(services).where(eq(services.id, serviceId));
}

export async function updateService(
  tenantSlug: string,
  serviceId: string,
  data: { name: string; description?: string; departmentId?: string }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [service] = await db
    .update(services)
    .set({
      name: data.name,
      description: data.description || null,
      departmentId: data.departmentId || null,
    })
    .where(eq(services.id, serviceId))
    .returning();

  return service;
}

/* =======================================
   VISITOR TYPES
======================================= */

export async function createVisitorType(
  tenantSlug: string,
  data: { name: string; description?: string }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [vt] = await db
    .insert(visitorTypes)
    .values({
      name: data.name,
      description: data.description || null,
    })
    .returning();

  return vt;
}

export async function getVisitorTypes(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitorTypes.findMany({
    orderBy: (vt: any, { desc }: any) => [desc(vt.createdAt)],
  });
}

/**
 * [PUBLIC/SECURE] Get visitor types for Kiosk
 */
export async function getPublicVisitorTypes(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitorTypes.findMany({
    orderBy: [desc(visitorTypes.createdAt)],
  });
}

export async function updateVisitorType(
  tenantSlug: string,
  id: string,
  data: { name: string; description?: string }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [vt] = await db
    .update(visitorTypes)
    .set({
      name: data.name,
      description: data.description || null,
    })
    .where(eq(visitorTypes.id, id))
    .returning();

  return vt;
}

export async function deleteVisitorType(tenantSlug: string, id: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.delete(visitorTypes).where(eq(visitorTypes.id, id));
}

/* =======================================
   HOSTS (Internal Employees)
======================================= */

export async function createHost(
  tenantSlug: string,
  {
    firstName,
    lastName,
    middleName,
    photoUrl,
    email,
    phone,
    departmentId,
  }: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
    photoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    departmentId: string;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [host] = await db
    .insert(hosts)
    .values({
      firstName,
      lastName,
      middleName,
      photoUrl,
      email,
      phone,
      departmentId,
    })
    .returning();

  return host;
}

export async function getHosts(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.hosts.findMany({
    with: {
      department: true,
    },
  });
}

/**
 * [PUBLIC/SECURE] Get hosts for Kiosk
 */
export async function getPublicHosts(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.hosts.findMany({
    where: eq(hosts.isActive, 1),
  });
}

export async function deleteHost(tenantSlug: string, hostId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.delete(hosts).where(eq(hosts.id, hostId));
}

export async function updateHost(
  tenantSlug: string,
  hostId: string,
  {
    firstName,
    lastName,
    middleName,
    photoUrl,
    email,
    phone,
    departmentId,
  }: {
    firstName?: string;
    lastName?: string;
    middleName?: string | null;
    photoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    departmentId?: string;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [host] = await db
    .update(hosts)
    .set({ firstName, lastName, middleName, photoUrl, email, phone, departmentId })
    .where(eq(hosts.id, hostId))
    .returning();

  return host;
}

/* =======================================
   VISITORS
======================================= */

export async function createVisitor(
  tenantSlug: string,
  {
    firstName,
    lastName,
    phone,
    company,
    photoUrl,
    visitorTypeId,
  }: {
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    photoUrl?: string;
    visitorTypeId?: string;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [visitor] = await db
    .insert(visitors)
    .values({
      firstName,
      lastName,
      phone,
      company,
      photoUrl,
      visitorTypeId: visitorTypeId || null,
    })
    .returning();

  return visitor;
}

export async function getVisitors(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitors.findMany({
    with: {
      type: true,
    },
  });
}

export async function deleteVisitor(tenantSlug: string, visitorId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.delete(visitors).where(eq(visitors.id, visitorId));
}

export async function updateVisitor(
  tenantSlug: string,
  visitorId: string,
  {
    firstName,
    lastName,
    phone,
    company,
    photoUrl,
    visitorTypeId,
  }: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    company?: string | null;
    photoUrl?: string | null;
    visitorTypeId?: string | null;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [visitor] = await db
    .update(visitors)
    .set({
      firstName,
      lastName,
      phone,
      company,
      photoUrl,
      visitorTypeId: visitorTypeId !== undefined ? visitorTypeId : undefined
    })
    .where(eq(visitors.id, visitorId))
    .returning();

  return visitor;
}

/* =======================================
   VEHICLES
======================================= */

export async function createVehicle(
  tenantSlug: string,
  data: {
    plateNumber: string;
    type: "CAR" | "TRUCK" | "MOTORCYCLE" | "OTHER";
    brand?: string;
    color?: string;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [vehicle] = await db
    .insert(vehicles)
    .values({
      plateNumber: data.plateNumber.toUpperCase().trim(),
      type: data.type,
      brand: data.brand || null,
      color: data.color || null,
    })
    .returning();

  return vehicle;
}

export async function getVehicles(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.vehicles.findMany({
    orderBy: (v: any, { desc }: any) => [desc(v.createdAt)],
  });
}

/**
 * Find or create a vehicle by plate number
 */
async function getOrCreateVehicleInternal(
  tx: any,
  data: {
    plateNumber: string;
    type: "CAR" | "TRUCK" | "MOTORCYCLE" | "OTHER";
    brand?: string;
    color?: string;
  }
) {
  // Try to find existing vehicle by plate number
  const existing = await tx.query.vehicles.findFirst({
    where: eq(vehicles.plateNumber, data.plateNumber.toUpperCase().trim()),
  });

  if (existing) {
    return existing;
  }

  const [newVehicle] = await tx
    .insert(vehicles)
    .values({
      plateNumber: data.plateNumber.toUpperCase().trim(),
      type: data.type,
      brand: data.brand || null,
      color: data.color || null,
    })
    .returning();

  return newVehicle;
}


/* =======================================
   VISITS
======================================= */

export async function getVisits(
  tenantSlug: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: "IN" | "OUT" | "CANCELLED" | "SCHEDULED";
    visitorId?: string;
    vehicleId?: string;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const whereConditions = [];

  if (filters?.startDate || filters?.endDate) {
    if (filters?.startDate && filters?.endDate) {
      whereConditions.push(and(gte(visits.visitDate, filters.startDate), lte(visits.visitDate, filters.endDate)));
    } else if (filters?.startDate) {
      whereConditions.push(gte(visits.visitDate, filters.startDate));
    } else if (filters?.endDate) {
      whereConditions.push(lte(visits.visitDate, filters.endDate));
    }
  }

  if (filters?.status) {
    whereConditions.push(eq(visits.status, filters.status));
  }

  if (filters?.visitorId) {
    whereConditions.push(eq(visits.visitorId, filters.visitorId));
  }

  if (filters?.vehicleId) {
    whereConditions.push(eq(visits.vehicleId, filters.vehicleId));
  }

  return await db.query.visits.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    with: {
      visitor: true,
      host: true,
      department: true,
      service: true,
      vehicle: true,
    },
    orderBy: (v: any, { desc }: any) => [desc(v.visitDate)],
  });
}

export async function createVisit(
  tenantSlug: string,
  data: Parameters<typeof createVisitInternal>[1]
) {
  await verifyTenantOwnership(tenantSlug);
  return await createVisitInternal(tenantSlug, { ...data, status: "IN" });
}

export async function createScheduledVisit(
  tenantSlug: string,
  data: Parameters<typeof createVisitInternal>[1] & { visitDate: Date }
) {
  await verifyTenantOwnership(tenantSlug);
  return await createVisitInternal(tenantSlug, { ...data, status: "SCHEDULED" });
}

/**
 * [PUBLIC/SECURE] Create visit for Kiosk
 */
export async function createPublicVisit(
  tenantSlug: string,
  deviceToken: string,
  data: Parameters<typeof createVisit>[1] & { signatureData?: string }
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  return await createVisitInternal(tenantSlug, {
    ...data,
    policyAcceptedAt: data.signatureData ? new Date() : undefined
  });
}

async function createVisitInternal(
  tenantSlug: string,
  data: {
    visitorId?: string;
    newVisitor?: {
      firstName: string;
      lastName: string;
      phone?: string;
      company?: string;
      visitorTypeId?: string;
    };
    hostId?: string;
    departmentId?: string;
    serviceId?: string;
    purpose?: string;
    status?: "IN" | "SCHEDULED";
    visitDate?: Date;
    signatureData?: string;
    policyAcceptedAt?: Date;

    // Vehicle info
    vehicle?: {
      plateNumber: string;
      type: "CAR" | "TRUCK" | "MOTORCYCLE" | "OTHER";
      brand?: string;
      color?: string;
    };
    passengerCount?: number;
    visitorPhotoUrl?: string;
    vehiclePhotoUrl?: string;
    visitType?: "WALK_IN" | "PRE_REGISTERED";
  }
) {
  const db = await getTenantDbBySlug(tenantSlug);

  try {
    return await db.transaction(async (tx: any) => {
      let finalVisitorId = data.visitorId || null;

      if (data.newVisitor && !finalVisitorId) {
        const [newVisitor] = await tx
          .insert(visitors)
          .values({
            firstName: data.newVisitor.firstName,
            lastName: data.newVisitor.lastName,
            phone: data.newVisitor.phone || null,
            company: data.newVisitor.company || null,
            visitorTypeId: data.newVisitor.visitorTypeId || null,
          })
          .returning();
        finalVisitorId = newVisitor.id;
      }

      if (!finalVisitorId) {
        throw new Error("Visitor ID or new visitor data is required");
      }

      // --- VEHICLE HANDLING ---
      let vehicleId = null;
      if (data.vehicle) {
        const v = await getOrCreateVehicleInternal(tx, data.vehicle);
        vehicleId = v.id;
      }


      // --- CHECK IF VISITOR IS ALREADY ON-SITE (STATUS IN) ---
      const activeVisit = await tx.query.visits.findFirst({
        where: and(
          eq(visits.visitorId, finalVisitorId),
          eq(visits.status, "IN")
        )
      });

      if (activeVisit) {
        throw new Error("Ce visiteur est déjà présent dans l'établissement (Déjà 'IN').");
      }

      const now = new Date();
      const dateStr = format(now, "yyyyMMdd");

      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const todayVisits = await tx.query.visits.findMany({
        where: and(gte(visits.visitDate, startOfDay), lte(visits.visitDate, endOfDay))
      });

      const sequence = (todayVisits.length + 1).toString().padStart(4, "0");
      const visitNumber = `VIS-${dateStr}-${sequence}`;

      // --- CHECK FOR EXISTING SCHEDULED VISIT FOR THIS VISITOR TODAY ---
      if (data.status !== "SCHEDULED") {
        const existingScheduledVisit = await tx.query.visits.findFirst({
          where: and(
            eq(visits.visitorId, finalVisitorId),
            eq(visits.status, "SCHEDULED"),
            gte(visits.visitDate, startOfDay),
            lte(visits.visitDate, endOfDay)
          )
        });

        if (existingScheduledVisit) {
          const [updatedVisit] = await tx
            .update(visits)
            .set({
              status: "IN",
              checkInAt: new Date(),
              // Optionally update host/department/service if provided in the new check-in
              hostId: data.hostId || existingScheduledVisit.hostId,
              departmentId: data.departmentId || existingScheduledVisit.departmentId,
              serviceId: data.serviceId || existingScheduledVisit.serviceId,
              purpose: data.purpose || existingScheduledVisit.purpose,
              signatureData: data.signatureData || existingScheduledVisit.signatureData,
              policyAcceptedAt: data.policyAcceptedAt || existingScheduledVisit.policyAcceptedAt,
            })
            .where(eq(visits.id, existingScheduledVisit.id))
            .returning();

          return updatedVisit;
        }
      }

      const [newVisit] = await tx
        .insert(visits)
        .values({
          visitNumber,
          visitorId: finalVisitorId,
          hostId: data.hostId || null,
          departmentId: data.departmentId || null,
          serviceId: data.serviceId || null,
          purpose: data.purpose,
          status: data.status || "IN",
          checkInAt: data.status === "SCHEDULED" ? null : new Date(),
          visitDate: data.visitDate || new Date(),
          signatureData: data.signatureData || null,
          policyAcceptedAt: data.policyAcceptedAt || null,
          visitorPhotoUrl: data.visitorPhotoUrl || null,
          vehiclePhotoUrl: data.vehiclePhotoUrl || null,

          vehicleId: vehicleId,
          passengerCount: data.passengerCount || 0,
          visitType: data.visitType || "WALK_IN",
        })
        .returning();

      return newVisit;
    });
  } catch (error) {
    console.error("Internal createVisit failed:", error);
    throw error;
  }
}

export async function getScheduledVisits(tenantSlug: string, date?: Date) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await db.query.visits.findMany({
    where: and(
      eq(visits.status, "SCHEDULED"),
      gte(visits.visitDate, startOfDay),
      lte(visits.visitDate, endOfDay)
    ),
    with: {
      visitor: true,
      host: true,
      department: true,
      service: true,
    },
    orderBy: [asc(visits.visitDate)],
  });
}

export async function checkInScheduledVisit(tenantSlug: string, visitId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const [updated] = await db
    .update(visits)
    .set({
      status: "IN",
      checkInAt: new Date(),
    })
    .where(eq(visits.id, visitId))
    .returning();

  return updated;
}

export async function checkoutVisit(tenantSlug: string, visitId: string) {
  await verifyTenantOwnership(tenantSlug);
  return await checkoutVisitInternal(tenantSlug, visitId);
}

/**
 * [PUBLIC/SECURE] Checkout visit for Kiosk
 */
export async function checkoutPublicVisit(tenantSlug: string, deviceToken: string, visitId: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  return await checkoutVisitInternal(tenantSlug, visitId);
}

async function checkoutVisitInternal(tenantSlug: string, visitId: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  const now = new Date();

  const existingVisit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
  });

  if (!existingVisit) {
    throw new Error("Visite non trouvée");
  }

  const checkInAt = new Date(existingVisit.checkInAt as any);
  const durationMs = now.getTime() - checkInAt.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  const [updatedVisit] = await db
    .update(visits)
    .set({
      checkOutAt: now,
      status: "OUT",
      durationMinutes: durationMinutes,
    })
    .where(eq(visits.id, visitId))
    .returning();

  return updatedVisit;
}

/**
 * [PUBLIC/SECURE] Get on-site visitors for checkout lookup
 */
export async function getPublicOnSiteVisitors(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const onSite = await db.query.visits.findMany({
    where: eq(visits.status, "IN"),
    with: {
      visitor: true,
      host: true,
    },
    orderBy: [desc(visits.checkInAt)],
  });

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const arrivedToday = await db.query.visits.findMany({
    where: and(isNotNull(visits.checkInAt), gte(visits.checkInAt, startToday), lte(visits.checkInAt, endToday)),
    columns: { id: true },
  });

  const departedToday = await db.query.visits.findMany({
    where: and(isNotNull(visits.checkOutAt), gte(visits.checkOutAt, startToday), lte(visits.checkOutAt, endToday)),
    columns: { id: true },
  });

  return {
    visitors: onSite,
    stats: {
      onSite: onSite.length,
      arrivedToday: arrivedToday.length,
      departedToday: departedToday.length,
    },
  };
}

/**
 * [PUBLIC/SECURE] Get vehicles currently on-site
 */
export async function getPublicVehiclesOnSite(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const results = await db.query.visits.findMany({
    where: and(eq(visits.status, "IN"), isNotNull(visits.vehicleId)),
    with: {
      vehicle: true,
      visitor: true,
    },
    orderBy: [desc(visits.checkInAt)],
  });

  return results;
}

/**
 * [PUBLIC/SECURE] Get total persons currently on-site (Drivers + Passengers)
 */
export async function getPublicTotalPersonsOnSite(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const activeVisits = await db.query.visits.findMany({
    where: eq(visits.status, "IN"),
  });

  const visitorCount = activeVisits.length;
  const passengerCount = activeVisits.reduce((sum: number, v: any) => sum + (v.passengerCount || 0), 0);

  return {
    visitors: visitorCount,
    passengers: passengerCount,
    total: visitorCount + passengerCount,
  };
}


/**
 * [PUBLIC/SECURE] Search visitors by name or phone number for the kiosk.
 * Returns only matching records — never the full visitor list.
 * Requires at least 2 characters to prevent full-list enumeration.
 */
export async function searchPublicVisitors(
  tenantSlug: string,
  deviceToken: string,
  query: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);

  const normalizedQuery = query?.trim() ?? "";

  if (!normalizedQuery) {
    return [];
  }

  const db = await getTenantDbBySlug(tenantSlug);

  let results: any[];

  if (normalizedQuery.toLowerCase() === "all") {
    results = await db.query.visitors.findMany({
      with: { type: true },
      orderBy: [desc(visitors.createdAt)],
    });
    console.log("[searchPublicVisitors] q=all -> all visitors result:", JSON.stringify(results, null, 2));
  } else {
    if (normalizedQuery.length < 2) {
      return [];
    }

    const q = `%${normalizedQuery}%`;
    results = await db.query.visitors.findMany({
      where: or(
        ilike(visitors.firstName, q),
        ilike(visitors.lastName, q),
        ilike(visitors.phone, q)
      ),
      with: {
        type: true,
      },
      limit: 10,
    });
  }

  const visitorIds: string[] = results.map((r: { id: string }) => r.id);
  let onSiteIds = new Set<string>();
  if (visitorIds.length > 0) {
    const activeVisits = await db.query.visits.findMany({
      where: and(eq(visits.status, "IN"), inArray(visits.visitorId, visitorIds)),
    });
    activeVisits.forEach((v: { visitorId: string }) => onSiteIds.add(v.visitorId));
  }

  const mapped = (results as typeof results).map((v: (typeof results)[number]) => {
    const lastNameMasked = v.lastName ? v.lastName[0].toUpperCase() + "." : "";
    const phoneMasked = v.phone ? "••• " + v.phone.slice(-4) : null;

    return {
      id: v.id,
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      company: v.company,
      visitorTypeId: v.visitorTypeId,
      visitorTypeName: (v as any).type?.name ?? null,
      visitorPhotoUrl: v.photoUrl,
      lastNameMasked,
      phoneMasked,
      isOnSite: onSiteIds.has(v.id),
    };
  });

  console.log("[searchPublicVisitors] final mapped result:", JSON.stringify(mapped, null, 2));
  return mapped;
}

/**
 * [PUBLIC/SECURE] Get all visitors with their type, ordered by createdAt desc
 */
export async function getPublicVisitors(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  return await db.query.visitors.findMany({
    with: {
      type: true,
    },
    orderBy: [desc(visitors.createdAt)],
  });
}

/**
 * [PUBLIC/SECURE] Get all visitors with KPI stats for the kiosk device.
 * Returns KPI counts for the kiosk device:
 *  - onSite: visitors currently checked in (status IN)
 *  - outToday: visitors who checked out today
 *  - totalToday: visits checked in today
 */
export async function getPublicVisitorKpis(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const activeVisits = await db.query.visits.findMany({
    where: eq(visits.status, "IN"),
    columns: { visitorId: true },
  });
  const onSiteIds = new Set(activeVisits.map((v: { visitorId: string }) => v.visitorId));

  const arrivedToday = await db.query.visits.findMany({
    where: and(
      isNotNull(visits.checkInAt),
      gte(visits.checkInAt, startToday),
      lte(visits.checkInAt, endToday)
    ),
    columns: { id: true },
  });

  const departedToday = await db.query.visits.findMany({
    where: and(
      eq(visits.status, "OUT"),
      isNotNull(visits.checkOutAt),
      gte(visits.checkOutAt, startToday),
      lte(visits.checkOutAt, endToday)
    ),
    columns: { id: true },
  });

  return {
    onSite: onSiteIds.size,
    outToday: departedToday.length,
    totalToday: arrivedToday.length,
  };
}

/**
 * [PUBLIC/SECURE] Get single visitor by ID with type, plus an isOnSite boolean
 */
export async function getPublicVisitorById(
  tenantSlug: string,
  deviceToken: string,
  visitorId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const visitor = await db.query.visitors.findFirst({
    where: eq(visitors.id, visitorId),
    with: {
      type: true,
    },
  });

  if (!visitor) {
    throw new Error("Visitor not found");
  }

  const activeVisit = await db.query.visits.findFirst({
    where: and(eq(visits.visitorId, visitorId), eq(visits.status, "IN")),
  });

  return {
    id: visitor.id,
    firstName: visitor.firstName,
    lastName: visitor.lastName,
    phone: visitor.phone,
    company: visitor.company,
    visitorTypeId: visitor.visitorTypeId,
    visitorTypeName: (visitor as any).type?.name ?? null,
    photoUrl: visitor.photoUrl,
    isOnSite: !!activeVisit,
  };
}

/**
 * [PUBLIC/SECURE] Get single visit by ID with visitor, host, department, service, vehicle
 */
export async function getPublicVisitById(
  tenantSlug: string,
  deviceToken: string,
  visitId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const visit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
    with: {
      visitor: {
        with: {
          type: true,
        },
      },
      host: true,
      department: true,
      service: true,
      vehicle: true,
    },
  });

  if (!visit) {
    throw new Error("Visit not found");
  }

  return visit;
}

/**
 * [PUBLIC/SECURE] Get all visits for a specific visitor with relations, ordered by visitDate desc
 */
export async function getPublicVisitHistory(
  tenantSlug: string,
  deviceToken: string,
  visitorId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  return await db.query.visits.findMany({
    where: eq(visits.visitorId, visitorId),
    with: {
      visitor: true,
      host: true,
      department: true,
      service: true,
      vehicle: true,
    },
    orderBy: [desc(visits.visitDate)],
  });
}

/**
 * [PUBLIC/SECURE] Get recent visits across all visitors for dashboard
 */
export async function getPublicRecentVisits(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  return await db.query.visits.findMany({
    limit: 20,
    with: {
      visitor: true,
      host: true,
      department: true,
      service: true,
    },
    orderBy: [desc(visits.checkInAt)],
  });
}

async function computeDashboardStats(db: any) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Stats for Weekly Trend & Average
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const arrivedToday = await db.query.visits.findMany({
    where: and(isNotNull(visits.checkInAt), gte(visits.checkInAt, startToday), lte(visits.checkInAt, endToday)),
  });

  const onSite = await db.query.visits.findMany({
    where: eq(visits.status, "IN"),
  });

  const departedToday = await db.query.visits.findMany({
    where: and(eq(visits.status, "OUT"), isNotNull(visits.checkOutAt), gte(visits.checkOutAt, startToday), lte(visits.checkOutAt, endToday)),
  });

  const monthlyVisitsTotal = await db.query.visits.findMany({
    where: and(gte(visits.visitDate, startMonth), lte(visits.visitDate, endMonth)),
  });

  // Calculate Weekly Average & Trend
  const lastSevenDaysVisits = await db.query.visits.findMany({
    where: and(gte(visits.visitDate, sevenDaysAgo), lte(visits.visitDate, now)),
  });

  const weeklyTrend = [];
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayLabel = days[d.getDay()];
    const count = lastSevenDaysVisits.filter((v: any) =>
      v.visitDate && new Date(v.visitDate).toDateString() === d.toDateString()
    ).length;
    weeklyTrend.push({ day: dayLabel, count });
  }

  const weeklyAverage = Math.round(lastSevenDaysVisits.length / 7);

  const recentActivities = await db.query.visits.findMany({
    limit: 5,
    orderBy: [desc(visits.checkInAt)],
    with: {
      visitor: true,
      host: true,
    }
  });

  const vehiclesOnSite = await db.query.visits.findMany({
    where: and(eq(visits.status, "IN"), isNotNull(visits.vehicleId)),
  });

  return {
    arrivedToday: arrivedToday.length,
    onSite: onSite.length,
    departedToday: departedToday.length,
    monthlyVisits: monthlyVisitsTotal.length,
    weeklyAverage: weeklyAverage,
    weeklyTrend: weeklyTrend,
    vehiclesOnSite: vehiclesOnSite.length,
    visitsToday: arrivedToday.length + departedToday.length,
    recentActivities: recentActivities.map((v: any) => ({
      id: v.id,
      visitorName: `${v.visitor.firstName} ${v.visitor.lastName}`,
      hostName: v.host?.firstName ? `${v.host.firstName} ${v.host.lastName}` : "N/A",
      type: v.status === "IN" ? "CHECK_IN" : "CHECK_OUT",
      time: v.status === "IN" ? v.checkInAt : v.checkOutAt,
      visitorPhotoUrl: v.visitorPhotoUrl || v.visitor?.photoUrl || null,
    }))
  };
}

/**
 * [ADMIN] Dashboard stats for the tenant dashboard
 */
export async function getDashboardStats(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await computeDashboardStats(db);
}

/**
 * [PUBLIC/SECURE] Kiosk mini dashboard — KPI stats plus the visitors
 * currently on-site. Requires a valid paired device token.
 */
export async function getPublicDashboard(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const arrivedToday = await db.query.visits.findMany({
    where: and(isNotNull(visits.checkInAt), gte(visits.checkInAt, startToday), lte(visits.checkInAt, endToday)),
  });

  const departedToday = await db.query.visits.findMany({
    where: and(eq(visits.status, "OUT"), isNotNull(visits.checkOutAt), gte(visits.checkOutAt, startToday), lte(visits.checkOutAt, endToday)),
  });

  const onSite = await db.query.visits.findMany({
    where: eq(visits.status, "IN"),
  });

  return {
    arrivedToday: arrivedToday.length,
    departedToday: departedToday.length,
    onSite: onSite.length,
  };
}

/* =======================================
   USERS (Management)
======================================= */

export async function getTenantUsers(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const activeUsers = await db.query.users.findMany({
    orderBy: (u: any, { desc }: any) => [desc(u.createdAt)],
  });

  const authorized = await db.query.authorizedUsers.findMany({
    orderBy: (a: any, { desc }: any) => [desc(a.createdAt)],
  });

  // Return combined data structure
  return {
    active: activeUsers,
    pending: authorized.filter((a: any) => !activeUsers.some((u: any) => u.email.toLowerCase() === a.email.toLowerCase()))
  };
}

export async function authorizeUser(
  tenantSlug: string,
  email: string,
  role: "ROOT" | "ADMIN" | "SECURITY" | "RECEPTION",
  firstName: string = "",
  lastName: string = "",
  middleName?: string
) {
  await requireRole(tenantSlug, ["ROOT", "ADMIN"]);
  const db = await getTenantDbBySlug(tenantSlug);

  const [authorized] = await db
    .insert(authorizedUsers)
    .values({
      email: email.toLowerCase(),
      firstName,
      lastName,
      middleName: middleName || null,
      role,
    })
    .onConflictDoUpdate({
      target: authorizedUsers.email,
      set: { role, firstName, lastName, middleName: middleName || null },
    })
    .returning();

  return authorized;
}

export async function removeAuthorization(tenantSlug: string, email: string) {
  await requireRole(tenantSlug, ["ROOT", "ADMIN"]);
  const db = await getTenantDbBySlug(tenantSlug);

  return await db.delete(authorizedUsers).where(eq(authorizedUsers.email, email.toLowerCase()));
}

export async function updateUserRole(
  tenantSlug: string,
  userId: string,
  role: "ROOT" | "ADMIN" | "SECURITY" | "RECEPTION"
) {
  await requireRole(tenantSlug, ["ROOT", "ADMIN"]);
  const db = await getTenantDbBySlug(tenantSlug);

  // If we are updating an active user, we also need to update their entry in the users table
  const [user] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning();

  // Also update corresponding authorized_users record if it exists
  if (user?.email) {
    await db
      .update(authorizedUsers)
      .set({ role })
      .where(eq(authorizedUsers.email, user.email.toLowerCase()));
  }

  return user;
}

export async function deleteUser(tenantSlug: string, userId: string) {
  await requireRole(tenantSlug, ["ROOT", "ADMIN"]);
  const db = await getTenantDbBySlug(tenantSlug);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (user?.email) {
    // Also remove from authorized_users so they can't just re-sync immediately
    await db.delete(authorizedUsers).where(eq(authorizedUsers.email, user.email.toLowerCase()));
  }

  return await db.delete(users).where(eq(users.id, userId));
}

export async function getPublicTenantBySlug(slug: string) {
  try {
    return await withRetry(async () => {
      const [tenant] = await master_db
        .select({
          name: tenants.name,
          slug: tenants.slug,
          ownerId: tenants.ownerId,
        })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      return tenant || null;
    });
  } catch (error) {
    console.error(`Error fetching public tenant data for ${slug}:`, error);
    return null;
  }
}

/* =======================================
   SETTINGS
======================================= */

export async function getSettings(tenantSlug: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  let config = await db.query.settings.findFirst();

  if (!config) {
    // Create default settings if not exists
    [config] = await db.insert(settings).values({
      ndaPolicyText: "Bienvenue. En accédant à nos locaux, vous acceptez de respecter nos consignes de sécurité et de confidentialité.",
      requireSignature: 1,
      requireVisitorPhoto: 0,
      requireVehiclePhoto: 0,
    }).returning();
  }

  return config;
}

/**
 * [PUBLIC/SECURE] Get settings for Kiosk
 */
export async function getPublicSettings(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  return await getSettings(tenantSlug);
}

export async function updateSettings(
  tenantSlug: string,
  data: { ndaPolicyText?: string; requireSignature?: number; requireVisitorPhoto?: number; requireVehiclePhoto?: number }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const current = await getSettings(tenantSlug);

  const [updated] = await db
    .update(settings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(settings.id, current.id))
    .returning();

  return updated;
}

export async function getVisitById(tenantSlug: string, visitId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
    with: {
      visitor: {
        with: {
          type: true,
        }
      },
      host: true,
      department: true,
      service: true,
      vehicle: true,
    },
  });
}

export async function getVisitorById(tenantSlug: string, visitorId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitors.findFirst({
    where: eq(visitors.id, visitorId),
    with: {
      type: true,
    },
  });
}

export async function getVehicleById(tenantSlug: string, vehicleId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.vehicles.findFirst({
    where: eq(vehicles.id, vehicleId),
  });
}

export async function getHostById(slug: string, hostId: string) {
  await verifyTenantOwnership(slug);
  const db = await getTenantDbBySlug(slug);
  return db.query.hosts.findFirst({
    where: eq(hosts.id, hostId),
    with: {
      department: true,
    },
  });
}

export async function getVisitsByHost(tenantSlug: string, hostId: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visits.findMany({
    where: eq(visits.hostId, hostId),
    with: {
      visitor: {
        with: {
          type: true,
        }
      },
      department: true,
      service: true,
    },
    orderBy: [desc(visits.checkInAt)],
  });
}

/* =======================================
   BUSINESS SETTINGS
======================================= */

export async function getBusinessSettings(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const rows = await db.query.businessSettings.findMany({ limit: 1 });
  return rows[0] ?? null;
}

export async function getPublicBusinessSettings(tenantSlug: string, deviceToken?: string) {
  if (deviceToken) {
    await verifyDeviceToken(tenantSlug, deviceToken);
  }
  const db = await getTenantDbBySlug(tenantSlug);
  const rows = await db.query.businessSettings.findMany({ limit: 1 });
  return rows[0] ?? null;
}

export async function upsertBusinessSettings(
  tenantSlug: string,
  data: {
    name?: string;
    logoUrl?: string | null;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    industry?: string;
    taxId?: string;
  }
) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const existing = await db.query.businessSettings.findFirst();

  if (existing) {
    const [updated] = await db
      .update(businessSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businessSettings.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(businessSettings)
      .values({ ...data, updatedAt: new Date() })
      .returning();
    return created;
  }
}
