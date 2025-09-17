import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

/**
 * Update a trackable the user owns.
 * - Ownership: supports both ownerUserId and legacy home.userId
 * - Allows overriding brand, model, category, and type/kind on Trackable (nullable columns)
 * - Validates home/room reassignment
 * - Validates applianceCatalogId existence
 * - Parses purchaseDate
 *
 * NOTE: This assumes Trackable has nullable columns:
 *   brand?: string | null
 *   model?: string | null
 *   category?: string | null
 *   kind?: string | null   // "type" in the UI maps to "kind" in DB
 *
 * If your column names differ, adjust below where noted.
 */

const ALLOWED_CATEGORIES = new Set([
  'appliance',
  'kitchen',
  'bathroom',
  'heating',
  'cooling',
  'plumbing',
  'electrical',
  'outdoor',
  'safety',
  'general',
  'electronics',      // broad consumer electronics
  'computing',        // laptops, desktops, printers
  'entertainment',    // TV, consoles, AV gear, projectors
  'lighting',         // fixtures, bulbs, smart lighting
  'cleaning',         // vacuums, robot vacs, steam cleaners
  'tools',            // drills, saws, power/hand tools
  'furniture',        // couches, desks, etc.
]);

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  // Find by either ownership model
  const current = await prisma.trackable.findFirst({
    where: {
      id: trackableId,
      OR: [{ ownerUserId: userId }, { home: { userId } }],
    },
    select: { id: true, homeId: true },
  });
  if (!current) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  // Accept both "type" (UI) and "kind" (DB)
  const {
    homeId,
    roomId,
    applianceCatalogId,
    userDefinedName,
    purchaseDate,
    serialNumber,
    notes,
    imageUrl,

    // new overrides (long-term UX)
    brand,
    model,
    category,
    type,   // UI field
    kind,   // if caller happens to send "kind" explicitly
  } = req.body ?? {};

  const data: any = {};

  // Basic fields
  if (userDefinedName !== undefined) data.userDefinedName = userDefinedName;
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (notes !== undefined) data.notes = notes;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  // Purchase date
  if (purchaseDate !== undefined) {
    if (purchaseDate === null || purchaseDate === '') {
      data.purchaseDate = null;
    } else {
      const d = new Date(purchaseDate);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'INVALID_DATE', field: 'purchaseDate' });
      data.purchaseDate = d;
    }
  }

  // Catalog link
  if (applianceCatalogId !== undefined) {
    if (applianceCatalogId === null) {
      data.applianceCatalogId = null;
    } else {
      const exists = await prisma.applianceCatalog.findUnique({ where: { id: applianceCatalogId } });
      if (!exists) return res.status(400).json({ error: 'CATALOG_ID_INVALID' });
      data.applianceCatalogId = applianceCatalogId;
    }
  }

  // Long-term UX: allow brand/model/category/type overrides on Trackable itself
  // These columns must exist on the Trackable model (nullable).
  if (brand !== undefined) data.brand = brand === null ? null : String(brand).slice(0, 128);
  if (model !== undefined) data.model = model === null ? null : String(model).slice(0, 128);

  if (category !== undefined) {
    if (category === null) {
      data.category = null;
    } else {
      const c = String(category).toLowerCase();
      if (!ALLOWED_CATEGORIES.has(c)) {
        return res.status(400).json({ error: 'CATEGORY_INVALID', allowed: Array.from(ALLOWED_CATEGORIES) });
      }
      data.category = c;
    }
  }

  // Map UI "type" -> DB "kind"
  if (type !== undefined || kind !== undefined) {
    const val = (type ?? kind);
    data.kind = val === null ? null : String(val).toLowerCase().slice(0, 64);
  }

  // Home reassignment (ownership validation) & room reset if needed
  if (homeId !== undefined && homeId !== current.homeId) {
    if (homeId === null) {
      // Allow disassociating a home entirely, if your schema allows it
      data.homeId = null;
      data.roomId = null;
    } else {
      const newHome = await prisma.home.findFirst({ where: { id: homeId, userId } });
      if (!newHome) return res.status(400).json({ error: 'HOME_NOT_FOUND_OR_NOT_OWNED' });
      data.homeId = homeId;
      // unless caller also provides a valid room below, force revalidation
      data.roomId = null;
    }
  }

  // Room validation (must belong to effective home, if set)
  const effectiveHomeId = data.homeId !== undefined ? data.homeId : current.homeId;
  if (roomId !== undefined) {
    if (roomId === null) {
      data.roomId = null;
    } else {
      if (!effectiveHomeId) {
        return res.status(400).json({ error: 'ROOM_NOT_FOUND_OR_NOT_IN_HOME' });
      }
      const room = await prisma.room.findFirst({ where: { id: roomId, homeId: effectiveHomeId } });
      if (!room) return res.status(400).json({ error: 'ROOM_NOT_FOUND_OR_NOT_IN_HOME' });
      data.roomId = roomId;
    }
  }

  // Perform update
  await prisma.trackable.update({
    where: { id: trackableId },
    data,
  });

  // Re-fetch a full view so the client sees the latest (including catalog fallbacks).
  const updated = await prisma.trackable.findUnique({
    where: { id: trackableId },
    include: {
      applianceCatalog: true,
      room: true,
      home: true,
    },
  });

  if (!updated) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  // Build response view: Trackable overrides first, then fall back to catalog
  const view = {
    id: updated.id,
    userDefinedName: updated.userDefinedName ?? '',

    brand: updated.brand ?? updated.applianceCatalog?.brand ?? null,
    model: updated.model ?? updated.applianceCatalog?.model ?? null,
    // "type" for the UI comes from Trackable.kind first, then catalog.type
    type: updated.kind ?? updated.applianceCatalog?.type ?? null,
    category: updated.category ?? updated.applianceCatalog?.category ?? 'general',

    serialNumber: updated.serialNumber ?? null,
    imageUrl: updated.imageUrl ?? null,
    notes: updated.notes ?? null,
    applianceCatalogId: updated.applianceCatalogId ?? null,

    homeId: updated.homeId ?? null,
    roomId: updated.roomId ?? null,
    roomName: updated.room?.name ?? null,
    homeName: updated.home?.nickname ?? null,

    status: updated.status,
    nextDueDate: (updated as any).nextDueDate ?? null,
    counts: (updated as any).counts ?? { overdue: 0, dueSoon: 0, active: 0 },

    createdAt: updated.createdAt.toISOString(),
    lastCompletedAt: (updated as any).lastCompletedAt ?? null,
  };

  res.json(view);
});
