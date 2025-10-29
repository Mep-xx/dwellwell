// dwellwell-api/src/services/taskgen/fromTemplates.ts
import crypto from "crypto";
import { prisma } from "../../db/prisma";
import { initialDueDate } from "./dates";
import type {
  Prisma,
  TaskTemplate,
  TaskType,
  TaskCriticality,
  UserTaskSourceType,
} from "@prisma/client";
import { TemplateState } from "@prisma/client";
import { ROOM_TYPES } from "@shared/constants/roomTypes";

/**
 * Seed ONLY room/home templates that are NOT trackable-linked.
 * - Exclude any TaskTemplate that has links in TrackableKindTaskTemplate or ApplianceTaskTemplate.
 * - Room-scoped when template.category matches a ROOM_TYPES value (equals room.type).
 * - Otherwise, home-scoped.
 */

function makeDedupeKey(parts: (string | null | undefined)[]) {
  const raw = parts.filter(Boolean).join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function isRoomScoped(t: TaskTemplate | TemplatePick) {
  return !!t.category && ROOM_TYPES.includes(t.category);
}

type TemplatePick = Pick<
  TaskTemplate,
  | "id"
  | "title"
  | "description"
  | "icon"
  | "imageUrl"
  | "category"
  | "recurrenceInterval"
  | "taskType"
  | "criticality"
  | "canDefer"
  | "deferLimitDays"
  | "estimatedTimeMinutes"
  | "estimatedCost"
  | "canBeOutsourced"
  | "steps"
  | "equipmentNeeded"
  | "resources"
  | "version"
>;

type ConcreteTemplateFields = {
  description: string;
  dueDate: Date;
  status: "PENDING";
  category: string;
  estimatedTimeMinutes: number;
  estimatedCost: number;
  criticality: TaskCriticality;
  deferLimitDays: number;
  canBeOutsourced: boolean;
  canDefer: boolean;
  recurrenceInterval: string;
  taskType: TaskType;
  steps?: Prisma.InputJsonValue;
  equipmentNeeded?: Prisma.InputJsonValue;
  resources?: Prisma.InputJsonValue;
  icon?: string;
  imageUrl?: string;
  sourceTemplateVersion?: number;
};

/** Compose fields copied from a template into concrete UserTask-ready values */
function materializeTemplateFields(tpl: TemplatePick, due: Date): ConcreteTemplateFields {
  return {
    description: tpl.description ?? "",
    dueDate: due,
    status: "PENDING",
    category: tpl.category ?? "general",
    estimatedTimeMinutes: tpl.estimatedTimeMinutes ?? 0,
    estimatedCost: tpl.estimatedCost ?? 0,
    criticality: (tpl.criticality ?? "medium") as TaskCriticality,
    deferLimitDays: tpl.deferLimitDays ?? 0,
    canBeOutsourced: tpl.canBeOutsourced ?? false,
    canDefer: tpl.canDefer ?? true,
    recurrenceInterval: tpl.recurrenceInterval ?? "",
    taskType: (tpl.taskType ?? "GENERAL") as TaskType,
    steps:
      (tpl.steps?.length ?? 0)
        ? (tpl.steps as unknown as Prisma.InputJsonValue)
        : undefined,
    equipmentNeeded:
      (tpl.equipmentNeeded?.length ?? 0)
        ? (tpl.equipmentNeeded as unknown as Prisma.InputJsonValue)
        : undefined,
    resources: (tpl.resources ?? undefined) as unknown as
      | Prisma.InputJsonValue
      | undefined,
    icon: tpl.icon ?? undefined,
    imageUrl: tpl.imageUrl ?? undefined,
    sourceTemplateVersion: tpl.version,
  };
}

/** Upsert a task derived from a template. Ensures required fields are always present. */
async function upsertFromTemplate(opts: {
  userId: string;
  homeId: string;
  roomId?: string | null;
  itemName: string;
  location?: string | null;
  taskTemplate: TemplatePick;
  sourceType: UserTaskSourceType; // "room" | "home"
}) {
  const {
    userId,
    homeId,
    roomId = null,
    itemName,
    location = null,
    taskTemplate,
    sourceType,
  } = opts;

  const dedupeKey = makeDedupeKey([
    "tpl",
    taskTemplate.id,
    "u",
    userId,
    "h",
    homeId,
    "r",
    roomId ?? "",
    "src",
    sourceType,
  ]);

  const due = initialDueDate(null, taskTemplate.recurrenceInterval);
  const fields = materializeTemplateFields(taskTemplate, due);

  // Required fields with safe fallbacks
  const safeTitle = taskTemplate.title || "Home Maintenance Task";

  const baseUpdate: Prisma.UserTaskUncheckedUpdateInput = {
    homeId,
    roomId,
    trackableId: null,
    itemName,
    location,

    // requireds
    title: safeTitle,
    taskType: fields.taskType,
    criticality: fields.criticality,
    recurrenceInterval: fields.recurrenceInterval,

    // concretes
    description: fields.description, // always a string
    dueDate: fields.dueDate,
    status: fields.status,
    category: fields.category,
    estimatedTimeMinutes: fields.estimatedTimeMinutes,
    estimatedCost: fields.estimatedCost,
    deferLimitDays: fields.deferLimitDays,
    canBeOutsourced: fields.canBeOutsourced,
    canDefer: fields.canDefer,
    steps: fields.steps,
    equipmentNeeded: fields.equipmentNeeded,
    resources: fields.resources,
    icon: fields.icon,
    imageUrl: fields.imageUrl,
    sourceTemplateVersion: fields.sourceTemplateVersion,
  };

  const baseCreate: Prisma.UserTaskUncheckedCreateInput = {
    userId,
    homeId,
    roomId,
    trackableId: null,
    taskTemplateId: taskTemplate.id,
    sourceType,
    dedupeKey, // matches where.userId_dedupeKey
    itemName,
    location,

    // requireds
    title: safeTitle,
    taskType: fields.taskType,
    criticality: fields.criticality,
    recurrenceInterval: fields.recurrenceInterval,

    // concretes (no undefineds)
    description: fields.description,
    dueDate: fields.dueDate,
    status: fields.status,
    category: fields.category,
    estimatedTimeMinutes: fields.estimatedTimeMinutes,
    estimatedCost: fields.estimatedCost,
    deferLimitDays: fields.deferLimitDays,
    canBeOutsourced: fields.canBeOutsourced,
    canDefer: fields.canDefer,
    steps: fields.steps,
    equipmentNeeded: fields.equipmentNeeded,
    resources: fields.resources,
    icon: fields.icon,
    imageUrl: fields.imageUrl,
    sourceTemplateVersion: fields.sourceTemplateVersion,
  };

  await prisma.userTask.upsert({
    where: { userId_dedupeKey: { userId, dedupeKey } }, // @@unique([userId, dedupeKey])
    update: baseUpdate,
    create: baseCreate,
  });
}

/** Fetch VERIFIED templates that are NOT trackable-linked (no kind/catalog links). */
async function getSeedableTemplates(): Promise<TemplatePick[]> {
  return prisma.taskTemplate.findMany({
    where: {
      state: TemplateState.VERIFIED,
      // Exclude anything linked to trackables
      TrackableKindTaskTemplate: { none: {} },
      ApplianceTaskTemplate: { none: {} },
    },
    select: {
      id: true,
      title: true,
      description: true,
      icon: true,
      imageUrl: true,
      category: true,
      recurrenceInterval: true,
      taskType: true,
      criticality: true,
      canDefer: true,
      deferLimitDays: true,
      estimatedTimeMinutes: true,
      estimatedCost: true,
      canBeOutsourced: true,
      steps: true,
      equipmentNeeded: true,
      resources: true,
      version: true,
    },
  });
}

/**
 * Seed all room- and home-scoped tasks for a home.
 * Room: template.category === room.type (and category is in ROOM_TYPES)
 * Home: template.category not in ROOM_TYPES
 */
export async function generateTasksFromTemplatesForHome(homeId: string) {
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      userId: true,
      rooms: { select: { id: true, name: true, type: true } },
    },
  });
  if (!home) return;

  const templates = await getSeedableTemplates();

  // Room-scoped
  for (const room of home.rooms) {
    const roomTemplates = templates.filter(
      (tpl) => isRoomScoped(tpl) && tpl.category === room.type
    );
    for (const tpl of roomTemplates) {
      await upsertFromTemplate({
        userId: home.userId,
        homeId: home.id,
        roomId: room.id,
        itemName: room.name, // e.g., "Primary Bathroom"
        location: room.name,
        taskTemplate: tpl,
        sourceType: "room",
      });
    }
  }

  // Home-scoped
  const homeTemplates = templates.filter((tpl) => !isRoomScoped(tpl));
  for (const tpl of homeTemplates) {
    await upsertFromTemplate({
      userId: home.userId,
      homeId: home.id,
      roomId: null,
      itemName: "Home",
      location: null,
      taskTemplate: tpl,
      sourceType: "home",
    });
  }
}

/** Seed room-scoped tasks for a single room (matching category === room.type). */
export async function generateTasksFromTemplatesForRoom(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      type: true,
      home: { select: { id: true, userId: true } },
    },
  });
  if (!room || !room.home) return;

  const templates = await getSeedableTemplates();
  const roomTemplates = templates.filter(
    (tpl) => isRoomScoped(tpl) && tpl.category === room.type
  );
  for (const tpl of roomTemplates) {
    await upsertFromTemplate({
      userId: room.home.userId,
      homeId: room.home.id,
      roomId: room.id,
      itemName: room.name,
      location: room.name,
      taskTemplate: tpl,
      sourceType: "room",
    });
  }
}
