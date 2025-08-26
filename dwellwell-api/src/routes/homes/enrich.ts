import { Router, Request, Response } from "express";
import { PrismaClient, Home, Room } from "@prisma/client";
import OpenAI from "openai";

// If you already have a shared prisma instance, import that instead.
// e.g. import prisma from "../../db";
const prisma = new PrismaClient();

const router = Router();

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- Try to pull allow-lists from your shared folder; fall back if missing.
let allowedStyles: string[] = [
  "Colonial",
  "Cape Cod",
  "Ranch",
  "Craftsman",
  "Contemporary",
  "Victorian",
  "Tudor",
  "Farmhouse",
  "Bungalow",
  "Split-Level",
  "Townhouse",
];
let allowedRoomTypes: string[] = [
  "Bedroom",
  "Bathroom",
  "Half Bathroom",
  "Primary Bedroom",
  "Primary Bathroom",
  "Kitchen",
  "Dining Room",
  "Living Room",
  "Family Room",
  "Office",
  "Laundry",
  "Mudroom",
  "Pantry",
  "Closet",
  "Basement",
  "Garage",
  "Attic",
  "Utility Room",
  "Deck",
  "Porch",
];

try {
  // Adjust the relative path to your repo layout if needed:
  // This file sits at: dwellwell-api/src/routes/homes/enrich.ts
  // Shared is a sibling of dwellwell-api => "../../../shared/..."
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const sharedStyles = require("../../../shared/architecturalStyleLabels");
  // Supported shapes:
  //   default export: [{value,label}] or named export architecturalStyleLabels
  const stylesArray =
    sharedStyles?.architecturalStyleLabels ||
    sharedStyles?.default ||
    sharedStyles;

  if (Array.isArray(stylesArray)) {
    // Accept either {value,label} or simple strings
    const vals = stylesArray
      .map((s: any) => (typeof s === "string" ? s : s?.value || s?.label))
      .filter(Boolean);
    if (vals.length) allowedStyles = Array.from(new Set(vals));
  }
} catch {
  // keep fallbacks
}

try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const houseRoomTemplates = require("../../../shared/houseRoomTemplates");
  // You might have an object keyed by style with room arrays.
  // Collect all unique room.type values as the allow-list.
  const all = houseRoomTemplates?.default || houseRoomTemplates;
  if (all && typeof all === "object") {
    const set = new Set<string>();
    Object.values(all).forEach((tpl: any) => {
      if (Array.isArray(tpl)) {
        tpl.forEach((r: any) => {
          const t = r?.type || r?.name;
          if (typeof t === "string" && t.trim()) set.add(t.trim());
        });
      }
    });
    if (set.size) allowedRoomTypes = Array.from(set);
  }
} catch {
  // keep fallbacks
}

// --- System prompt
const SYSTEM_PROMPT = `
You are a Property Enrichment Assistant for U.S. residential homes.

Constraints:
- You do not have web browsing. Rely only on the data provided here plus general U.S. real-estate knowledge.
- Be conservative. If a field cannot be inferred with reasonable confidence, omit it.
- Never guess highly specific values (e.g., exact square footage) unless explicitly stated or typical for the home type/era.
- Output must be STRICT JSON (no comments, no trailing commas, no extra text).
- Use the allowed value lists provided in the prompt (e.g., architectural styles, room types). If your best answer is not in the allowed list, omit the field.

Return only keys that you can add value to.
`.trim();

