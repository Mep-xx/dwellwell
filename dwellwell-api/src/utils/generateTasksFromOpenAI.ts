import { openai } from './openai';
import type { TaskTemplate } from '../shared/types/task';

export async function generateTasksFromOpenAI(trackableName: string): Promise<TaskTemplate[]> {
  const prompt = `
You are an expert in home maintenance. A user has added a new trackable item called "${trackableName}" to their maintenance app. 
Generate a list of 3-5 preventative maintenance tasks in JSON format using the following schema:

[
  {
    "title": string,
    "description": string,
    "recurrenceInterval": string,
    "estimatedTimeMinutes": number,
    "estimatedCost": number,
    "criticality": "low" | "medium" | "high",
    "canDefer": boolean,
    "deferLimitDays": number,
    "canBeOutsourced": boolean,
    "category": string
  }
]
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that only responds with JSON unless explicitly asked otherwise.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  });

  const content = response.choices[0]?.message.content?.trim();
  if (!content) return [];

  try {
    console.log('🤖 OpenAI raw response:', response.choices[0]?.message.content);

    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse OpenAI response:', content);
    return [];
  }
}
