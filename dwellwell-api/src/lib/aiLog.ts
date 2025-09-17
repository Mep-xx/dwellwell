//dwellwell-api/src/lib/aiLog.ts
import { prisma } from '../db/prisma';

export async function logAIQuery(params: {
  userId?: string | null;
  source: string;
  prompt?: string;
  responseSummary?: string;
}) {
  const { userId, source, prompt, responseSummary } = params;
  try {
    await prisma.aIQueryHistory.create({
      data: {
        userId: userId ?? undefined,
        source,
        query: prompt ?? '',
        responseSummary: (responseSummary ?? '').slice(0, 2000),
      },
    });
  } catch (e) {
    console.error('logAIQuery failed', e);
  }
}
