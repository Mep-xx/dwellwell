// dwellwell-api/src/routes/homes/enrich-home.ts
import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { OpenAI } from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/enrich-home', requireAuth, async (req, res) => {
  const userId = (req as any).user.userId;
  const { address } = req.body;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid address' });
  }

  const prompt = `
You are given a home address: "${address}"

Parse this address and return the following as a JSON object:

- address: string (just the street address, e.g., "19 Claflin Farm Ln")
- city: string (e.g., "Northborough")
- state: string (2-letter abbreviation, e.g., "MA")
- nickname: string (optional user-friendly name like "Lake House")
- squareFeet: number (estimate if unknown)
- lotSize: number (in acres, estimate if unknown)
- yearBuilt: number (estimate if unknown)
- numberOfRooms: number (estimate if unknown)
- features: string[] (e.g. ["garage", "fireplace", "central air"])
- imageUrl: string (use "https://via.placeholder.com/300" if unknown)

Return only a valid JSON object. No comments, notes, or explanation.
`.trim();

  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return res.status(500).json({ message: 'No response from OpenAI' });

    const data = JSON.parse(content);

    console.log('Saving home for userId:', userId);
    const saved = await prisma.home.create({
      data: {
        userId,
        address: data.address,
        city: data.city,
        state: data.state,
        nickname: data.nickname ?? null,
        squareFeet: data.squareFeet ?? null,
        lotSize: data.lotSize ?? null,
        yearBuilt: data.yearBuilt ?? null,
        numberOfRooms: data.numberOfRooms ?? null,
        imageUrl: data.imageUrl ?? 'https://via.placeholder.com/300',
        features: Array.isArray(data.features) ? data.features : []
      },
    });

    console.log(saved);

    return res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to enrich or save home:', err);
    return res.status(500).json({ message: 'Error saving enriched home' });
  }
});

export default router;
