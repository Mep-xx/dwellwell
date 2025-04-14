import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const fetchApplianceSuggestions = async (query: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant for home maintenance apps.',
      },
      {
        role: 'user',
        content: `Give me 3 real-world appliances that include "${query}" in the name. Return brand, model, type, and notes.`,
      },
    ],
  });
  return response.choices[0].message.content;
};
