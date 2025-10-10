// dwellwell-api/src/services/taskgen/enrichApplianceTasks.ts
import OpenAI from "openai";
import { PrismaClient, TaskType, TaskCriticality } from "@prisma/client";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Given a catalog row, ask OpenAI for suggested maintenance tasks,
 * then upsert TaskTemplates and link them with ApplianceTaskTemplate.
 *
 * Returns number of templates linked.
 *
 * Safe to call multiple times (idempotent by (title, recurrenceInterval) match).
 */
export async function enrichApplianceTasks(opts: {
  prisma: PrismaClient;
  catalogId: string;
}) {
  const { prisma, catalogId } = opts;

  if (!OPENAI_API_KEY) {
    await prisma.taskGenerationIssue
      .create({
        data: {
          userId: "system",
          homeId: null,
          roomId: null,
          trackableId: null,
          code: "enrichment_lookup_failed",
          status: "open",
          message: "OPENAI_API_KEY missing; enrichment skipped",
        },
      })
      .catch(() => {});
    return 0;
  }

  const catalog = await prisma.applianceCatalog.findUnique({
    where: { id: catalogId },
  });
  if (!catalog) return 0;

  // If this catalog item already has links, don't regenerate unless desired.
  const existingLinks = await prisma.applianceTaskTemplate.count({
    where: { applianceCatalogId: catalogId },
  });
  if (existingLinks > 0) return existingLinks;

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const system = `
You produce practical, brand-aware home maintenance tasks for a specific appliance model.
Output STRICT JSON: an array of 1–8 task objects.

Each task:
- "title": short, imperative
- "description": 1–2 sentences max
- "recurrenceInterval": a natural cadence like "1 month", "3 months", "6 months", "12 months"
- "criticality": one of: low | medium | high
- "canDefer": boolean
- "deferLimitDays": integer
- "estimatedTimeMinutes": integer <= 120
- "estimatedCost": integer dollars (materials only)
- "canBeOutsourced": boolean
- "category": short area tag (e.g., "appliance", "safety", "kitchen")
- "icon": emoji if obvious, else omit or use "🧰"
- "steps": array of 2–8 plain steps
- "equipmentNeeded": array (e.g., ["Phillips screwdriver","Vacuum"])
- "resources": array of { "label": string, "url": string } (optional, only if confident & generic)
Rules:
- Prefer model-specific tasks (e.g., filters, coils, descaling) and safe cadences.
- Do NOT invent brand web links if unsure.
  `.trim();

  const user = `
APPLIANCE:
{
  "brand": "${catalog.brand}",
  "model": "${catalog.model}",
  "type": "${catalog.type}",
  "category": "${catalog.category}",
  "notes": ${JSON.stringify(catalog.notes || "")}
}

Return ONLY JSON.
  `.trim();

  let content = "[]";
  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    content = completion.choices?.[0]?.message?.content ?? "[]";
  } catch (e) {
    await prisma.taskGenerationIssue
      .create({
        data: {
          userId: "system",
          homeId: null,
          roomId: null,
          trackableId: null,
          code: "enrichment_lookup_failed",
          status: "open",
          message: `OpenAI error for catalogId=${catalogId}`,
          debugPayload: { error: String(e) },
        },
      })
      .catch(() => {});
    return 0;
  }

  function parseFirstJsonBlob(t: string) {
    const m = t.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!m) return [];
    try {
      return JSON.parse(m[0]);
    } catch {
      return [];
    }
  }
  const tasks: any[] = Array.isArray(parseFirstJsonBlob(content))
    ? parseFirstJsonBlob(content)
    : [];

  let linked = 0;
  for (const t of tasks) {
    const title = String(t?.title ?? "").trim();
    const recurrenceInterval = String(t?.recurrenceInterval ?? "").trim() || "6 months";
    if (!title) continue;

    const existing = await prisma.taskTemplate.findFirst({
      where: {
        title,
        recurrenceInterval,
        category: (t?.category ?? null) || null,
      },
    });

    const criticality: TaskCriticality = (() => {
      const c = String(t?.criticality ?? "").toLowerCase();
      return c === "high" ? "high" : c === "low" ? "low" : "medium";
    })();

    const data = {
      title,
      description: t?.description ? String(t.description) : null,
      icon: t?.icon ? String(t.icon) : null,
      imageUrl: null as string | null,
      category: t?.category ? String(t.category) : "appliance",
      recurrenceInterval,
      taskType: ((): TaskType => "GENERAL")(),
      criticality,
      canDefer: typeof t?.canDefer === "boolean" ? Boolean(t.canDefer) : true,
      deferLimitDays: Number.isFinite(+t?.deferLimitDays) ? +t.deferLimitDays : 0,
      estimatedTimeMinutes: Number.isFinite(+t?.estimatedTimeMinutes) ? +t.estimatedTimeMinutes : 15,
      estimatedCost: Number.isFinite(+t?.estimatedCost) ? +t.estimatedCost : 0,
      canBeOutsourced: typeof t?.canBeOutsourced === "boolean" ? Boolean(t.canBeOutsourced) : false,
      steps: Array.isArray(t?.steps) ? t.steps.map((s: any) => String(s)).slice(0, 10) : [],
      equipmentNeeded: Array.isArray(t?.equipmentNeeded)
        ? t.equipmentNeeded.map((s: any) => String(s)).slice(0, 10)
        : [],
      resources: Array.isArray(t?.resources)
        ? t.resources
            .map((r: any) => ({
              label: String(r?.label ?? "").slice(0, 80),
              url: String(r?.url ?? ""),
            }))
            .filter((r: any) => /^https?:\/\//i.test(r.url))
        : undefined,
      state: "VERIFIED" as const,
    };

    const template = existing
      ? await prisma.taskTemplate.update({ where: { id: existing.id }, data })
      : await prisma.taskTemplate.create({ data });

    await prisma.applianceTaskTemplate
      .upsert({
        where: {
          applianceCatalogId_taskTemplateId: {
            applianceCatalogId: catalogId,
            taskTemplateId: template.id,
          },
        },
        update: {},
        create: { applianceCatalogId: catalogId, taskTemplateId: template.id },
      })
      .catch(() => {});

    linked++;
  }

  return linked;
}
