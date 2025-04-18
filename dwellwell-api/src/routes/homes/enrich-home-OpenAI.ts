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
Given the U.S. address: "${address}"

Return a JSON object that estimates the following based on typical suburban homes in the same area.

Only include:
- address: "19 Claflin Farm Ln"
- city: "Northborough"
- state: "MA"
- squareFeet: number (estimate)
- lotSize: number in acres (estimate)
- yearBuilt: number (typical for that area)
- numberOfRooms: number
- features: string[] (e.g., ["garage", "fireplace"])
- imageUrl: "https://via.placeholder.com/300"

Do not include any comments or explanation. Only output a valid JSON object.

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
