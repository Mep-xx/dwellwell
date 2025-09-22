// dwellwell-api/src/services/taskgen/rulesDb.ts
import { prisma } from "../../db/prisma";
import type {
  TaskGenRule,
  TaskGenRuleCondition,
  TaskGenRuleTemplate,
  RuleScope,
  ConditionOp,
  ConditionTarget,
} from "@prisma/client";
import type { Rule, RuleContext, TemplateSeed } from "./rules";

/**
 * Convert DB rows into in-memory Rule[] compatible with taskgen/index.ts
 */

function buildWhen(conds: TaskGenRuleCondition[]): (ctx: RuleContext) => boolean {
  // Simple ALL-of conditions (AND). You can extend to OR groups later.
  return (ctx: RuleContext) => {
    for (const c of conds.sort((a, b) => a.idx - b.idx)) {
      const { target, field, op, value, values } = c;

      // Pick segment of context
      const segment =
        target === "home"
          ? ctx.home
          : target === "room"
          ? ctx.room
          : target === "room_detail"
          ? ctx.room?.detail
          : target === "trackable"
          ? ctx.trackable
          : null;

      const actual = (segment as any)?.[field];

      const v = value ?? null;
      const arr = values ?? [];

      switch (op as ConditionOp) {
        case "exists":
          if (actual === undefined || actual === null) return false;
          break;
        case "not_exists":
          if (!(actual === undefined || actual === null)) return false;
          break;
        case "eq":
          if (String(actual ?? "") !== String(v ?? "")) return false;
          break;
        case "ne":
          if (String(actual ?? "") === String(v ?? "")) return false;
          break;
        case "contains":
          if (!String(actual ?? "").toLowerCase().includes(String(v ?? "").toLowerCase())) return false;
          break;
        case "not_contains":
          if (String(actual ?? "").toLowerCase().includes(String(v ?? "").toLowerCase())) return false;
          break;
        case "gte":
          if (Number(actual ?? NaN) < Number(v ?? NaN)) return false;
          break;
        case "lte":
          if (Number(actual ?? NaN) > Number(v ?? NaN)) return false;
          break;
        case "in":
          if (!arr.map(String).includes(String(actual ?? ""))) return false;
          break;
        case "not_in":
          if (arr.map(String).includes(String(actual ?? ""))) return false;
          break;
        default:
          // unknown op → fail safe (don’t trigger)
          return false;
      }
    }
    return true;
  };
}

function dbTemplateToSeed(t: TaskGenRuleTemplate): TemplateSeed {
  return {
    title: t.title,
    description: t.description ?? undefined,
    icon: t.icon ?? undefined,
    imageUrl: t.imageUrl ?? undefined,
    category: t.category ?? undefined,
    recurrenceInterval: t.recurrenceInterval,
    taskType: t.taskType,
    criticality: t.criticality,
    canDefer: t.canDefer,
    deferLimitDays: t.deferLimitDays,
    estimatedTimeMinutes: t.estimatedTimeMinutes,
    estimatedCost: t.estimatedCost,
    canBeOutsourced: t.canBeOutsourced,
    steps: t.steps ?? [],
    equipmentNeeded: t.equipmentNeeded ?? [],
    resources: t.resources ?? undefined,
  };
}

export type DbRuleBundle = TaskGenRule & {
  template: TaskGenRuleTemplate | null;
  conditions: TaskGenRuleCondition[];
};

let cache:
  | {
      at: number;
      rules: Rule[];
    }
  | null = null;

const CACHE_MS = 10_000; // small cache; tweak as needed

export async function loadRulesFromDb(): Promise<Rule[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rules;

  const rows = await prisma.taskGenRule.findMany({
    where: { enabled: true },
    orderBy: { updatedAt: "desc" },
    include: {
      template: true,
      conditions: true,
    },
  });

  const rules: Rule[] = rows.map((r) => {
    const seed: TemplateSeed = r.template
      ? dbTemplateToSeed(r.template)
      : // fallback (shouldn’t happen because template is expected)
        ({
          title: r.key,
          recurrenceInterval: "3 months",
          taskType: "GENERAL",
          criticality: "medium",
        } as TemplateSeed);

    const when = buildWhen(r.conditions);

    return {
      key: r.key,
      scope: r.scope as any,
      template: seed,
      when,
      // Optional: future support for tweaks from DB (title/itemName overrides, etc.)
    };
  });

  cache = { at: Date.now(), rules };
  return rules;
}

// helpers to slice rules by scope
export async function getHomeRules() {
  const all = await loadRulesFromDb();
  return all.filter((r) => r.scope === "home");
}
export async function getRoomRules() {
  const all = await loadRulesFromDb();
  return all.filter((r) => r.scope === "room");
}
export async function getTrackableRules() {
  const all = await loadRulesFromDb();
  return all.filter((r) => r.scope === "trackable");
}
