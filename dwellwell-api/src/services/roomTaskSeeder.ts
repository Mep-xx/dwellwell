// dwellwell-api/src/services/roomTaskSeeder.ts
import crypto from "crypto";
import { prisma } from "../db/prisma";

/**
 * Deterministic dedupe key for seed-created room tasks so repeated calls
 * do not create duplicates.
 */
function makeSeedDedupe(userId: string, roomId: string, title: string) {
  const raw = ["seed", "u", userId, "r", roomId, "t", title.trim().toLowerCase()].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Seed simple room-based tasks (quick starter for Rooms UI)
export async function seedRoomTasksForRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { detail: true, home: { select: { userId: true } } },
  });
  if (!room || room.home.userId !== userId) return;

  const recs = deriveTemplates(room);
  const now = new Date();

  for (const t of recs) {
    const dedupeKey = makeSeedDedupe(userId, room.id, t.title);

    await prisma.userTask.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {
        title: t.title,
        description: t.description ?? "",
        dueDate: computeInitialDue(now, t.recurrenceInterval),
        status: "PENDING",
        itemName: room.name,
        category: t.category ?? "general",
        estimatedTimeMinutes: t.estimatedTimeMinutes ?? 0,
        estimatedCost: t.estimatedCost ?? 0,
        criticality: (t.criticality as any) ?? "medium",
        deferLimitDays: t.deferLimitDays ?? 0,
        canBeOutsourced: t.canBeOutsourced ?? false,
        canDefer: t.canDefer ?? true,
        recurrenceInterval: t.recurrenceInterval ?? "",
        taskType: "GENERAL",
        steps: (t.steps as any) ?? undefined,
        equipmentNeeded: (t.equipmentNeeded as any) ?? undefined,
        resources: (t.resources as any) ?? undefined,
        icon: t.icon ?? undefined,
        imageUrl: t.imageUrl ?? undefined,
      },
      create: {
        userId,
        homeId: room.homeId,
        roomId: room.id,
        trackableId: null,
        taskTemplateId: null, // room templates can be non-catalog
        sourceType: "room",
        title: t.title,
        description: t.description ?? "",
        dueDate: computeInitialDue(now, t.recurrenceInterval),
        status: "PENDING",
        itemName: room.name,
        category: t.category ?? "general",
        estimatedTimeMinutes: t.estimatedTimeMinutes ?? 0,
        estimatedCost: t.estimatedCost ?? 0,
        criticality: (t.criticality as any) ?? "medium",
        deferLimitDays: t.deferLimitDays ?? 0,
        canBeOutsourced: t.canBeOutsourced ?? false,
        canDefer: t.canDefer ?? true,
        recurrenceInterval: t.recurrenceInterval ?? "",
        taskType: "GENERAL",
        dedupeKey,
        steps: (t.steps as any) ?? undefined,
        equipmentNeeded: (t.equipmentNeeded as any) ?? undefined,
        resources: (t.resources as any) ?? undefined,
        icon: t.icon ?? undefined,
        imageUrl: t.imageUrl ?? undefined,
      },
    });
  }

  function computeInitialDue(base: Date, rec?: string) {
    const d = new Date(base);
    const r = (rec || "").toLowerCase();
    const n = parseInt(r.match(/\d+/)?.[0] ?? "3", 10); // default “3”
    if (r.includes("day")) d.setDate(d.getDate() + n);
    else if (r.includes("week")) d.setDate(d.getDate() + 7 * n);
    else if (r.includes("month")) d.setMonth(d.getMonth() + n);
    else if (r.includes("year")) d.setFullYear(d.getFullYear() + n);
    else d.setDate(d.getDate() + 90); // fallback ~quarterly
    return d;
  }

  function deriveTemplates(room: any) {
    const out: any[] = [];
    const type = (room.type || "").toLowerCase();

    if (type.includes("bedroom") || type.includes("nursery") || type.includes("guest")) {
      out.push({
        title: "Rotate mattress",
        description: "Rotate 180° to distribute wear.",
        recurrenceInterval: "3 months",
        category: "Bedroom",
        estimatedTimeMinutes: 10,
        icon: "🛏️",
      });

      if (room.detail?.hasSmokeDetector) {
        out.push({
          title: "Test smoke detector",
          recurrenceInterval: "1 month",
          category: "Safety",
          estimatedTimeMinutes: 5,
          icon: "🚨",
        });
        out.push({
          title: "Replace detector batteries",
          recurrenceInterval: "6 months",
          category: "Safety",
          estimatedTimeMinutes: 10,
          icon: "🔋",
        });
      }
      if (room.detail?.hasCeilingFan) {
        out.push({
          title: "Dust ceiling fan",
          recurrenceInterval: "1 month",
          category: "General",
          estimatedTimeMinutes: 10,
          icon: "🧹",
        });
      }
    }

    if (type.includes("bath")) {
      out.push({
        title: "Clean bathroom exhaust fan grille",
        description: "Vacuum/wipe the grille so humidity clears quickly and prevents mildew.",
        recurrenceInterval: "3 months",
        category: "Bathroom",
        estimatedTimeMinutes: 10,
        icon: "🧼",
      });
      out.push({
        title: "Inspect & re-caulk tub/shower",
        description: "Clean old caulk, dry area, apply fresh silicone to prevent leaks and mold.",
        recurrenceInterval: "1 year",
        category: "Bathroom",
        estimatedTimeMinutes: 60,
        icon: "🧴",
      });
    }

    if (type.includes("kitchen")) {
      out.push({
        title: "Clean range hood filter",
        description: "Remove and clean or replace the range hood filter to keep airflow strong.",
        recurrenceInterval: "3 months",
        category: "Kitchen",
        estimatedTimeMinutes: 10,
        icon: "🍳",
      });
    }

    // Add more room types as needed…
    return out;
  }
}
