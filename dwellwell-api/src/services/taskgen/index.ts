//dwellwell-api/src/services/taskgen/index.ts
import crypto from "crypto";
import { prisma } from "../../db/prisma";
import type { TaskTemplate, TaskType, TaskCriticality } from "@prisma/client";
import { addByInterval, initialDueDate } from "./dates";
import {
    homeRules,
    roomRules,
    trackableRules,
    trackableModelRules,
    type RuleContext,
    type Rule,
    type TemplateSeed,
} from "./rules";
import { getTrackableDisplay } from "../../services/trackables/display";

/** ─────────────────────────────────────────────────────
 * Template + UserTask helpers
 * ──────────────────────────────────────────────────── */

async function ensureTemplate(key: string, seed: TemplateSeed): Promise<TaskTemplate> {
    // We emulate a stable “key” by (title, category, recurrenceInterval)
    const existing = await prisma.taskTemplate.findFirst({
        where: {
            title: seed.title,
            category: seed.category ?? null,
            recurrenceInterval: seed.recurrenceInterval,
        },
    });

    if (existing) {
        // Light-touch update (don’t stomp admin edits if already set)
        const updated = await prisma.taskTemplate.update({
            where: { id: existing.id },
            data: {
                description: existing.description ?? seed.description ?? undefined,
                icon: existing.icon ?? seed.icon ?? undefined,
                imageUrl: existing.imageUrl ?? seed.imageUrl ?? undefined,
                taskType: existing.taskType ?? ((seed.taskType as TaskType) ?? "GENERAL"),
                criticality: existing.criticality ?? ((seed.criticality as TaskCriticality) ?? "medium"),
                canDefer: existing.canDefer ?? (seed.canDefer ?? true),
                deferLimitDays: existing.deferLimitDays ?? (seed.deferLimitDays ?? 0),
                estimatedTimeMinutes: existing.estimatedTimeMinutes ?? (seed.estimatedTimeMinutes ?? 30),
                estimatedCost: existing.estimatedCost ?? (seed.estimatedCost ?? 0),
                canBeOutsourced: existing.canBeOutsourced ?? (seed.canBeOutsourced ?? false),
                steps:
                    existing.steps && (existing.steps as any[]).length
                        ? existing.steps
                        : (seed.steps as any) ?? [],
                equipmentNeeded:
                    existing.equipmentNeeded && (existing.equipmentNeeded as any[]).length
                        ? existing.equipmentNeeded
                        : (seed.equipmentNeeded as any) ?? [],
                resources: (existing as any).resources ?? (seed as any).resources ?? undefined,
                changelog: existing.changelog ?? `system-key:${key}`,
            },
        });
        return updated;
    }

    const created = await prisma.taskTemplate.create({
        data: {
            title: seed.title,
            description: seed.description ?? null,
            icon: seed.icon ?? null,
            imageUrl: seed.imageUrl ?? null,
            category: seed.category ?? null,
            recurrenceInterval: seed.recurrenceInterval,
            taskType: ((seed.taskType as TaskType) ?? "GENERAL"),
            criticality: ((seed.criticality as TaskCriticality) ?? "medium"),
            canDefer: seed.canDefer ?? true,
            deferLimitDays: seed.deferLimitDays ?? 0,
            estimatedTimeMinutes: seed.estimatedTimeMinutes ?? 30,
            estimatedCost: seed.estimatedCost ?? 0,
            canBeOutsourced: seed.canBeOutsourced ?? false,
            steps: (seed.steps as any) ?? [],
            equipmentNeeded: (seed.equipmentNeeded as any) ?? [],
            resources: (seed as any).resources ?? undefined,
            version: 1,
            state: "VERIFIED",
            changelog: `system-key:${key}`,
        },
    });
    return created;
}

function makeDedupeKey(parts: (string | null | undefined)[]) {
    const raw = parts.filter(Boolean).join("|");
    return crypto.createHash("sha256").update(raw).digest("hex");
}

