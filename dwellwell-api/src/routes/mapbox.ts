// dwellwell-api/src/routes/mapbox.ts
import express from 'express';
// @ts-ignore
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const router = express.Router();

const accessToken = process.env.MAPBOX_TOKEN || '';
const geocodingClient = mbxGeocoding({ accessToken });

router.get('/suggest', async (req, res) => {
  const query = req.query.query as string;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid query parameter' });
  }

  try {
    const response = await geocodingClient
      .forwardGeocode({
        query,
        autocomplete: true,
        types: ['address'],
        limit: 5,
        countries: ['us'],
      })
      .send();

    return res.json(response.body);
  } catch (err) {
    console.error('Failed to fetch Mapbox suggestions:', err);
    return res.status(500).json({ message: 'Failed to fetch address suggestions' });
  }
});

export default router;
