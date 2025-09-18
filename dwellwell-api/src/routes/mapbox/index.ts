  // dwellwell-api/src/routes/mapbox/index.ts
  import express from 'express';
  // @ts-ignore
  import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

  const router = express.Router();
  const accessToken = process.env.MAPBOX_TOKEN || '';
  const geocodingClient = mbxGeocoding({ accessToken });

  router.get('/suggest', async (req, res) => {
    const q = (req.query.q ?? req.query.query) as string;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'INVALID_QUERY' });
    }

    try {
      const response = await geocodingClient
        .forwardGeocode({
          query: q,
          autocomplete: true,
          types: ['address'],
          limit: 5,
          countries: ['us'],
        })
        .send();

      // Map to a compact array the client AddressAutocomplete can consume directly
      const features = (response.body?.features ?? []).map((f: any) => {
        // naive parse of context for city/state/zip
        const parts: Record<string, string> = {};
        for (const c of f.context ?? []) {
          if (c.id?.startsWith('place')) parts.city = c.text;
          if (c.id?.startsWith('region')) parts.state = c.short_code?.split('-')?.[1] ?? c.text;
          if (c.id?.startsWith('postcode')) parts.zip = c.text;
        }
        return {
          id: f.id,
          place_name: f.place_name,
          address: f.address ? `${f.address} ${f.text}` : f.text,
          city: parts.city,
          state: parts.state,
          zip: parts.zip,
        };
      });

      return res.json(features);
    } catch (e) {
      console.error('Mapbox error', e);
      return res.status(500).json({ error: 'MAPBOX_ERROR' });
    }
  });

  export default router;
