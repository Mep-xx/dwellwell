import { PrismaClient, TaskStatus, TaskType, TaskCriticality } from "@prisma/client";

const prisma = new PrismaClient();

type DefaultTask = {
  title: string;
  description?: string;
  category?: string;
  dueInDays: number;              // initial due date offset
  recurrence?: string;            // free-form for now
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
      criticality: "high",
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
      criticality: "high",
    },
  ],
  "Living Room": [
    {
      title: "Test smoke detector",
      description: "Press and hold TEST button; replace battery if needed.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "1mo",
      criticality: "high",
    },
    {
      title: "Inspect fireplace",
      description: "Check damper operation and clear debris.",
      category: "Safety",
      dueInDays: 90,
      recurrence: "1y",
      criticality: "medium",
    },
  ],
  Bedroom: [
    {
      title: "Test smoke detector",
      description: "Press and hold TEST button; replace battery if needed.",
      category: "Safety",
      dueInDays: 30,
      recurrence: "1mo",
      criticality: "high",
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
      criticality: "high",
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
      criticality: "high",
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
      criticality: "high",
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

export async function seedDefaultTasksForRoom(args: {
  prismaClient?: PrismaClient;
  room: { id: string; name?: string | null; type?: string | null; homeId: string };
  userId: string;
}) {
  const db = args.prismaClient ?? prisma;
  const { room, userId } = args;

  const defs = ROOM_TYPE_DEFAULT_TASKS[room.type || ""] ?? [];
  if (!defs.length) return;

  for (const def of defs) {
    const baseKey = `room-${room.id}-${slugify(def.title)}`;
    let dedupeKey = baseKey;

    // extra safety (shouldn’t trigger in normal create flow)
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.userTask.findUnique({ where: { dedupeKey } }).catch(() => null);
      if (!existing) break;
      n += 1;
      dedupeKey = `${baseKey}-${n}`;
    }

    await db.userTask.create({
      data: {
        userId,
        roomId: room.id,
        trackableId: undefined,
        taskTemplateId: undefined,
        sourceType: "room",

        title: def.title,
        description: def.description ?? "",
        dueDate: addDays(def.dueInDays),
        status: TaskStatus.PENDING,

        itemName: def.title,
        category: def.category ?? (room.type || "General"),
        location: room.name || room.type || undefined,

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
        // IMPORTANT: JSON fields must be omitted or set to Prisma.DbNull/JsonNull.
        steps: undefined,
        equipmentNeeded: undefined,
        resources: undefined,
        imageUrl: undefined,
        icon: undefined,
      },
    });
  }
}
