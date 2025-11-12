// dwellwell-api/src/routes/trackables/_seedTasks.ts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { getTrackableDisplay } from "../../services/trackables/display";

/** Safe JSON assignment helper (use JsonValue for wider Prisma compat) */
function asJsonOrUndefined<T>(v: T | null | undefined): any {
  if (v == null) return undefined;
  return v as any;
}

/** Recurrence helpers */
function addByInterval(from: Date, recurrenceInterval: string): Date {
  const d = new Date(from);
  const r = (recurrenceInterval || "").toLowerCase();
  const n = parseInt(r.match(/\d+/)?.[0] ?? "1", 10);
  if (r.includes("day")) d.setDate(d.getDate() + n);
  else if (r.includes("week")) d.setDate(d.getDate() + 7 * n);
  else if (r.includes("month")) d.setMonth(d.getMonth() + n);
  else if (r.includes("quarter")) d.setMonth(d.getMonth() + 3 * n);
  else if (r.includes("year")) d.setFullYear(d.getFullYear() + n);
  else d.setMonth(d.getMonth() + n);
  return d;
}

function initialDueDate(anchor?: Date | null, recurrenceInterval?: string): Date {
  const base = anchor && !isNaN(anchor.getTime()) ? anchor : new Date();
  return addByInterval(base, recurrenceInterval || "monthly");
}

/** Deterministic dedupe key */
function makeDedupeKey(parts: (string | null | undefined)[]) {
  const raw = parts.filter(Boolean).join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function seedTasksForTrackable(opts: {
  prisma: PrismaClient;
  userId: string;
  trackableId: string;
  applianceCatalogId?: string | null;
}) {
  const { prisma, userId, trackableId, applianceCatalogId } = opts;
  if (!applianceCatalogId) return;

  const links = await prisma.applianceTaskTemplate.findMany({
    where: { applianceCatalogId },
    include: { taskTemplate: true },
  });

  if (!links.length) {
    try {
      const t = await prisma.trackable.findUnique({
        where: { id: trackableId },
        select: { homeId: true, roomId: true },
      });
      await prisma.taskGenerationIssue.create({
        data: {
          userId,
          homeId: t?.homeId ?? null,
          roomId: t?.roomId ?? null,
          trackableId,
          code: "no_matching_template",
          status: "open",
          message: `No ApplianceTaskTemplate links for catalogId=${applianceCatalogId}`,
          debugPayload: { applianceCatalogId },
        },
      });
    } catch {/* ignore */}
    return;
  }

  const tctx = await prisma.trackable.findUnique({
    where: { id: trackableId },
    select: { purchaseDate: true, homeId: true, roomId: true },
  });
  const anchor = tctx?.purchaseDate ?? null;

  const { composedItemName, context } = await getTrackableDisplay(trackableId);
  const homeId = context.homeId ?? tctx?.homeId ?? null;
  const roomId = context.roomId ?? tctx?.roomId ?? null;

  for (const link of links) {
    const tpl = link.taskTemplate;
    if (!tpl) continue;

    const dedupeKey = makeDedupeKey(["catalogTpl", tpl.id, "u", userId, "t", trackableId]);
    const due = initialDueDate(anchor, tpl.recurrenceInterval);

    await prisma.userTask.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {
        homeId,
        roomId: roomId ?? undefined,

        title: tpl.title,
        description: tpl.description ?? "",
        dueDate: due,
        status: "PENDING" as any,

        sourceTemplateVersion: tpl.version,

        recurrenceInterval: tpl.recurrenceInterval ?? "",
        criticality: tpl.criticality,
        estimatedTimeMinutes: tpl.estimatedTimeMinutes ?? 0,
        estimatedCost: tpl.estimatedCost ?? 0,
        canBeOutsourced: tpl.canBeOutsourced ?? false,
        canDefer: tpl.canDefer ?? true,
        deferLimitDays: tpl.deferLimitDays ?? 0,
        category: tpl.category ?? "general",
        icon: tpl.icon ?? undefined,
        imageUrl: tpl.imageUrl ?? undefined,

        itemName: composedItemName,
        location: null,

        steps: asJsonOrUndefined(tpl.steps ?? []),
        equipmentNeeded: asJsonOrUndefined(tpl.equipmentNeeded ?? []),
        resources: asJsonOrUndefined(tpl.resources ?? null),
        isTracking: true,
      },
      create: {
        userId,

        homeId,
        roomId: roomId ?? null,

        trackableId,
        taskTemplateId: tpl.id,
        sourceType: "trackable" as any,

        title: tpl.title,
        description: tpl.description ?? "",
        dueDate: due,
        status: "PENDING" as any,

        sourceTemplateVersion: tpl.version,

        recurrenceInterval: tpl.recurrenceInterval ?? "",
        criticality: tpl.criticality,
        estimatedTimeMinutes: tpl.estimatedTimeMinutes ?? 0,
        estimatedCost: tpl.estimatedCost ?? 0,
        canBeOutsourced: tpl.canBeOutsourced ?? false,
        canDefer: tpl.canDefer ?? true,
        deferLimitDays: tpl.deferLimitDays ?? 0,
        category: tpl.category ?? "general",
        icon: tpl.icon ?? null,
        imageUrl: tpl.imageUrl ?? null,

        itemName: composedItemName,
        location: null,

        isTracking: true,

        steps: asJsonOrUndefined(tpl.steps ?? []),
        equipmentNeeded: asJsonOrUndefined(tpl.equipmentNeeded ?? []),
        resources: asJsonOrUndefined(tpl.resources ?? null),

        dedupeKey,
      },
    });
  }
}
