// dwellwell-api/src/routes/trackables/_seedTasks.ts
import { PrismaClient, Prisma, UserTaskSourceType } from "@prisma/client";

const SNAP_FIELDS = [
  "title",
  "description",
  "recurrenceInterval",
  "criticality",
  "estimatedTimeMinutes",
  "estimatedCost",
  "canBeOutsourced",
  "canDefer",
  "deferLimitDays",
  "category",
  "icon",
  "imageUrl",
] as const;

function asJsonOrUndefined<T>(
  v: T | null | undefined
): Prisma.InputJsonValue | undefined {
  if (v === null || v === undefined) return undefined;
  return v as unknown as Prisma.InputJsonValue;
}

export async function seedTasksForTrackable(opts: {
  prisma: PrismaClient;
  userId: string;
  trackableId: string;
  applianceCatalogId?: string | null;
}) {
  const { prisma, userId, trackableId, applianceCatalogId } = opts;

  if (!applianceCatalogId) return;

  // Templates linked to this catalog item
  const links = await prisma.applianceTaskTemplate.findMany({
    where: { applianceCatalogId },
    include: { taskTemplate: true },
  });
  if (!links.length) return;

  const toCreate = links
    .filter((l) => !!l.taskTemplate)
    .map((l) => {
      const tpl = l.taskTemplate!;

      const base: any = {
        userId,
        trackableId,
        taskTemplateId: tpl.id,
        // ✅ valid enum value in your schema
        sourceType: UserTaskSourceType.trackable,
        title: tpl.title,
        description: tpl.description ?? "",
        dueDate: new Date(), // you can shift/compute next due elsewhere
        status: "PENDING",

        // versioning
        sourceTemplateVersion: tpl.version,

        // scalars copied from template
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

        // presentation fields required by UserTask
        itemName: tpl.title,
        location: null,

        // tracking on by default
        isTracking: true,

        // JSON-like fields safely assigned
        steps: asJsonOrUndefined(tpl.steps ?? []),
        equipmentNeeded: asJsonOrUndefined(tpl.equipmentNeeded ?? []),
        resources: asJsonOrUndefined(tpl.resources ?? null),
      };

      return base;
    });

  if (!toCreate.length) return;

  await prisma.userTask.createMany({
    data: toCreate,
    skipDuplicates: true,
  });
}
