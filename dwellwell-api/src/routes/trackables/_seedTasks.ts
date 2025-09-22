// dwellwell-api/src/routes/trackables/_seedTasks.ts
import { PrismaClient, Prisma, UserTaskSourceType, TaskTemplate } from "@prisma/client";
import crypto from "crypto";
import { getTrackableDisplay } from "../../services/trackables/display";

/** Safe JSON assignment helper */
function asJsonOrUndefined<T>(v: T | null | undefined): Prisma.InputJsonValue | undefined {
  if (v === null || v === undefined) return undefined;
  return v as unknown as Prisma.InputJsonValue;
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

/**
 * Seed tasks for a trackable from its ApplianceTaskTemplate links.
 * - Idempotent via dedupeKey (templateId + userId + trackableId).
 * - Sets homeId/roomId on tasks (critical for home-scoped queries).
 * - Due dates anchored off purchaseDate when present.
 * - itemName uses the user's name first, with brand+model appended when available.
 * - Logs an admin-visible issue if no links exist.
 */
export async function seedTasksForTrackable(opts: {
  prisma: PrismaClient;
  userId: string;
  trackableId: string;
  applianceCatalogId?: string | null;
}) {
  const { prisma, userId, trackableId, applianceCatalogId } = opts;

  if (!applianceCatalogId) return;

  // Find all template links for this catalog item
  const links = await prisma.applianceTaskTemplate.findMany({
    where: { applianceCatalogId },
    include: { taskTemplate: true },
  });

  if (!links.length) {
    // Log for admin triage
    try {
      const t = await prisma.trackable.findUnique({
        where: { id: trackableId },
        select: { homeId: true, roomId: true },
      });
      // If you have TaskGenerationIssue in your schema, this will work; otherwise no-op
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
    } catch {
      // swallow; admin table might not exist in some environments
    }
    return;
  }

  // Context for anchoring & display
  const tctx = await prisma.trackable.findUnique({
    where: { id: trackableId },
    select: { purchaseDate: true, homeId: true, roomId: true },
  });
  const anchor = tctx?.purchaseDate ?? null;
  const fallbackHomeId = tctx?.homeId ?? null;
  const fallbackRoomId = tctx?.roomId ?? null;

  // Enriched display (user name first, then brand/model where known)
  const { composedItemName, context } = await getTrackableDisplay(trackableId);
  // Prefer enriched context, fall back to direct trackable fields
  const ctxHomeId = context.homeId ?? fallbackHomeId ?? null;
  const ctxRoomId = context.roomId ?? fallbackRoomId ?? null;

  for (const link of links) {
    const tpl: TaskTemplate | null = link.taskTemplate;
    if (!tpl) continue;

    const dedupeKey = makeDedupeKey(["catalogTpl", tpl.id, "u", userId, "t", trackableId]);
    const due = initialDueDate(anchor, tpl.recurrenceInterval);

    await prisma.userTask.upsert({
      where: { dedupeKey },
      update: {
        // identifiers / scope
        homeId: ctxHomeId ?? undefined,
        roomId: ctxRoomId ?? undefined,

        // presentation / details
        title: tpl.title,
        description: tpl.description ?? "",
        dueDate: due,
        status: "PENDING",

        // provenance
        sourceTemplateVersion: tpl.version,

        // copied fields
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

        // item naming (user's name first; brand/model appended by display helper)
        itemName: composedItemName,
        location: null,

        // JSON-ish
        steps: asJsonOrUndefined(tpl.steps ?? []),
        equipmentNeeded: asJsonOrUndefined(tpl.equipmentNeeded ?? []),
        resources: asJsonOrUndefined(tpl.resources ?? null),
      },
      create: {
        userId,

        // ✅ scope for home/room queries
        homeId: ctxHomeId,
        roomId: ctxRoomId,

        trackableId,
        taskTemplateId: tpl.id,
        sourceType: UserTaskSourceType.trackable,

        title: tpl.title,
        description: tpl.description ?? "",
        dueDate: due,
        status: "PENDING",

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

        // item naming (user's name first; brand/model appended by display helper)
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
