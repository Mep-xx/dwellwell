// scripts/backfill-taskgen.ts
import { prisma } from "../src/db/prisma";
import { generateTasksForRoom, generateTasksForTrackable, generateTasksForHomeBasics } from "../src/services/taskgen";
import { seedTasksForTrackable } from "../src/routes/trackables/_seedTasks";

async function main() {
  console.log("Backfill: homes → home rules");
  const homes = await prisma.home.findMany({ select: { id: true } });
  for (const h of homes) {
    await generateTasksForHomeBasics(h.id);
  }

  console.log("Backfill: rooms → room rules");
  const rooms = await prisma.room.findMany({ select: { id: true } });
  for (const r of rooms) {
    await generateTasksForRoom(r.id);
  }

  console.log("Backfill: trackables → rules + catalog links");
  const trackables = await prisma.trackable.findMany({
    select: { id: true, ownerUserId: true, applianceCatalogId: true },
    where: { status: "IN_USE" },
  });
  for (const t of trackables) {
    await generateTasksForTrackable(t.id);
    await seedTasksForTrackable({
      prisma,
      userId: t.ownerUserId,
      trackableId: t.id,
      applianceCatalogId: t.applianceCatalogId ?? null,
    });
  }
  console.log("Done.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
