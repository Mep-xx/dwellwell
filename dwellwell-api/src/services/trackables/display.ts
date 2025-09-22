//dwellwell-api/src/services/trackables/display.ts
import { prisma } from "../../db/prisma";

/**
 * Compute a user-facing display name for a trackable and its brand/model string.
 * - Prefer the user's custom name
 * - Else prefer "Brand Model" (from overrides or catalog)
 * - Else fall back to the kind (type) or "(unnamed)"
 *
 * Returns:
 *  - itemName: what to show in the task UI
 *  - brandModel: like "Bosch SHXM78Z55N" or null if unknown
 *  - composedItemName: itemName with brand/model appended if the user named it
 *                      (e.g., "Kitchen Dishwasher (Bosch SHXM78Z55N)")
 */
export async function getTrackableDisplay(trackableId: string) {
  const t = await prisma.trackable.findUnique({
    where: { id: trackableId },
    include: { applianceCatalog: true, room: true, home: true },
  });
  if (!t) {
    return {
      itemName: "(unnamed)",
      brandModel: null as string | null,
      composedItemName: "(unnamed)",
      context: { roomId: null as string | null, homeId: null as string | null },
    };
  }

  const brand =
    (t.brand && t.brand.trim()) || (t.applianceCatalog?.brand ?? "") || "";
  const model =
    (t.model && t.model.trim()) || (t.applianceCatalog?.model ?? "") || "";
  const brandModel = [brand, model].filter(Boolean).join(" ").trim() || null;

  // Kind/type fallback (e.g., "dishwasher")
  const kind = (t.kind || t.applianceCatalog?.type || "").trim();

  // Prefer user-defined name
  const baseName =
    (t.userDefinedName && t.userDefinedName.trim()) ||
    brandModel ||
    (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : "") ||
    "(unnamed)";

  // If the user named it AND we have brand/model, append it in parentheses.
  const composedItemName =
    t.userDefinedName && brandModel
      ? `${t.userDefinedName.trim()} (${brandModel})`
      : baseName;

  return {
    itemName: baseName,
    brandModel,
    composedItemName,
    context: { roomId: t.roomId ?? null, homeId: t.homeId ?? null },
  };
}
