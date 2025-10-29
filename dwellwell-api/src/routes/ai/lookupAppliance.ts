// dwellwell-api/src/routes/ai/lookup-appliance.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../middleware/asyncHandler';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client'; // <-- add this

function extractJSONFromResponse(text: string): any {
  try {
    const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response.');
    return JSON.parse(match[0]);
  } catch (err) {
    console.error('Failed to parse JSON from OpenAI response:', err);
    return null;
  }
}

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = Router();

router.get('/lookup-appliance', asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string) || (req.query.query as string) || '';
  if (!q || !q.trim()) return res.status(400).json({ message: 'Missing q' });

  const raw = q.trim();

  // Tokenize the query
  const tokens = Array.from(new Set(raw.split(/[\s\-_/]+/).map(t => t.trim()).filter(Boolean))).slice(0, 8);

  let catalogCandidates: Array<{
    id: string;
    brand: string;
    model: string;
    type: string | null;
    category: string | null;
  }> = [];

  if (tokens.length) {
    // AND of ORs → each token must match at least one of the text fields
    const whereAnd = q
      ? {
        OR: [
          { brand: { contains: q, mode: 'insensitive' as any } },
          { model: { contains: q, mode: 'insensitive' as any } },
          { type: { contains: q, mode: 'insensitive' as any } },
          { category: { contains: q, mode: 'insensitive' as any } },
        ],
      }
      : undefined;

    catalogCandidates = await prisma.applianceCatalog.findMany({
      where: { AND: whereAnd },
      select: { id: true, brand: true, model: true, type: true, category: true },
      take: 40,
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });
  }

  const ALLOWED_CATEGORIES = [
    'appliance', 'kitchen', 'bathroom', 'heating', 'cooling', 'plumbing', 'electrical', 'outdoor', 'safety', 'general',
    'electronics', 'computing', 'entertainment', 'lighting', 'cleaning', 'tools', 'furniture',
  ];

  const SYSTEM = `
You are a Product Canonicalizer. You cannot browse the web.
Your job: normalize consumer product names into canonical brand + model codes,
then map to a concise type and a category from the allowed list.

Priorities:
1) If a close or exact match exists in the provided CATALOG, prefer that and include "matchedCatalogId".
2) Otherwise, produce NEW normalized candidates (no catalog id).

Conventions:
- "type": concise lowercase noun like "television", "coffee-maker", "dishwasher", "laptop", "router".
- "category": one of: ${ALLOWED_CATEGORIES.join('|')}.
- "brand": normalized brand (e.g., "Samsung", "LG", "Sony", "Bosch", "Whirlpool", "KitchenAid", "GE").
- "model": normalized series/model code. Prefer exact alphanumeric codes (drop marketing fluff).
- "notes": 1 short sentence max (e.g., "55-inch 4K LED TV from Samsung's Crystal UHD line.").
- "imageUrl": use null if uncertain (do NOT invent).
- "matchedCatalogId": only include when selecting a candidate from the provided CATALOG.

Brand-aware hints (no browsing; use general knowledge & naming patterns):
- Samsung TVs: "Crystal UHD U8000F" likely maps to codes like "UN55U8000F" (UN + size + series + suffix).
- Sony Bravia: model codes like "XR-55X90K" (or similar XR/XR- prefixes).
- LG TVs: webOS OLED/C-series like "OLED55C3PUA" style codes; NanoCell "55NANO90..." etc.
- Bosch dishwashers: "SilencePlus" is a marketing line; canonical model codes like "SHXM63W55N".
- Apple laptops: "MacBook Pro 14-inch (M3)" -> keep series as "MacBook Pro 14", model code optional.

Output strictly JSON (array of up to 5), each item:
{
  "brand": string,
  "model": string,
  "type": string,
  "category": string,
  "notes": string,
  "imageUrl": string | null,
  "matchedCatalogId": string | null
}
`.trim();

  const catalogView = catalogCandidates.map(c => ({
    id: c.id, brand: c.brand, model: c.model, type: c.type ?? null, category: c.category ?? null,
  }));

  const USER = `
INPUT: "${raw}"

CATALOG (up to 40):
${JSON.stringify(catalogView, null, 2)}

Goals:
- Return up to 5 best candidates.
- If a CATALOG entry is a strong match, pick it (set matchedCatalogId to that id, and copy its brand/model/type/category).
- If no strong match, propose normalized NEW entries with matchedCatalogId = null.
- Be conservative if unsure: leave imageUrl as null.

Return ONLY JSON (no comments).
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: USER },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '[]';
    const parsed = extractJSONFromResponse(content);
    const arr = Array.isArray(parsed) ? parsed : [];

    const normalized = arr.slice(0, 5).map((x: any) => ({
      brand: String(x?.brand ?? '').slice(0, 64),
      model: String(x?.model ?? '').slice(0, 64),
      type: String(x?.type ?? '').toLowerCase().slice(0, 64),
      category: ALLOWED_CATEGORIES.includes(String(x?.category ?? '').toLowerCase())
        ? String(x.category).toLowerCase()
        : 'general',
      notes: x?.notes ? String(x.notes).slice(0, 200) : '',
      imageUrl: x?.imageUrl && /^https?:\/\//i.test(String(x.imageUrl)) ? String(x.imageUrl) : null,
      matchedCatalogId: typeof x?.matchedCatalogId === 'string' ? x.matchedCatalogId : null,
    }));

    try {
      const userId = (req as any)?.ctx?.user?.id || (req as any)?.user?.id || null;
      await prisma.aIQueryHistory.create({
        data: {
          userId: userId ?? undefined,
          query: `lookup-appliance: ${raw}\n\nCATALOG_CONTEXT=${catalogView.length}`,
          source: `openai:${OPENAI_MODEL}`,
          responseSummary: JSON.stringify({ count: normalized.length, first: normalized[0] ?? null }).slice(0, 1000),
        },
      });
    } catch { /* non-fatal */ }

    res.json(normalized);
  } catch (err) {
    console.error('AI lookup error:', err);
    res.status(500).json({ message: 'Failed to retrieve AI suggestions' });
  }
}));

export default router;
