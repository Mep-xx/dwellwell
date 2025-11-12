// dwellwell-api/src/services/gamification/awardXP.ts
import { prisma } from "../../db/prisma";

type AwardParams = {
  userId: string;
  kind: string;
  refType: "thread" | "post";
  refId: string;
  deltaXP: number;
};

function computeLevel(totalXP: number): number {
  return Math.max(1, Math.floor(totalXP / 100) + 1);
}

export async function awardXP(p: AwardParams) {
  await prisma.$transaction(async (tx: any) => {
    try {
      await tx.gamificationEvent.create({ data: p });
    } catch (err) {
      const code = (err as any)?.code;
      if (code === "P2002") {
        // duplicate; ignore
      } else {
        throw err;
      }
    }

    const existing = await tx.reputationSnapshot.findFirst({ where: { userId: p.userId } });

    if (!existing) {
      const total = p.deltaXP;
      await tx.reputationSnapshot.create({
        data: { userId: p.userId, totalXP: total, level: computeLevel(total) },
      });
      return;
    }

    const newTotal = existing.totalXP + p.deltaXP;
    const newLevel = computeLevel(newTotal);

    await tx.reputationSnapshot.update({
      where: { id: existing.id },
      data: { totalXP: newTotal, ...(newLevel !== existing.level ? { level: newLevel } : {}) },
    });
  });
}
