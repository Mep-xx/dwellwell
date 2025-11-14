// dwellwell-api/src/routes/ai/taskPlan.ts
import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { prisma } from "../../db/prisma";

const router = Router();

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type TaskPlanInputTask = {
  id: string;
  title: string;
  roomName: string | null;
  itemName: string | null;
  estimatedTimeMinutes: number | null;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  dueDate: string | null;
};

type TaskPlanResponse = {
  planText: string;
  estTotalMinutes?: number | null;
  tagline?: string | null;
  sections?: Array<{ heading: string; body: string }>;
};

router.post(
  "/task-plan",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (!OPENAI_API_KEY) {
      return res
        .status(501)
        .json({ error: "OPENAI_API_KEY not configured" });
    }

    const tasks = (req.body?.tasks || []) as TaskPlanInputTask[];
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res
        .status(400)
        .json({ error: "Provide a non-empty tasks array" });
    }

    // Focus on pending / near-term tasks, cap length to keep prompts cheap
    const pending = tasks.filter((t) => t.status === "PENDING").slice(0, 15);
    if (pending.length === 0) {
      return res.status(200).json({
        planText:
          "You’re all caught up — there’s nothing urgent to do right now. Enjoy the free time!",
      } satisfies TaskPlanResponse);
    }

    const systemPrompt = `
You are a concise, practical home-maintenance assistant.

Goal:
Given a small list of tasks (with rooms, items, and rough durations),
write a SHORT "today's plan" chore list that is motivating but not fluffy.

Tone:
- Friendly, calm, non-judgmental.
- Talk to a busy adult homeowner.
- Do NOT scold them for overdue tasks.

Output requirements:
- Return STRICT JSON (no comments) with:
{
  "planText": string,
  "estTotalMinutes": number,
  "tagline": string | null
}

Where:
- "planText" is 3–8 bullet points or short paragraphs.
  - Refer to rooms and items explicitly (e.g., "In the kitchen, clean the water reservoir on your Ninja coffee maker").
  - Suggest a sensible order (group tasks by proximity: same room or nearby areas together).
  - If tasks seem to total more than ~60–90 minutes, you may suggest doing only the top 3–5 today.
- "estTotalMinutes" is the rough total of all included tasks (sum their durations, default 10–15 if missing).
- "tagline" is a very short encouragement, like "One pass around the house and you’re done."
`.trim();

    const userPayload = {
      tasks: pending.map((t) => ({
        id: t.id,
        title: t.title,
        roomName: t.roomName,
        itemName: t.itemName,
        estimatedTimeMinutes: t.estimatedTimeMinutes,
        status: t.status,
        dueDate: t.dueDate,
      })),
    };

    const userPrompt = `
Here are the tasks to plan around (JSON):

${JSON.stringify(userPayload, null, 2)}

Please follow the JSON schema described in the system prompt.
`.trim();

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";

    let parsed: TaskPlanResponse;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        planText:
          "Start with any overdue items, then move room by room, tackling smaller 10–15 minute jobs first.",
        estTotalMinutes: null,
        tagline: null,
      };
    }

    // Log to AIQueryHistory (best-effort, non-blocking)
    try {
      const userId =
        (req as any)?.ctx?.user?.id || (req as any)?.user?.id || null;
      await prisma.aIQueryHistory.create({
        data: {
          userId: userId ?? undefined,
          query: userPrompt.slice(0, 5000),
          source: `openai:${OPENAI_MODEL}`,
          responseSummary: JSON.stringify(parsed).slice(0, 1000),
        },
      });
    } catch {
      // ignore
    }

    return res.json(parsed);
  }),
);

export default router;
