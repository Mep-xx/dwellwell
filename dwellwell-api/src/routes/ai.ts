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
    if (!match) throw new Error("No JSON object found in response.");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("Failed to parse JSON from OpenAI response:", err);
    return null;
  }
}

// Route: GET /api/ai/lookup-appliance
router.get('/lookup-appliance', async (req, res) => {
  const query = req.query.query as string;
  if (!query) return res.status(400).json({ message: 'Missing query' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.6,
      messages: [{
        role: 'user',
        content: `Suggest 3 appliances that match this description: "${query}". For each, return a JSON array with brand, model, type, category, and a short note.`,
      }],
    });

    const suggestions = extractJSONFromResponse(response.choices[0].message.content || '');

    if (!suggestions) {
      return res.status(500).json({ message: 'Failed to parse appliance suggestions' });
    }

    return res.json(suggestions);
  } catch (err) {
    console.error('AI lookup error:', err);
    return res.status(500).json({ message: 'Failed to retrieve AI suggestions' });
  }
});

export default router;
