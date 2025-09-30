// dwellwell-api/src/routes/trackables/update.ts
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
 * - Updates generic/detail flags when details change (isGeneric, detailLevel, source)
 *
 * NOTE: This assumes Trackable has nullable columns:
 *   brand?: string | null
 *   model?: string | null
 *   category?: string | null
 *   kind?: string | null   // "type" in the UI maps to "kind" in DB
 *
 * And optional flags (added in schema for quick-add generics):
 *   isGeneric: boolean @default(true)
 *   detailLevel: 'generic' | 'basic' | 'detailed' | 'verified' @default(generic)
 *   source: 'user_manual_entry' | 'user_quick_prompt' | 'admin_seed' | 'import_csv' | 'catalog_match'
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

function computeDetailLevel(brand?: any, model?: any, serial?: any): 'generic' | 'basic' | 'detailed' | 'verified' {
  const hasBrand = !!brand;
  const hasModel = !!model;
  const hasSerial = !!serial;
  if (!hasBrand && !hasModel && !hasSerial) return 'generic';
  if (hasBrand && hasModel && hasSerial) return 'verified';
  if (hasBrand && hasModel) return 'detailed';
  return 'basic';
}

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  // Fetch current row with just enough to validate and compute diffs
  const current = await prisma.trackable.findFirst({
    where: {
      id: trackableId,
      OR: [{ ownerUserId: userId }, { home: { userId } }],
    },
    select: {
      id: true,
      homeId: true,
      roomId: true,
      brand: true,
      model: true,
      serialNumber: true,
      applianceCatalogId: true,
      isGeneric: true,
      detailLevel: true,
      source: true,
    },
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

    // overrides
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

  // Allow brand/model/category/type overrides on Trackable itself (nullable)
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

  // --- Generic/detail flags: compute from final values we intend to persist ---
  // We need the "would-be" values after this update, so derive them from payload-or-current.
  const nextBrand = (brand !== undefined) ? (brand ?? null) : current.brand;
  const nextModel = (model !== undefined) ? (model ?? null) : current.model;
  const nextSerial = (serialNumber !== undefined) ? (serialNumber ?? null) : current.serialNumber;

  const nextDetailLevel = computeDetailLevel(nextBrand, nextModel, nextSerial);
  const nextIsGeneric = nextDetailLevel === 'generic';

  // Update flags only if they are changing or if caller touched details/catalog
  const touchedIdentityFields = (brand !== undefined) || (model !== undefined) || (serialNumber !== undefined) || (applianceCatalogId !== undefined);
  if (touchedIdentityFields) {
    data.isGeneric = nextIsGeneric;
    data.detailLevel = nextDetailLevel;
    // If linking to a catalog, record provenance as a helpful hint; otherwise keep prior/source unless this looks like a manual detail add.
    if (applianceCatalogId !== undefined && applianceCatalogId !== null) {
      data.source = 'catalog_match';
    } else if (brand !== undefined || model !== undefined || serialNumber !== undefined) {
      // only set to manual if not already catalog_match — avoid clobbering a prior explicit source from other flows
      if (current.source !== 'catalog_match') {
        data.source = 'user_manual_entry';
      }
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

    // helpful UI signals
    isGeneric: (updated as any).isGeneric ?? undefined,
    detailLevel: (updated as any).detailLevel ?? undefined,
    source: (updated as any).source ?? undefined,

    createdAt: updated.createdAt.toISOString(),
    lastCompletedAt: (updated as any).lastCompletedAt ?? null,
  };

  res.json(view);

  // Kick task generation/enrichment asynchronously (safe fire-and-forget).
  try {
    const { generateTasksForTrackable } = await import('../../services/taskgen');
    await generateTasksForTrackable(trackableId);
  } catch (e) {
    console.error('[trackables/update] taskgen error:', e);
  }
});
