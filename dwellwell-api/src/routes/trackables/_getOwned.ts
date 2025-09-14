// dwellwell-api/src/routes/trackables/_getOwned.ts
import { prisma } from '../../db/prisma';

export async function getOwnedTrackable(userId: string, trackableId: string) {
  return prisma.trackable.findFirst({
    where: {
      id: trackableId,
      OR: [
        { ownerUserId: userId },          // new ownership model
        { home: { userId } },             // legacy rows linked via home
      ],
    },
    select: { id: true, status: true },
  });
}
