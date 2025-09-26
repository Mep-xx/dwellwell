// dwellwell-api/src/services/taskgen/rulesDb.ts
import { prisma } from "../../db/prisma";
import type {
  TaskGenRule,
  TaskGenRuleCondition,
  TaskGenRuleTemplate,
} from "@prisma/client";
import type { Rule, RuleContext, TemplateSeed } from "./rules";

/**
 * Helpers
 */
function normString(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

/**
 * Canonicalize/normalize room types so rules written for "bedroom"/"bathroom"/etc
 * also match variants like "Primary Bedroom", "Guest Room", "Nursery", etc.
 */
function canonicalRoomType(x: unknown) {
  const s = normString(x);
  if (!s) return s;

  if (s.includes("bed") || s.includes("guest") || s.includes("nursery")) return "bedroom";
  if (s.includes("bath")) return "bathroom";
  if (s.includes("kitchen")) return "kitchen";
  if (s.includes("dining")) return "dining room";
  if (s.includes("living")) return "living room";
  if (s.includes("study") || s.includes("office") || s.includes("library")) return "office";
  if (s.includes("play")) return "playroom";
  if (s.includes("laundry") || s.includes("utility")) return "laundry";
  if (s.includes("garage")) return "garage";
  if (s.includes("hall") || s.includes("corridor")) return "hallway";
  return s;
}

/**
 * Convert DB rows into in-memory Rule[] compatible with taskgen/index.ts
 */

function buildWhen(conds: TaskGenRuleCondition[]): (ctx: RuleContext) => boolean {
  // ALL-of conditions (AND)
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

      // Compute actual value; special handling for room.type
      let actual: any = (segment as any)?.[field];
      if (target === "room" && field === "type") {
        actual = canonicalRoomType(actual);
      }

      const v = value ?? null;
      const arr = (values ?? []) as any[];

      switch (op) {
        case "exists":
          if (actual === undefined || actual === null) return false;
          break;

        case "not_exists":
          if (!(actual === undefined || actual === null)) return false;
          break;

        case "eq": {
          // Case-insensitive for strings; numeric-safe for numbers
          if (typeof actual === "number" || typeof v === "number") {
            if (Number(actual) !== Number(v)) return false;
          } else {
            if (normString(actual) !== normString(v)) return false;
          }
          break;
        }

        case "ne": {
          if (typeof actual === "number" || typeof v === "number") {
            if (Number(actual) === Number(v)) return false;
          } else {
            if (normString(actual) === normString(v)) return false;
          }
          break;
        }

        case "contains": {
          // Case-insensitive substring match
          if (!normString(actual).includes(normString(v))) return false;
          break;
        }

        case "not_contains": {
          if (normString(actual).includes(normString(v))) return false;
          break;
        }

        case "gte": {
          if (Number(actual ?? NaN) < Number(v ?? NaN)) return false;
          break;
        }

        case "lte": {
          if (Number(actual ?? NaN) > Number(v ?? NaN)) return false;
          break;
        }

        case "in": {
          // Case-insensitive membership for strings; numeric-safe for numbers
          if (typeof actual === "number") {
            const nums = arr.map((x) => Number(x));
            if (!nums.includes(Number(actual))) return false;
          } else {
            const actualNorm =
              target === "room" && field === "type"
                ? canonicalRoomType(actual)
                : normString(actual);
            const set = new Set(
              arr.map((x) =>
                target === "room" && field === "type" ? canonicalRoomType(x) : normString(x)
              )
            );
            if (!set.has(actualNorm)) return false;
          }
          break;
        }

        case "not_in": {
          if (typeof actual === "number") {
            const nums = arr.map((x) => Number(x));
            if (nums.includes(Number(actual))) return false;
          } else {
            const actualNorm =
              target === "room" && field === "type"
                ? canonicalRoomType(actual)
                : normString(actual);
            const set = new Set(
              arr.map((x) =>
                target === "room" && field === "type" ? canonicalRoomType(x) : normString(x)
              )
            );
            if (set.has(actualNorm)) return false;
          }
          break;
        }

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
      // Optional: future support for per-rule toUserTask overrides from DB
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
