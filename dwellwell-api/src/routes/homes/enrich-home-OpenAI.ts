// dwellwell-api/src/routes/homes/enrich-home-OpenAI.ts

import express from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { OpenAI } from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/enrich-home', requireAuth, async (req, res) => {
  const { address, city, state } = req.body;

  if (!address || typeof address !== 'string' || !city || !state) {
    return res.status(400).json({ message: 'Missing or invalid address, city, or state' });
  }

  const prompt = `
Given the full address: "${address}, ${city}, ${state}", attempt to find accurate property details based on real-world public sources like Zillow, Redfin, Realtor.com, or similar.

If accurate information cannot be found, provide your best estimate based on similar homes in the area.

Return ONLY a valid JSON object with the following fields:

- address: (string) Full street address
- city: (string) City name
- state: (string) Two-letter U.S. state abbreviation
- squareFeet: (number) Estimated living area in square feet
- lotSize: (number) Lot size in acres
- yearBuilt: (number) Year the home was built
- numberOfRooms: (number) Estimated total number of rooms
- features: (string[]) List of notable features
- imageUrl: (string) Placeholder (default: null)
- architecturalStyle: (string) Common architectural style (e.g., "Colonial")

⚠️ Important:
- Only output a pure valid JSON object, with no extra text, no introductions, no explanations, no commentary.
- DO NOT say anything like "As an AI..." or any explanation — output ONLY the JSON.
- Reasonable estimates are allowed if public data is unavailable.
  `.trim();

  console.log('✨ OpenAI Enrich Prompt:', prompt); // 👈 Add this

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return res.status(500).json({ message: 'No response from OpenAI' });

    const enrichedHome = safeJsonParse(content);

    // ✅ NEW: Instead of saving to database, just return the enriched data
    return res.status(200).json(enrichedHome);

  } catch (err) {
    console.error('Failed to enrich home:', err);
    return res.status(500).json({ message: 'Failed to enrich home' });
  }
});

function safeJsonParse(text: string): any {
  const requiredFields = [
    'address',
    'city',
    'state',
    'squareFeet',
    'lotSize',
    'yearBuilt',
    'numberOfRooms',
    'features',
    'imageUrl',
    'architecturalStyle',
  ];

  const tryParse = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      const isObject = parsed && typeof parsed === 'object' && !Array.isArray(parsed);

      if (!isObject) throw new Error('Parsed result is not an object');

      const missing = requiredFields.filter((key) => !(key in parsed));
      if (missing.length > 0) {
        throw new Error(`Missing required field(s): ${missing.join(', ')}`);
      }

      return parsed;
    } catch (err) {
      return null;
    }
  };

  // First: try raw
  const rawFirstTry = tryParse(text);
  if (rawFirstTry) return rawFirstTry;

  console.warn('⚠️ Raw OpenAI output failed JSON parse or schema check');
  console.warn('🔎 Raw content:\n', text);

  // Second: try cleaned version
  const cleaned = text
    .replace(/```json|```/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanedTry = tryParse(cleaned);
  if (cleanedTry) return cleanedTry;

  console.error('❌ Final attempt to parse enriched home data failed.');
  console.error('🧾 Final cleaned content:', cleaned);
  throw new Error('Invalid or incomplete JSON from OpenAI');
}

export default router;
