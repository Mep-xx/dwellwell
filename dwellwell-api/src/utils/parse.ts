export function extractJSONFromResponse(text: string): any[] {
    try {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      const raw = match ? match[1] : text;
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse JSON from OpenAI response:', err);
      return [];
    }
  }
  