import express from 'express';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility to extract first JSON object/array from an OpenAI response string
function extractJSONFromResponse(text: string): any {
  try {
    const match = text.match(/\{[\s\S]*?\}|\[[\s\S]*?\]/);
    if (!match) throw new Error('No JSON object found in response.');
    return JSON.parse(match[0]);
  } catch (err) {
    console.error('Failed to parse JSON from OpenAI response:', err);
    return null;
  }
}

/**
 * GET /api/ai/lookup-appliance?q=Bosch
 */
router.get('/lookup-appliance', async (req, res) => {
  const q = (req.query.q as string) || (req.query.query as string) || '';
  if (!q) return res.status(400).json({ message: 'Missing q' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: `
Return a JSON array of 5 likely appliances for: "${q}".
Each item must be:
{ "brand": string, "model": string, "type": string, "category": string, "notes": string, "imageUrl": string? }
Use realistic brands/models. Keep "type" concise (e.g. "dishwasher", "water-heater") and "category" from: appliance|kitchen|bathroom|heating|cooling|plumbing|electrical|outdoor|safety|general.
Return only JSON.
`.trim(),
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = extractJSONFromResponse(content);
    if (!parsed || !Array.isArray(parsed)) return res.json([]);

    const normalized = parsed.map((x: any) => ({
      brand: String(x.brand ?? '').slice(0, 64),
      model: String(x.model ?? '').slice(0, 64),
      type: String(x.type ?? '').slice(0, 64),
      category: String(x.category ?? 'general').toLowerCase(),
      notes: x.notes ? String(x.notes).slice(0, 200) : undefined,
      imageUrl: x.imageUrl ? String(x.imageUrl) : undefined,
    }));

    res.json(normalized);
  } catch (err) {
    console.error('AI lookup error:', err);
    res.status(500).json({ message: 'Failed to retrieve AI suggestions' });
  }
});

export default router;
