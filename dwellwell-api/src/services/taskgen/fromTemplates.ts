// dwellwell-api/src/services/taskgen/fromTemplates.ts
import crypto from "crypto";
import { prisma } from "../../db/prisma";
import { initialDueDate } from "./dates";
import type { Prisma, TaskTemplate, TaskType, TaskCriticality, UserTaskSourceType } from "@prisma/client";
import { TemplateState } from "@prisma/client";
import { ROOM_TYPES } from "@shared/constants/roomTypes";

/**
 * Fallback task generation that assigns existing TaskTemplates
 * to a home and its rooms by matching template.category to room.type.
 * - Room-scoped when template.category is one of ROOM_TYPES
 * - Otherwise home-scoped
 */

function makeDedupeKey(parts: (string | null | undefined)[]) {
  const raw = parts.filter(Boolean).join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function isRoomScoped(t: TaskTemplate) {
  return !!t.category && ROOM_TYPES.includes(t.category);
}

async function upsertFromTemplate(opts: {
  userId: string;
  homeId: string;
  roomId?: string | null;
  taskTemplate: TaskTemplate;
}) {
  const { userId, homeId, roomId = null, taskTemplate } = opts;

  const dedupeKey = makeDedupeKey([
    "tpl",
    taskTemplate.id,
    "u",
    userId,
    "h",
    homeId,
    "r",
    roomId ?? "",
    "t",
    "", // reserved for future scoping token
  ]);

  const due = initialDueDate(null, taskTemplate.recurrenceInterval);

  // Build shared fields from template; typed to align with Prisma JSON expectations
  const templateFields = {
    title: taskTemplate.title,
    description: taskTemplate.description ?? "",
    dueDate: due,
    status: "PENDING" as const,
    itemName: "",
    category: taskTemplate.category ?? "general",
    estimatedTimeMinutes: taskTemplate.estimatedTimeMinutes ?? 0,
    estimatedCost: taskTemplate.estimatedCost ?? 0,
    criticality: taskTemplate.criticality as TaskCriticality,
    deferLimitDays: taskTemplate.deferLimitDays ?? 0,
    canBeOutsourced: taskTemplate.canBeOutsourced ?? false,
    canDefer: taskTemplate.canDefer ?? true,
    recurrenceInterval: taskTemplate.recurrenceInterval,
    taskType: taskTemplate.taskType as TaskType,
    steps: (taskTemplate.steps?.length ?? 0)
      ? (taskTemplate.steps as unknown as Prisma.InputJsonValue)
      : undefined,
    equipmentNeeded: (taskTemplate.equipmentNeeded?.length ?? 0)
      ? (taskTemplate.equipmentNeeded as unknown as Prisma.InputJsonValue)
      : undefined,
    resources: (taskTemplate.resources ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
    icon: taskTemplate.icon ?? undefined,
    imageUrl: taskTemplate.imageUrl ?? undefined,
    sourceTemplateVersion: taskTemplate.version,
    // location intentionally omitted unless you want to overwrite it
  } satisfies Partial<Prisma.UserTaskUncheckedCreateInput>;

  const sourceType: UserTaskSourceType = (isRoomScoped(taskTemplate) ? "room" : "home");

  const updateData: Prisma.UserTaskUncheckedUpdateInput = {
    homeId,
    roomId,            // null for home-scoped; string for room-scoped
    trackableId: null, // template tasks aren't tied to a trackable here
    ...templateFields,
  };

  const createData: Prisma.UserTaskUncheckedCreateInput = {
    userId,
    homeId,
    roomId,
    trackableId: null,
    taskTemplateId: taskTemplate.id,
    sourceType,
    dedupeKey, // must match where.userId_dedupeKey
    ...templateFields,
  };

  await prisma.userTask.upsert({
    // 🔑 compound unique selector from @@unique([userId, dedupeKey])
    where: {
      userId_dedupeKey: { userId, dedupeKey },
    },
    update: updateData,
    create: createData,
  });
}

export async function generateTasksFromTemplatesForHome(homeId: string) {
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    include: { rooms: { select: { id: true, type: true } } },
  });
  if (!home) return;

  const templates = await prisma.taskTemplate.findMany({
    where: { state: TemplateState.VERIFIED },
  });

  for (const tpl of templates) {
    if (isRoomScoped(tpl)) {
      const targets = home.rooms.filter((r) => r.type === tpl.category);
      for (const room of targets) {
        await upsertFromTemplate({
          userId: home.userId,
          homeId: home.id,
          roomId: room.id,
          taskTemplate: tpl,
        });
      }
    } else {
      await upsertFromTemplate({
        userId: home.userId,
        homeId: home.id,
        roomId: null,
        taskTemplate: tpl,
      });
    }
  }
}

export async function generateTasksFromTemplatesForRoom(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { home: { select: { id: true, userId: true } } },
  });
  if (!room || !room.home) return;

  const templates = await prisma.taskTemplate.findMany({
    where: {
      state: TemplateState.VERIFIED,
      category: room.type, // only templates that match this room type
    },
  });

  for (const tpl of templates) {
    await upsertFromTemplate({
      userId: room.home.userId,
      homeId: room.home.id,
      roomId: room.id,
      taskTemplate: tpl,
    });
  }
}