async function upsertUserTask(opts: {
    userId: string;
    homeId?: string | null;        // used only for logging issues
    roomId?: string | null;
    trackableId?: string | null;
    taskTemplate: TaskTemplate;
    sourceType: "room" | "trackable";
    titleOverride?: string | null;
    descriptionOverride?: string | null;
    itemName?: string | null;
    location?: string | null;
}) {
    const {
        userId,
        homeId = null,
        roomId = null,
        trackableId = null,
        taskTemplate,
        sourceType,
        titleOverride,
        descriptionOverride,
        itemName,
        location,
    } = opts;

    // Deterministic dedupe key: templateId + user + scope ids
    const dedupeKey = makeDedupeKey([
        "tpl",
        taskTemplate.id,
        "u", userId,
        "r", roomId ?? "",
        "t", trackableId ?? "",
    ]);

    // Anchor: purchaseDate for trackables if present; else today
    const anchor =
        (trackableId
            ? (await prisma.trackable.findUnique({
                where: { id: trackableId },
                select: { purchaseDate: true },
            }))?.purchaseDate
            : null) ?? null;

    const due = initialDueDate(anchor, taskTemplate.recurrenceInterval);

    await prisma.userTask.upsert({
        where: { dedupeKey },
        update: {
            title: titleOverride ?? taskTemplate.title,
            description: descriptionOverride ?? taskTemplate.description ?? "",
            dueDate: due,
            status: "PENDING",
            itemName: itemName ?? "",
            category: taskTemplate.category ?? "general",
            estimatedTimeMinutes: taskTemplate.estimatedTimeMinutes ?? 0,
            estimatedCost: taskTemplate.estimatedCost ?? 0,
            criticality: taskTemplate.criticality,
            deferLimitDays: taskTemplate.deferLimitDays ?? 0,
            canBeOutsourced: taskTemplate.canBeOutsourced ?? false,
            canDefer: taskTemplate.canDefer ?? true,
            recurrenceInterval: taskTemplate.recurrenceInterval,
            taskType: taskTemplate.taskType,
            steps: (taskTemplate.steps as any) ?? undefined,
            equipmentNeeded: (taskTemplate.equipmentNeeded as any) ?? undefined,
            resources: (taskTemplate as any).resources ?? undefined,
            icon: taskTemplate.icon ?? undefined,
            imageUrl: taskTemplate.imageUrl ?? undefined,
            sourceTemplateVersion: taskTemplate.version,
            location: location ?? undefined,
            // keep roomId/trackableId as-is on update (don’t relocate existing tasks implicitly)
        },
        create: {
            userId,
            homeId,
            roomId,
            trackableId,
            taskTemplateId: taskTemplate.id,
            sourceType, // "room" | "trackable"
            title: titleOverride ?? taskTemplate.title,
            description: descriptionOverride ?? taskTemplate.description ?? "",
            dueDate: due,
            status: "PENDING",
            itemName: itemName ?? "",
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
            steps: (taskTemplate.steps as any) ?? undefined,
            equipmentNeeded: (taskTemplate.equipmentNeeded as any) ?? undefined,
            resources: (taskTemplate as any).resources ?? undefined,
            icon: taskTemplate.icon ?? undefined,
            imageUrl: taskTemplate.imageUrl ?? undefined,
            sourceTemplateVersion: taskTemplate.version,
            location: location ?? undefined,
        },
    });
}

/** ─────────────────────────────────────────────────────
 * Rule applicators
 * ──────────────────────────────────────────────────── */

