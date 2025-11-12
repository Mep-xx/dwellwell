// dwellwell-api/src/services/taskgen/fromTemplates.ts
import crypto from "crypto";
import { prisma } from "../../db/prisma";
import { initialDueDate } from "./dates";
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

const tplSelect = {
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
} as const;

type TemplatePick = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  category: string | null;
  recurrenceInterval: string | null;
  taskType: string | null; // "GENERAL" | "AI_GENERATED" | "USER_DEFINED" (we'll treat as string)
  criticality: "low" | "medium" | "high" | null;
  canDefer: boolean | null;
  deferLimitDays: number | null;
  estimatedTimeMinutes: number | null;
  estimatedCost: number | null;
  canBeOutsourced: boolean | null;
  steps: string[] | null;
  equipmentNeeded: string[] | null;
  resources: unknown | null;
  version: number | null;
};

function isRoomScoped(t: TemplatePick) {
  return !!t.category && ROOM_TYPES.includes(t.category);
}

type ConcreteTemplateFields = {
  description: string;
  dueDate: Date;
  status: "PENDING";
  category: string;
  estimatedTimeMinutes: number;
  estimatedCost: number;
  criticality: "low" | "medium" | "high";
  deferLimitDays: number;
  canBeOutsourced: boolean;
  canDefer: boolean;
  recurrenceInterval: string;
  taskType: string; // e.g., "GENERAL"
  steps?: unknown;
  equipmentNeeded?: unknown;
  resources?: unknown;
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
    criticality: tpl.criticality ?? "medium",
    deferLimitDays: tpl.deferLimitDays ?? 0,
    canBeOutsourced: tpl.canBeOutsourced ?? false,
    canDefer: tpl.canDefer ?? true,
    recurrenceInterval: tpl.recurrenceInterval ?? "",
    taskType: tpl.taskType ?? "GENERAL",
    steps: tpl.steps && tpl.steps.length ? (tpl.steps as unknown) : undefined,
    equipmentNeeded:
      tpl.equipmentNeeded && tpl.equipmentNeeded.length
        ? (tpl.equipmentNeeded as unknown)
        : undefined,
    resources: tpl.resources ?? undefined,
    icon: tpl.icon ?? undefined,
    imageUrl: tpl.imageUrl ?? undefined,
    sourceTemplateVersion: tpl.version ?? undefined,
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
  sourceType: "room" | "home";
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

  const due = initialDueDate(null, taskTemplate.recurrenceInterval ?? "");
  const fields = materializeTemplateFields(taskTemplate, due);

  const safeTitle = taskTemplate.title || "Home Maintenance Task";

  // Cast to any to stay compatible across Prisma v4/v6 JSON & enum typings.
  const baseUpdate: any = {
    homeId,
    roomId,
    trackableId: null as string | null,
    itemName,
    location,

    // requireds
    title: safeTitle,
    taskType: fields.taskType as any,
    criticality: fields.criticality as any,
    recurrenceInterval: fields.recurrenceInterval,

    // concretes
    description: fields.description,
    dueDate: fields.dueDate,
    status: fields.status,
    category: fields.category,
    estimatedTimeMinutes: fields.estimatedTimeMinutes,
    estimatedCost: fields.estimatedCost,
    deferLimitDays: fields.deferLimitDays,
    canBeOutsourced: fields.canBeOutsourced,
    canDefer: fields.canDefer,
    steps: fields.steps as any,
    equipmentNeeded: fields.equipmentNeeded as any,
    resources: fields.resources as any,
    icon: fields.icon,
    imageUrl: fields.imageUrl,
    sourceTemplateVersion: fields.sourceTemplateVersion,
  };

  const baseCreate: any = {
    userId,
    homeId,
    roomId,
    trackableId: null as string | null,
    taskTemplateId: taskTemplate.id,
    sourceType,
    dedupeKey,
    itemName,
    location,

    // requireds
    title: safeTitle,
    taskType: fields.taskType as any,
    criticality: fields.criticality as any,
    recurrenceInterval: fields.recurrenceInterval,

    // concretes
    description: fields.description,
    dueDate: fields.dueDate,
    status: fields.status,
    category: fields.category,
    estimatedTimeMinutes: fields.estimatedTimeMinutes,
    estimatedCost: fields.estimatedCost,
    deferLimitDays: fields.deferLimitDays,
    canBeOutsourced: fields.canBeOutsourced,
    canDefer: fields.canDefer,
    steps: fields.steps as any,
    equipmentNeeded: fields.equipmentNeeded as any,
    resources: fields.resources as any,
    icon: fields.icon,
    imageUrl: fields.imageUrl,
    sourceTemplateVersion: fields.sourceTemplateVersion,
  };

  await prisma.userTask.upsert({
    where: { userId_dedupeKey: { userId, dedupeKey } },
    update: baseUpdate,
    create: baseCreate,
  });
}

/** Fetch VERIFIED templates that are NOT trackable-linked (no kind/catalog links). */
async function getSeedableTemplates(): Promise<TemplatePick[]> {
  const rows = await prisma.taskTemplate.findMany({
    where: {
      state: "VERIFIED",
      TrackableKindTaskTemplate: { none: {} },
      ApplianceTaskTemplate: { none: {} },
    },
    select: tplSelect,
  });
  return rows as unknown as TemplatePick[];
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
        itemName: room.name,
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
