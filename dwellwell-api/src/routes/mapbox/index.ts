// dwellwell-api/src/routes/mapbox/index.ts
import express from "express";
// @ts-ignore
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

const router = express.Router();
const accessToken = process.env.MAPBOX_TOKEN || "";

if (!accessToken) {
  console.warn("[mapbox] MAPBOX_TOKEN is not set. Requests will fail.");
}

const geocodingClient = mbxGeocoding({ accessToken });

// helper to pluck a context item by id prefix (e.g., 'place', 'region', 'postcode')
function pickCtx(ctx: any[] | undefined, prefix: string) {
  return ctx?.find((c) => typeof c.id === "string" && c.id.startsWith(prefix));
}

router.get("/suggest", async (req, res) => {
  // accept either ?q= or ?query=
  const q =
    (req.query.q as string) ??
    (req.query.query as string) ??
    "";

  if (typeof q !== "string" || q.trim().length < 3) {
    return res.status(400).json({ error: "INVALID_QUERY" });
  }

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: q.trim(),
        autocomplete: true,
        types: ["address"],
        limit: 5,
        countries: ["us"],
      })
      .send();

    const features: any[] = response.body?.features ?? [];

    // Flatten to what the client expects
    const suggestions = features.map((f) => {
      const place = pickCtx(f.context, "place");     // city
      const region = pickCtx(f.context, "region");   // state
      const zip = pickCtx(f.context, "postcode");    // zip

      // For addresses, Mapbox gives number in f.address and street name in f.text
      const streetAddress =
        f.address && f.text ? `${f.address} ${f.text}` : f.place_name;

      // state as 2-letter if available (region.short_code is usually 'US-MA')
      const state =
        (region?.short_code && String(region.short_code).split("-")[1]) ||
        region?.text;

      return {
        id: f.id as string,
        place_name: f.place_name as string,
        address: streetAddress as string,
        city: place?.text as string | undefined,
        state: state as string | undefined,
        zip: zip?.text as string | undefined,
      };
    });

    return res.json(suggestions);
  } catch (e) {
    console.error("Mapbox error", e);
    return res.status(500).json({ error: "MAPBOX_ERROR" });
  }
});

export default router;
