// dwellwell-api/src/services/gamification/awardXP.ts
import { prisma } from "../../db/prisma";
import type { Prisma } from "@prisma/client";

type AwardParams = {
  userId: string;
  kind: string;                 // "forum.thread.create", "forum.post.create", "forum.post.upvoted", etc.
  refType: "thread" | "post";
  refId: string;
  deltaXP: number;
};

function computeLevel(totalXP: number): number {
  // Simple curve: level every 100 XP (tune later)
  return Math.max(1, Math.floor(totalXP / 100) + 1);
}

export async function awardXP(p: AwardParams) {
  await prisma.$transaction(async (tx) => {
    // 1) Ledger record — optional unique guard on (userId, kind, refType, refId)
    // If you add @@unique([userId, kind, refType, refId]) to GamificationEvent, this will throw P2002 on dupes.
    try {
      await tx.gamificationEvent.create({ data: p });
    } catch (err) {
      const code = (err as Prisma.PrismaClientKnownRequestError)?.code;
      if (code === "P2002") {
        // Duplicate event; safe to ignore to keep idempotency
      } else {
        throw err;
      }
    }

    // 2) Snapshot find-or-create by userId (no unique on userId required)
    const existing = await tx.reputationSnapshot.findFirst({ where: { userId: p.userId } });

    if (!existing) {
      const total = p.deltaXP;
      await tx.reputationSnapshot.create({
        data: {
          userId: p.userId,
          totalXP: total,
          level: computeLevel(total),
        },
      });
      return;
    }

    // 3) Update totals without double-adding
    const newTotal = existing.totalXP + p.deltaXP;
    const newLevel = computeLevel(newTotal);

    await tx.reputationSnapshot.update({
      where: { id: existing.id },
      data: { totalXP: newTotal, ...(newLevel !== existing.level ? { level: newLevel } : {}) },
    });
  });
}
