// src/routes/homes/enrich.ts
import express from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EnrichReq = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  // send any current values so the model can leave them alone
  current: z.object({
    yearBuilt: z.number().optional(),
    squareFeet: z.number().optional(),
    lotSize: z.number().optional(),
    numberOfRooms: z.number().optional(),
    hasCentralAir: z.boolean().optional(),
    hasBaseboard: z.boolean().optional(),
    boilerType: z.string().optional(),
    roofType: z.string().optional(),
    sidingType: z.string().optional(),
    architecturalStyle: z.string().optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
});

const EnrichOut = z.object({
  yearBuilt: z.number().optional(),
  squareFeet: z.number().optional(),
  lotSize: z.number().optional(),
  numberOfRooms: z.number().optional(),
  hasCentralAir: z.boolean().optional(),
  hasBaseboard: z.boolean().optional(),
  boilerType: z.string().optional(),
  roofType: z.string().optional(),
  sidingType: z.string().optional(),
  architecturalStyle: z.string().optional(),
  features: z.array(z.string()).optional(),
});

router.post('/homes/:id/enrich', async (req, res) => {
  const parse = EnrichReq.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'INVALID_BODY' });

  const { address, city, state, zip, current } = parse.data;

  const system = `You infer home basics. If unsure, leave a field out. Reply ONLY with JSON.`;
  const user = {
    address: [address, city, state, zip].filter(Boolean).join(', '),
    current,
    want: Object.keys(EnrichOut.shape),
    notes: [
      "If the style can be inferred (e.g., 'Colonial', 'Ranch', etc.), return it.",
      "Boiler/furnace types can be 'Gas-Fired', 'Oil-Fired', 'Electric', etc.",
      "Only include fields you feel reasonably confident about."
    ]
  };

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(user) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    let data: unknown = {};
    try { data = JSON.parse(raw); } catch { /* ignore */ }

    const validated = EnrichOut.safeParse(data);
    if (!validated.success) {
      return res.json({ ok: true, data: {} });
    }
    return res.json({ ok: true, data: validated.data });
  } catch (e) {
    console.error('enrich error', e);
    return res.status(500).json({ error: 'OPENAI_ERROR' });
  }
});

export default router;