async function applyRules(
    userId: string,
    rules: Rule[],
    ctx: RuleContext,
    scopeIds: { homeId?: string | null; roomId?: string | null; trackableId?: string | null }
) {
    for (const rule of rules) {
        try {
            if (!rule.when(ctx)) continue;

            const tpl = await ensureTemplate(rule.key, rule.template);
            const overrides = rule.toUserTask ? rule.toUserTask(ctx) : {};
            await upsertUserTask({
                userId,
                homeId: scopeIds.homeId ?? null,
                roomId: scopeIds.roomId ?? null,
                trackableId: scopeIds.trackableId ?? null,
                taskTemplate: tpl,
                sourceType: rule.scope === "trackable" ? "trackable" : "room",
                titleOverride: overrides.title ?? null,
                descriptionOverride: overrides.description ?? null,
                itemName: overrides.itemName ?? null,
                location: overrides.location ?? null,
            });
        } catch (err: any) {
            // Log an admin-visible issue if your TaskGenerationIssue table exists
            try {
                await prisma.taskGenerationIssue.create({
                    data: {
                        userId,
                        homeId: scopeIds.homeId ?? null,
                        roomId: scopeIds.roomId ?? null,
                        trackableId: scopeIds.trackableId ?? null,
                        code: "template_eval_error",
                        status: "open",
                        message: String(err?.message ?? err),
                        debugPayload: { ruleKey: (rule as any).key, scopeIds, ctx },
                    },
                });
            } catch {
                // swallow in environments without the admin table
            }
        }
    }
}

/** ─────────────────────────────────────────────────────
 * Public API
 * ──────────────────────────────────────────────────── */

/** Generate/refresh tasks for a specific ROOM (called from your room routes). */
export async function generateTasksForRoom(roomId: string) {
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { home: true, detail: true },
    });
    if (!room) return;

    const userId = room.home.userId;
    const ctx: RuleContext = { home: room.home, room };
    await applyRules(userId, roomRules, ctx, { homeId: room.homeId, roomId: room.id });
}

/** Generate basic home-scoped tasks (use if you add a “Home details saved” trigger). */
export async function generateTasksForHomeBasics(homeId: string) {
    const home = await prisma.home.findUnique({ where: { id: homeId } });
    if (!home) return;

    const userId = home.userId;
    const ctx: RuleContext = { home };
    await applyRules(userId, homeRules, ctx, { homeId });
}

/** Generate generic + (if available) model-specific tasks for a TRACKABLE. */
export async function generateTasksForTrackable(trackableId: string) {
    const t = await prisma.trackable.findUnique({
        where: { id: trackableId },
        include: { home: true, room: true },
    });
    if (!t || !t.home) return;

    const userId = t.home.userId;
    const { composedItemName } = await getTrackableDisplay(trackableId);

    const ctx: RuleContext = { home: t.home, room: t.room, trackable: t };

    // Generic rules
    await applyRules(userId, trackableRules, ctx, {
        homeId: t.homeId ?? null,
        roomId: t.roomId ?? null,
        trackableId,
    });

    // Model-specific
    if ((t.brand && t.brand.trim()) || (t.model && t.model.trim())) {
        await applyRules(userId, trackableModelRules, ctx, {
            homeId: t.homeId ?? null,
            roomId: t.roomId ?? null,
            trackableId,
        });
    }

    // Normalize itemName on all tasks for this trackable (rules may not know display)
    await prisma.userTask.updateMany({
        where: { trackableId, userId, archivedAt: null },
        data: { itemName: composedItemName },
    });
}

/** Optional: explicit issue log helper */
export async function logTaskGenIssue(opts: {
    userId: string;
    homeId?: string | null;
    roomId?: string | null;
    trackableId?: string | null;
    code:
    | "no_matching_template"
    | "enrichment_lookup_failed"
    | "template_eval_error"
    | "upsert_error";
    message?: string;
    debug?: any;
}) {
    try {
        await prisma.taskGenerationIssue.create({
            data: {
                userId: opts.userId,
                homeId: opts.homeId ?? null,
                roomId: opts.roomId ?? null,
                trackableId: opts.trackableId ?? null,
                code: opts.code,
                status: "open",
                message: opts.message ?? null,
                debugPayload: opts.debug ?? null,
            },
        });
    } catch {
        // ignore if admin table not present
    }
}
