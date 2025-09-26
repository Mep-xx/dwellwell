// scripts/backfill-taskgen.ts
import { prisma } from "../src/db/prisma";
import { generateTasksFromTemplatesForRoom, generateTasksFromTemplatesForHome } from "../src/services/taskgen/fromTemplates";
import { seedTasksForTrackable } from "../src/routes/trackables/_seedTasks";
import { generateTasksForTrackable } from "../src/services/taskgen";

async function main() {
  console.log("Backfill: homes → template assignment");
  const homes = await prisma.home.findMany({ select: { id: true } });
  for (const h of homes) {
    await generateTasksFromTemplatesForHome(h.id);
  }

  console.log("Backfill: rooms → template assignment");
  const rooms = await prisma.room.findMany({ select: { id: true } });
  for (const r of rooms) {
    await generateTasksFromTemplatesForRoom(r.id);
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
