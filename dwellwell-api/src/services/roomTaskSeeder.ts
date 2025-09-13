//dwellwell-api/src/services/roomTaskSeeder.ts
import { prisma } from '../db/prisma';

// Example: seed based on room.type + RoomDetail flags
export async function seedRoomTasksForRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { detail: true, home: { select: { userId: true } } },
  });
  if (!room || room.home.userId !== userId) return;

  const recs = deriveTemplates(room); // returns TaskTemplate[]-like POJOs
  const now = new Date();

  for (const t of recs) {
    await prisma.userTask.create({
      data: {
        userId,
        roomId: room.id,
        trackableId: null,
        taskTemplateId: null,          // room templates can be non-catalog
        sourceType: 'room',
        title: t.title,
        description: t.description ?? '',
        dueDate: computeInitialDue(now, t.recurrenceInterval),
        status: 'PENDING',
        itemName: room.name,
        category: t.category ?? 'general',
        estimatedTimeMinutes: t.estimatedTimeMinutes ?? 0,
        estimatedCost: t.estimatedCost ?? 0,
        criticality: t.criticality ?? 'medium',
        deferLimitDays: t.deferLimitDays ?? 0,
        canBeOutsourced: t.canBeOutsourced ?? false,
        canDefer: t.canBeOutsourced ?? true,
        recurrenceInterval: t.recurrenceInterval ?? '',
        taskType: 'GENERAL',
        dedupeKey: crypto.randomUUID(),
        steps: t.steps ? (t.steps as any) : undefined,
        equipmentNeeded: t.equipmentNeeded ? (t.equipmentNeeded as any) : undefined,
        resources: t.resources ? (t.resources as any) : undefined,
        icon: t.icon ?? undefined,
        imageUrl: t.imageUrl ?? undefined,
      },
    });
  }

  function computeInitialDue(base: Date, rec: string | undefined) {
    const d = new Date(base);
    const r = (rec || '').toLowerCase();
    if (r.includes('day')) d.setDate(d.getDate() + parseInt(r));
    else if (r.includes('week')) d.setDate(d.getDate() + 7 * parseInt(r));
    else if (r.includes('month')) d.setMonth(d.getMonth() + parseInt(r));
    else if (r.includes('year')) d.setFullYear(d.getFullYear() + parseInt(r));
    else d.setDate(d.getDate() + 90); // default quarterly
    return d;
  }

  function deriveTemplates(room: any) {
    const out: any[] = [];
    if (room.type?.toLowerCase() === 'bedroom') {
      out.push({ title: 'Rotate mattress', recurrenceInterval: '90 days', category: 'general' });
      if (room.detail?.hasSmokeDetector) {
        out.push({ title: 'Test smoke detector', recurrenceInterval: '1 month', category: 'safety' });
        out.push({ title: 'Replace detector batteries', recurrenceInterval: '6 months', category: 'safety' });
      }
      if (room.detail?.hasCeilingFan) {
        out.push({ title: 'Dust ceiling fan', recurrenceInterval: '1 month', category: 'general' });
      }
    }
    // Add other room types later
    return out;
  }
}
