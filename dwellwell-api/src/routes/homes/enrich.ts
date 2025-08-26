import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { prisma } from "../../db/prisma";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/homes/:homeId/enrich
 * - Calls OpenAI to generate a PATCH of suggested fields.
 * - Writes a record to AIQueryHistory (schema-agnostic: works with/without userId).
 * - Returns { id?: string, patch: object }
 */
router.post("/homes/:homeId/enrich", requireAuth, async (req, res) => {
  const { homeId } = req.params;
  // support either req.user or req.ctx.user
  const userId: string | undefined =
    (req as any)?.user?.id ?? (req as any)?.ctx?.user?.id ?? undefined;
  const hints = req.body?.hints ?? {};

  try {
    const home = await prisma.home.findUnique({
      where: { id: homeId },
      include: { rooms: true },
    });
    if (!home) return res.status(404).json({ message: "Home not found" });

    const addressLine = `${home.address}, ${home.city}, ${home.state} ${home.zip}`;
    const system = `You are enriching metadata for a residential home. 
Return ONLY valid JSON with any of these optional fields:

{
  "nickname": string,
  "squareFeet": number,
  "lotSize": number,
  "yearBuilt": number,
  "architecturalStyle": string,
  "hasCentralAir": boolean,
  "hasBaseboard": boolean,
  "boilerType": string,
  "roofType": string,
  "sidingType": string,
  "features": string[],
  "rooms": [{"name": string, "type": string, "floor": number}]
}

Floor mapping: Basement:-1, 1st:1, 2nd:2, 3rd:3, Attic:99, Other:0.
If you are not confident about a field, omit it. Never fabricate the address.`;

    const user = `Address: ${addressLine}
Known fields:
- nickname: ${home.nickname ?? ""}
- squareFeet: ${home.squareFeet ?? ""}
- lotSize: ${home.lotSize ?? ""}
- yearBuilt: ${home.yearBuilt ?? ""}
- architecturalStyle: ${home.architecturalStyle ?? ""}
- hasCentralAir: ${home.hasCentralAir}
- hasBaseboard: ${home.hasBaseboard}
- boilerType: ${home.boilerType ?? ""}
- roofType: ${home.roofType ?? ""}
- sidingType: ${home.sidingType ?? ""}
- features: ${(home.features ?? []).join(", ")}
Hints: ${JSON.stringify(hints)}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? "{}";
    let patch: any = {};
    try {
      patch = JSON.parse(raw);
    } catch {
      patch = {};
    }

    // Write to AI history (schema-agnostic)
    let historyId: string | undefined;
    try {
      // Try including userId if your schema supports it
      const savedWithUser = await (prisma as any).aIQueryHistory.create({
        data: {
          userId, // may not exist in your schema; if not, we'll fall back
          provider: "openai",
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          requestJson: JSON.stringify({ system, user }),
          responseJson: raw,
        },
      });
      historyId = savedWithUser?.id;
    } catch (err) {
      // Fall back to a minimal create without userId
      try {
        const savedNoUser = await (prisma as any).aIQueryHistory.create({
          data: {
            provider: "openai",
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            requestJson: JSON.stringify({ system, user }),
            responseJson: raw,
          },
        });
        historyId = savedNoUser?.id;
      } catch (err2) {
        // If the table differs completely, just continue; enrichment still returns patch
        console.warn("[enrich] Could not write AIQueryHistory:", err2);
      }
    }

    return res.json({ id: historyId, patch });
  } catch (e) {
    console.error("enrich error", e);
    return res.status(500).json({ message: "Failed to enrich with AI" });
  }
});

export default router;