// --- Helper: build the user prompt
function buildUserPrompt(args: {
  current: Record<string, any>;
  hints?: Record<string, any>;
  styles: string[];
  roomTypes: string[];
  contextText?: string;
}): string {
  const { current, hints, styles, roomTypes, contextText } = args;
  const stylesCsv = styles.join(", ");
  const roomTypesCsv = roomTypes.join(", ");
  const currentJson = JSON.stringify(current ?? {}, null, 2);
  const hintsJson = JSON.stringify(hints ?? {}, null, 2);
  const ctxText = (contextText ?? "").trim() || "(none)";

  return [
    `Enhance the following home record. Output ONLY a JSON object with any of these optional keys:\n`,
    `{\n` +
      `  "nickname": string,\n` +
      `  "apartment": string,\n` +
      `  "squareFeet": number,\n` +
      `  "lotSize": number,\n` +
      `  "yearBuilt": number,\n` +
      `  "architecturalStyle": string,\n` +
      `  "hasCentralAir": boolean,\n` +
      `  "hasBaseboard": boolean,\n` +
      `  "boilerType": string,\n` +
      `  "roofType": string,\n` +
      `  "sidingType": string,\n` +
      `  "features": string[],\n` +
      `  "rooms": [{"name": string, "type": string, "floor": number}]\n` +
      `}\n`,
    `ALLOWED_STYLES: ${stylesCsv}`,
    `ALLOWED_ROOM_TYPES: ${roomTypesCsv}\n`,
    `Current (may be null):\n${currentJson}\n`,
    `User hints (optional free text or key-value facts):\n${hintsJson}\n`,
    `Additional context (optional snippets pasted from listings, tax records, or notes; treat as possibly noisy; prefer explicit numbers/dates over adjectives):\n${ctxText}\n`,
    `Rules:\n` +
      `- Prefer precise numbers when they appear in context; otherwise give conservative estimates only when typical for the style/era/region (avoid decimals; round logically).\n` +
      `- If style is unknown, infer from exterior cues if given; otherwise omit.\n` +
      `- For heating/cooling booleans, only set true when context indicates it. If context is silent but era/region strongly implies baseboard or forced-air, you may set a likely boolean; otherwise omit.\n` +
      `- For rooms, suggest a baseline layout for the given architectural style and era; keep it modest and place on floor 1 unless multi-story is clear.\n` +
      `- Never invent owner-specific details unless provided.\n` +
      `- If nothing substantive can be added, return {}.\n`,
  ].join("\n");
}

// --- pick only keys we accept from the model output
const ACCEPTED_KEYS = new Set([
  "nickname",
  "apartment",
  "squareFeet",
  "lotSize",
  "yearBuilt",
  "architecturalStyle",
  "hasCentralAir",
  "hasBaseboard",
  "boilerType",
  "roofType",
  "sidingType",
  "features",
  "rooms",
]);

// --- normalize and filter model output
function normalizeModelOutput(raw: any) {
  const out: Record<string, any> = {};
  if (!raw || typeof raw !== "object") return out;

  for (const key of Object.keys(raw)) {
    if (!ACCEPTED_KEYS.has(key)) continue;
    const val = (raw as any)[key];

    if (key === "architecturalStyle") {
      if (typeof val === "string" && allowedStyles.includes(val)) {
        out[key] = val;
      }
      continue;
    }

    if (key === "rooms") {
      if (Array.isArray(val)) {
        out.rooms = val
          .filter(
            (r: any) =>
              r &&
              typeof r === "object" &&
              typeof r.name === "string" &&
              typeof r.floor === "number" &&
              typeof r.type === "string" &&
              allowedRoomTypes.includes(r.type)
          )
          .map((r: any) => ({
            name: r.name,
            type: r.type,
            floor: r.floor,
          }));
      }
      continue;
    }

    if (key === "features") {
      if (Array.isArray(val)) {
        out.features = val.filter((f: any) => typeof f === "string" && f.trim());
      }
      continue;
    }

    if (key === "squareFeet" || key === "lotSize" || key === "yearBuilt") {
      const n = Number(val);
      if (Number.isFinite(n)) out[key] = Math.round(n);
      continue;
    }

    if (key === "hasCentralAir" || key === "hasBaseboard") {
      if (typeof val === "boolean") out[key] = val;
      continue;
    }

    // passthrough simple strings
    if (
      key === "nickname" ||
      key === "apartment" ||
      key === "boilerType" ||
      key === "roofType" ||
      key === "sidingType"
    ) {
      if (typeof val === "string" && val.trim()) out[key] = val.trim();
      continue;
    }
  }

  return out;
}

