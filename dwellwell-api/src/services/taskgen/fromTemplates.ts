// dwellwell-api/src/services/taskgen/fromTemplates.ts
import crypto from "crypto";
import { prisma } from "../../db/prisma";
import { initialDueDate } from "./dates";
import type { TaskTemplate } from "@prisma/client";
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
    homeId, // include home
    "r",
    roomId ?? "",
    "t",
    "",
  ]);

  const due = initialDueDate(null, taskTemplate.recurrenceInterval);

  await prisma.userTask.upsert({
    where: { dedupeKey },
    update: {
      homeId,
      roomId: roomId ?? undefined,
      trackableId: undefined,

      title: taskTemplate.title,
      description: taskTemplate.description ?? "",
      dueDate: due,
      status: "PENDING",
      itemName: "",
      category: taskTemplate.category ?? "general",
      estimatedTimeMinutes: taskTemplate.estimatedTimeMinutes ?? 0,
      estimatedCost: taskTemplate.estimatedCost ?? 0,
      criticality: taskTemplate.criticality,
      deferLimitDays: taskTemplate.deferLimitDays ?? 0,
      canBeOutsourced: taskTemplate.canBeOutsourced ?? false,
      canDefer: taskTemplate.canDefer ?? true,
      recurrenceInterval: taskTemplate.recurrenceInterval,
      taskType: taskTemplate.taskType,
      steps: taskTemplate.steps ? (taskTemplate.steps as any) : undefined,
      equipmentNeeded: taskTemplate.equipmentNeeded ? (taskTemplate.equipmentNeeded as any) : undefined,
      resources: taskTemplate.resources ? (taskTemplate.resources as any) : undefined,
      icon: taskTemplate.icon ?? undefined,
      imageUrl: taskTemplate.imageUrl ?? undefined,
      sourceTemplateVersion: taskTemplate.version,
      location: undefined,
    },
    create: {
      userId,
      homeId,
      roomId,
      trackableId: null,
      taskTemplateId: taskTemplate.id,
      sourceType: "room", // label only; fine for home-scoped too
      title: taskTemplate.title,
      description: taskTemplate.description ?? "",
      dueDate: due,
      status: "PENDING",
      itemName: "",
      category: taskTemplate.category ?? "general",
      estimatedTimeMinutes: taskTemplate.estimatedTimeMinutes ?? 0,
      estimatedCost: taskTemplate.estimatedCost ?? 0,
      criticality: taskTemplate.criticality,
      deferLimitDays: taskTemplate.deferLimitDays ?? 0,
      canBeOutsourced: taskTemplate.canBeOutsourced ?? false,
      canDefer: taskTemplate.canDefer ?? true,
      recurrenceInterval: taskTemplate.recurrenceInterval,
      taskType: taskTemplate.taskType,
      dedupeKey,
      steps: taskTemplate.steps ? (taskTemplate.steps as any) : undefined,
      equipmentNeeded: taskTemplate.equipmentNeeded ? (taskTemplate.equipmentNeeded as any) : undefined,
      resources: taskTemplate.resources ? (taskTemplate.resources as any) : undefined,
      icon: taskTemplate.icon ?? undefined,
      imageUrl: taskTemplate.imageUrl ?? undefined,
      sourceTemplateVersion: taskTemplate.version,
      location: undefined,
    },
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
