import { Router } from 'express';
import { openai } from '../utils/openai';
import { extractJSONFromResponse } from '../utils/parse'

export const aiRouter = Router();

aiRouter.get('/lookup-appliance', async (req, res) => {
  const query = req.query.query as string;
  if (!query) return res.status(400).json({ message: 'Missing query' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Suggest 3 appliances that match this description: "${query}". For each, return a JSON array with brand, model, type, category, and a short note.`,
      }],
      temperature: 0.6,
    });

    const suggestions = extractJSONFromResponse(response.choices[0].message.content || '');
    res.json(suggestions);
  } catch (err) {
    console.error('AI lookup error:', err);
    res.status(500).json({ message: 'Failed to retrieve AI suggestions' });
  }
});