function safeJsonParse<T = any>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

router.post("/:homeId/enrich", async (req: Request, res: Response) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(501).json({ error: "OPENAI_API_KEY not configured" });
    }

    const homeId = req.params.homeId;
    if (!homeId) return res.status(400).json({ error: "Missing homeId" });

    const home = await prisma.home.findUnique({
      where: { id: homeId },
      include: { rooms: true },
    });
    if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

    // Build the "current" snapshot for the model
    const current = {
      address: home.address ?? null,
      city: home.city ?? null,
      state: home.state ?? null,
      zip: home.zip ?? null,
      squareFeet: home.squareFeet ?? null,
      yearBuilt: home.yearBuilt ?? null,
      architecturalStyle: home.architecturalStyle ?? null,
      hasCentralAir: home.hasCentralAir ?? null,
      hasBaseboard: home.hasBaseboard ?? null,
      boilerType: home.boilerType ?? null,
      roofType: home.roofType ?? null,
      sidingType: home.sidingType ?? null,
      features: Array.isArray((home as any).features) ? (home as any).features : [],
      rooms: (home.rooms || []).map((r: Room) => ({
        name: r.name,
        type: (r as any).type || "Room",
        floor: (r as any).floor || 1,
      })),
    };

    const hints = (req.body && (req.body as any).hints) || {};
    const contextText: string | undefined =
      (req.body && (req.body as any).contextText) || undefined;

    const userPrompt = buildUserPrompt({
      current,
      hints,
      styles: allowedStyles,
      roomTypes: allowedRoomTypes,
      contextText,
    });

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const raw = safeJsonParse<Record<string, any>>(content) || {};
    const updated = normalizeModelOutput(raw);

    // Compute changed fields vs current (only for top-level accepted keys)
    const changed = Object.keys(updated).reduce<
      { key: string; oldValue: any; newValue: any }[]
    >((acc, key) => {
      const newVal = (updated as any)[key];
      const oldVal =
        key === "rooms"
          ? (current.rooms as any) // compare arrays shallowly as-is
          : (current as any)[key];
      // include all provided keys as "changed" even if equal, because client wants to know what model returned.
      // If you want strict diff, check deep equality and skip equal.
      acc.push({ key, oldValue: oldVal, newValue: newVal });
      return acc;
    }, []);

    // Log to AIQueryHistory
    const userId =
      // prefer middleware-attached context
      (req as any)?.ctx?.user?.id ||
      // optional: if you put user id on req.user
      (req as any)?.user?.id ||
      // fallback: null
      null;

    const responseSummary =
      JSON.stringify(
        {
          updatedKeys: Object.keys(updated),
          preview: raw,
        },
        null,
        2
      ).slice(0, 1000) + (JSON.stringify(raw).length > 1000 ? " …" : "");

    await prisma.aIQueryHistory.create({
      data: {
        userId: userId ?? undefined,
        query: userPrompt,
        source: `openai:${OPENAI_MODEL}`,
        responseSummary,
      },
    });

    // Return a payload your UI can use immediately without saving:
    // - raw: the raw JSON from the model
    // - updated: filtered/normalized fields
    // - changed: array key/old/new for UI toast and inline preview
    // NOTE: We do NOT persist to Home here; the user will click Save on the client.
    return res.json({
      raw,
      updated,
      changed,
      message: `Enhanced: ${changed.length} field(s) returned (not yet saved).`,
    });
  } catch (err: any) {
    console.error("[enrich] error:", err);
    return res.status(500).json({ error: "ENRICH_FAILED", details: String(err?.message || err) });
  }
});

export default router;
