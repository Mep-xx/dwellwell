// dwellwell-api/src/services/roomTaskSeeder.ts
import {
  PrismaClient,
  TaskCriticality,
  TaskStatus,
  TaskType,
  UserTaskSourceType,
} from "@prisma/client";
import { prisma as prismaSingleton } from "../db/prisma";

type DefaultTask = {
  title: string;
  description?: string;
  category?: string;
  dueInDays: number;   // initial due date offset
  recurrence?: string; // free-form for now
  criticality?: TaskCriticality;
};

const ROOM_TYPE_DEFAULT_TASKS: Record<string, DefaultTask[]> = {
  Kitchen: [
    {
      title: "Clean range hood filter",
      description: "Remove the metal filter and degrease. Rinse and dry.",
      category: "Cleaning",
      dueInDays: 30,
      recurrence: "3mo",
    },
    {
      title: "Sanitize garbage disposal",
      description: "Deodorize and scrub the splash guard.",
      category: "Cleaning",
      dueInDays: 14,
      recurrence: "1mo",
    },
    {
      title: "Test GFCI outlets",
      description: "Press TEST then RESET to confirm proper operation.",
      category: "Electrical",
      dueInDays: 60,
      recurrence: "6mo",
      criticality: TaskCriticality.high,
    },
  ],
  Bathroom: [
    {
      title: "Clean exhaust fan grille",
      description: "Vacuum dust and wash the grille.",
      category: "Cleaning",
      dueInDays: 30,
      recurrence: "3mo",
    },
    {
      title: "Test GFCI outlets",
      description: "Press TEST then RESET to confirm proper operation.",
      category: "Electrical",
      dueInDays: 60,
      recurrence: "6mo",
      criticality: TaskCriticality.high,
    },
  ],
  "Living Room": [
    {
      title: "Test smoke detector",
      description: "Press and hold TEST button; replace battery if needed.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "1mo",
      criticality: TaskCriticality.high,
    },
    {
      title: "Inspect fireplace",
      description: "Check damper operation and clear debris.",
      category: "Safety",
      dueInDays: 90,
      recurrence: "1y",
      criticality: TaskCriticality.medium,
    },
  ],
  Bedroom: [
    {
      title: "Test smoke detector",
      description: "Press and hold TEST button; replace battery if needed.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "1mo",
      criticality: TaskCriticality.high,
    },
    {
      title: "Dust ceiling fan",
      description: "Wipe blades; reverse direction seasonally.",
      category: "Cleaning",
      dueInDays: 30,
      recurrence: "3mo",
    },
  ],
  Laundry: [
    {
      title: "Clean dryer lint trap & check vent",
      description: "Remove lint; inspect duct for buildup.",
      category: "Safety",
      dueInDays: 7,
      recurrence: "1w",
      criticality: TaskCriticality.high,
    },
    {
      title: "Inspect washer hoses",
      description: "Look for bulges, cracks, and leaks.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "6mo",
    },
  ],
  Garage: [
    {
      title: "Test garage door auto-reverse",
      description: "Verify sensors and force reversal limits.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "6mo",
      criticality: TaskCriticality.high,
    },
    {
      title: "Flush water heater (quick)",
      description: "Brief flush to remove sediment (full annually).",
      category: "Plumbing",
      dueInDays: 60,
      recurrence: "1y",
    },
  ],
  Basement: [
    {
      title: "Test sump pump",
      description: "Lift float or add water; confirm discharge.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "3mo",
      criticality: TaskCriticality.high,
    },
  ],
  Attic: [
    {
      title: "Inspect attic for leaks/pests",
      description: "Check sheathing, insulation, and vents.",
      category: "Inspection",
      dueInDays: 60,
      recurrence: "6mo",
    },
  ],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Seeds a handful of sensible, room-scoped default tasks for a given room.
 * - Uses (userId, dedupeKey) for idempotency
 * - Includes homeId on the created tasks (better filtering/grouping)
 * - Uses real Prisma enums (no Prisma.$Enums)
 */
export async function seedRoomTasksForRoom(
  roomId: string,
  userId: string,
  prismaClient?: PrismaClient
) {
  const db = prismaClient ?? prismaSingleton;

  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { id: true, type: true, name: true, homeId: true },
  });
  if (!room) return;

  const defs = ROOM_TYPE_DEFAULT_TASKS[room.type || ""] ?? [];
  if (!defs.length) return;

  for (const def of defs) {
    const baseKey = `room-${room.id}-${slugify(def.title)}`;
    let dedupeKey = baseKey;

    // ensure uniqueness per (userId, dedupeKey)
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.userTask
        .findUnique({ where: { userId_dedupeKey: { userId, dedupeKey } } })
        .catch(() => null);
      if (!existing) break;
      n += 1;
      dedupeKey = `${baseKey}-${n}`;
    }

    await db.userTask.create({
      data: {
        userId,
        homeId: room.homeId ?? null,
        roomId: room.id,
        trackableId: null,
        taskTemplateId: null,
        sourceType: UserTaskSourceType.room,

        title: def.title,
        description: def.description ?? "",
        dueDate: addDays(def.dueInDays),
        status: TaskStatus.PENDING,

        itemName: def.title,
        category: def.category ?? (room.type || "General"),
        location: room.name ?? room.type ?? null,

        estimatedTimeMinutes: 0,
        estimatedCost: 0,
        criticality: def.criticality ?? TaskCriticality.medium,

        deferLimitDays: 0,
        canBeOutsourced: false,
        canDefer: true,
        isTracking: true,

        recurrenceInterval: def.recurrence ?? "",

        taskType: TaskType.GENERAL,

        dedupeKey,
        steps: undefined,
        equipmentNeeded: undefined,
        resources: undefined,
        imageUrl: null,
        icon: null,
      },
    });
  }
}
