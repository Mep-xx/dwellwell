// dwellwell-api/scripts/seedRules.ts
import { prisma } from "../src/db/prisma";

/**
 * Seeds DB-backed rules that mirror your previous hard-coded rules.
 * Safe to re-run: uses upserts keyed by 'key'.
 */
async function main() {
  const rules: Array<{
    key: string;
    scope: "home" | "room" | "trackable";
    reevalOn?: string[];
    template: {
      title: string;
      description?: string | null;
      icon?: string | null;
      imageUrl?: string | null;
      category?: string | null;
      recurrenceInterval: string;
      taskType?: "GENERAL";
      criticality?: "low" | "medium" | "high";
      canDefer?: boolean;
      deferLimitDays?: number;
      estimatedTimeMinutes?: number;
      estimatedCost?: number;
      canBeOutsourced?: boolean;
      steps?: string[];
      equipmentNeeded?: string[];
      resources?: any;
    };
    conditions: Array<{
      target: "home" | "room" | "room_detail" | "trackable";
      field: string;
      op:
        | "eq"
        | "ne"
        | "contains"
        | "not_contains"
        | "exists"
        | "not_exists"
        | "gte"
        | "lte"
        | "in"
        | "not_in";
      value?: string;
      values?: string[];
      idx?: number;
    }>;
  }> = [
    // ——— HOME RULES ———
    {
      key: "home_baseline_walk_exterior_quarterly",
      scope: "home",
      reevalOn: [],
      template: {
        title: "Walk exterior & check for issues",
        description:
          "Walk around the exterior. Look for peeling caulk/paint, cracks, downspout clogs, loose siding, and other damage.",
        icon: "👟",
        category: "Exterior",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 15,
        canDefer: true,
        steps: ["Walk perimeter", "Note issues", "Plan fixes"],
      },
      conditions: [],
    },
    {
      key: "home_baseline_test_smoke_detectors_monthly",
      scope: "home",
      template: {
        title: "Test smoke detectors",
        description:
          "Press-and-hold the test button; replace units older than 10 years.",
        icon: "🚨",
        category: "Safety",
        recurrenceInterval: "1 month",
        taskType: "GENERAL",
        criticality: "high",
        estimatedTimeMinutes: 5,
        canDefer: true,
      },
      conditions: [],
    },
    {
      key: "home_baseline_check_fire_extinguisher_quarterly",
      scope: "home",
      template: {
        title: "Check fire extinguisher gauge & date",
        description:
          "Ensure the gauge is in the green, shake dry-chem models, and confirm the manufacture date is within service life.",
        icon: "🧯",
        category: "Safety",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "high",
        estimatedTimeMinutes: 5,
        canDefer: true,
      },
      conditions: [],
    },
    {
      key: "home_hvac_replace_filter_monthly",
      scope: "home",
      reevalOn: ["hasCentralAir", "hasHeatPump"],
      template: {
        title: "Replace/inspect HVAC filter",
        description:
          "Turn off system, replace or clean the return air filter. More frequent if you have pets or allergies.",
        icon: "🪣",
        category: "HVAC",
        recurrenceInterval: "1 month",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 10,
        canDefer: true,
      },
      conditions: [
        { target: "home", field: "hasCentralAir", op: "eq", value: "true", idx: 0 },
      ],
    },
    {
      key: "home_hvac_replace_filter_monthly_heatpump",
      scope: "home",
      reevalOn: ["hasHeatPump"],
      template: {
        title: "Replace/inspect HVAC filter",
        description:
          "Turn off system, replace or clean the return air filter. More frequent if you have pets or allergies.",
        icon: "🪣",
        category: "HVAC",
        recurrenceInterval: "1 month",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 10,
        canDefer: true,
      },
      conditions: [
        { target: "home", field: "hasHeatPump", op: "eq", value: "true", idx: 0 },
      ],
    },
    {
      key: "home_roof_inspect_semiannual",
      scope: "home",
      reevalOn: ["roofType"],
      template: {
        title: "Inspect roof & flashings",
        description:
          "Walk the perimeter, scan for damage, and check flashing & vents.",
        icon: "🏠",
        category: "Exterior",
        recurrenceInterval: "6 months",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 30,
        steps: ["Walk perimeter", "Inspect shingles/metal", "Check flashing & vents"],
      },
      conditions: [{ target: "home", field: "roofType", op: "exists", idx: 0 }],
    },
    {
      key: "home_clean_gutters_quarterly",
      scope: "home",
      template: {
        title: "Clean gutters",
        description: "Remove debris and flush downspouts.",
        icon: "🧹",
        category: "Exterior",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 45,
        canBeOutsourced: true,
        steps: ["Scoop debris", "Flush downspouts"],
      },
      conditions: [],
    },
    {
      key: "home_siding_wood_inspect_clean_annual",
      scope: "home",
      reevalOn: ["sidingType"],
      template: {
        title: "Inspect & clean wood siding",
        description:
          "Check for peeling paint, mildew, soft spots; wash gently and plan repaint or sealing as needed.",
        icon: "🧽",
        category: "Exterior",
        recurrenceInterval: "1 year",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 45,
        canBeOutsourced: true,
      },
      conditions: [
        { target: "home", field: "sidingType", op: "contains", value: "wood", idx: 0 },
      ],
    },

    // ——— ROOM RULES ———
    {
      key: "room_bedroom_rotate_mattress_quarterly",
      scope: "room",
      template: {
        title: "Rotate mattress",
        description: "Rotate 180° to distribute wear.",
        icon: "🛏️",
        category: "Bedroom",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "low",
        estimatedTimeMinutes: 10,
        steps: ["Strip bed", "Rotate 180°", "Remake bed"],
      },
      conditions: [{ target: "room", field: "type", op: "contains", value: "bedroom", idx: 0 }],
    },
    {
      key: "room_bedroom_test_smoke_monthly",
      scope: "room",
      template: {
        title: "Test smoke detector",
        recurrenceInterval: "1 month",
        category: "Safety",
        taskType: "GENERAL",
        criticality: "high",
        estimatedTimeMinutes: 3,
        icon: "🚨",
      },
      conditions: [
        { target: "room", field: "type", op: "contains", value: "bedroom", idx: 0 },
        { target: "room_detail", field: "hasSmokeDetector", op: "eq", value: "true", idx: 1 },
      ],
    },
    {
      key: "room_bedroom_replace_detector_batteries_semiannual",
      scope: "room",
      template: {
        title: "Replace detector batteries",
        recurrenceInterval: "6 months",
        category: "Safety",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 10,
        icon: "🔋",
      },
      conditions: [
        { target: "room", field: "type", op: "contains", value: "bedroom", idx: 0 },
        { target: "room_detail", field: "hasSmokeDetector", op: "eq", value: "true", idx: 1 },
      ],
    },
    {
      key: "room_bedroom_dust_ceiling_fan_monthly",
      scope: "room",
      template: {
        title: "Dust ceiling fan",
        recurrenceInterval: "1 month",
        category: "General",
        taskType: "GENERAL",
        criticality: "low",
        estimatedTimeMinutes: 10,
        icon: "🧹",
      },
      conditions: [
        { target: "room", field: "type", op: "contains", value: "bedroom", idx: 0 },
        { target: "room_detail", field: "hasCeilingFan", op: "eq", value: "true", idx: 1 },
      ],
    },
    {
      key: "room_kitchen_clean_range_hood_filter_quarterly",
      scope: "room",
      template: {
        title: "Clean range hood filter",
        description: "Remove and clean or replace the range hood filter to keep airflow strong.",
        icon: "🍳",
        category: "Kitchen",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 10,
      },
      conditions: [{ target: "room", field: "type", op: "contains", value: "kitchen", idx: 0 }],
    },
    {
      key: "room_kitchen_check_gfci_quarterly",
      scope: "room",
      template: {
        title: "Test GFCI outlets",
        description: "Use the TEST/RESET buttons to verify protection is working.",
        icon: "⚡",
        category: "Safety",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "high",
        estimatedTimeMinutes: 5,
      },
      conditions: [
        { target: "room", field: "type", op: "contains", value: "kitchen", idx: 0 },
        { target: "room_detail", field: "hasGfci", op: "eq", value: "true", idx: 1 },
      ],
    },
    {
      key: "room_bathroom_clean_exhaust_fan_quarterly",
      scope: "room",
      template: {
        title: "Clean bathroom exhaust fan grille",
        description: "Vacuum/wipe the grille so humidity clears quickly and prevents mildew.",
        icon: "🧼",
        category: "Bathroom",
        recurrenceInterval: "3 months",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 10,
      },
      conditions: [{ target: "room", field: "type", op: "contains", value: "bathroom", idx: 0 }],
    },
    {
      key: "room_bathroom_recaulk_annual",
      scope: "room",
      template: {
        title: "Inspect & re-caulk tub/shower",
        description: "Clean old caulk, dry area, apply fresh silicone to prevent leaks and mold.",
        icon: "🧴",
        category: "Bathroom",
        recurrenceInterval: "1 year",
        taskType: "GENERAL",
        criticality: "medium",
        estimatedTimeMinutes: 60,
      },
      conditions: [{ target: "room", field: "type", op: "contains", value: "bathroom", idx: 0 }],
    },
    {
      key: "room_living_dust_returns_monthly",
      scope: "room",
      template: {
        title: "Dust vents/returns",
        description: "Vacuum vent covers and returns to improve airflow and reduce dust.",
        icon: "🧹",
        category: "General",
        recurrenceInterval: "1 month",
        taskType: "GENERAL",
        criticality: "low",
        estimatedTimeMinutes: 10,
      },
      conditions: [
        {
          target: "room",
          field: "type",
          op: "in",
          values: ["living room", "dining room", "playroom", "library / study"],
          idx: 0,
        },
      ],
    },
  ];

  for (const r of rules) {
    // ⬇️ Include the relation so TS knows .template exists
    const existing = await prisma.taskGenRule.findUnique({
      where: { key: r.key },
      include: { template: true },
    });

    if (!existing) {
      const created = await prisma.taskGenRule.create({
        data: {
          key: r.key,
          scope: r.scope as any,
          enabled: true,
          reevalOn: r.reevalOn ?? [],
          template: {
            create: {
              title: r.template.title,
              description: r.template.description ?? null,
              icon: r.template.icon ?? null,
              imageUrl: r.template.imageUrl ?? null,
              category: r.template.category ?? null,
              recurrenceInterval: r.template.recurrenceInterval,
              taskType: "GENERAL",
              criticality: (r.template.criticality as any) ?? "medium",
              canDefer: r.template.canDefer ?? true,
              deferLimitDays: r.template.deferLimitDays ?? 0,
              estimatedTimeMinutes: r.template.estimatedTimeMinutes ?? 30,
              estimatedCost: r.template.estimatedCost ?? 0,
              canBeOutsourced: r.template.canBeOutsourced ?? false,
              steps: r.template.steps ?? [],
              equipmentNeeded: r.template.equipmentNeeded ?? [],
              resources: r.template.resources ?? undefined,
            },
          },
          conditions: {
            create: r.conditions.map((c, i) => ({
              target: c.target as any,
              field: c.field,
              op: c.op as any,
              value: c.value ?? null,
              values: c.values ?? [],
              idx: c.idx ?? i,
            })),
          },
        },
      });
      console.log("Created rule:", created.key);
    } else {
      await prisma.taskGenRule.update({
        where: { id: existing.id },
        data: {
          scope: r.scope as any,
          enabled: true,
          reevalOn: r.reevalOn ?? [],
          template: existing.template
            ? {
                update: {
                  title: r.template.title,
                  description: r.template.description ?? null,
                  icon: r.template.icon ?? null,
                  imageUrl: r.template.imageUrl ?? null,
                  category: r.template.category ?? null,
                  recurrenceInterval: r.template.recurrenceInterval,
                  taskType: "GENERAL",
                  criticality: (r.template.criticality as any) ?? "medium",
                  canDefer: r.template.canDefer ?? true,
                  deferLimitDays: r.template.deferLimitDays ?? 0,
                  estimatedTimeMinutes:
                    r.template.estimatedTimeMinutes ?? 30,
                  estimatedCost: r.template.estimatedCost ?? 0,
                  canBeOutsourced: r.template.canBeOutsourced ?? false,
                  steps: r.template.steps ?? [],
                  equipmentNeeded: r.template.equipmentNeeded ?? [],
                  resources: r.template.resources ?? undefined,
                },
              }
            : {
                create: {
                  title: r.template.title,
                  description: r.template.description ?? null,
                  icon: r.template.icon ?? null,
                  imageUrl: r.template.imageUrl ?? null,
                  category: r.template.category ?? null,
                  recurrenceInterval: r.template.recurrenceInterval,
                  taskType: "GENERAL",
                  criticality: (r.template.criticality as any) ?? "medium",
                  canDefer: r.template.canDefer ?? true,
                  deferLimitDays: r.template.deferLimitDays ?? 0,
                  estimatedTimeMinutes:
                    r.template.estimatedTimeMinutes ?? 30,
                  estimatedCost: r.template.estimatedCost ?? 0,
                  canBeOutsourced: r.template.canBeOutsourced ?? false,
                  steps: r.template.steps ?? [],
                  equipmentNeeded: r.template.equipmentNeeded ?? [],
                  resources: r.template.resources ?? undefined,
                },
              },
        },
      });

      // replace conditions
      await prisma.taskGenRuleCondition.deleteMany({ where: { ruleId: existing.id } });
      if (r.conditions.length) {
        await prisma.taskGenRuleCondition.createMany({
          data: r.conditions.map((c, i) => ({
            ruleId: existing.id,
            target: c.target as any,
            field: c.field,
            op: c.op as any,
            value: c.value ?? null,
            values: c.values ?? [],
            idx: c.idx ?? i,
          })),
        });
      }

      console.log("Updated rule:", r.key);
    }
  }
}

main()
  .then(() => {
    console.log("Rules seeded.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
