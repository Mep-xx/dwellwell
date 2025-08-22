import express from 'express';
// @ts-ignore
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const router = express.Router();
const accessToken = process.env.MAPBOX_TOKEN || '';
const geocodingClient = mbxGeocoding({ accessToken });

router.get('/suggest', async (req, res) => {
  const query = req.query.query as string;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'INVALID_QUERY' });
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
  } catch (e) {
    console.error('Mapbox error', e);
    return res.status(500).json({ error: 'MAPBOX_ERROR' });
  }
});

export default router;
