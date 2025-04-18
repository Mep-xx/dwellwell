// dwellwell-api/src/routes/homes.ts
import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import enrichHomeRoute from './enrich-home-OpenAI';

const router = express.Router();

router.use(enrichHomeRoute); // 👈 simplified route

// Get all homes for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const homes = await prisma.home.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(homes);
  } catch (err) {
    console.error('Failed to fetch homes:', err);
    res.status(500).json({ error: 'Failed to load homes' });
  }
});

// Create a new home manually
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const {
      address,
      city,
      state,
      nickname,
      zillowId,
      squareFeet,
      lotSize,
      yearBuilt,
      numberOfRooms,
      imageUrl,
      features,
    } = req.body;

    if (!address || !city || !state) {
      console.error('🚫 Missing required fields:', { address, city, state });
      return res.status(400).json({ message: 'Missing required fields: address, city, or state' });
    }

    const home = await prisma.home.create({
      data: {
        userId,
        address,
        city,
        state,
        nickname,
        zillowId,
        squareFeet,
        lotSize,
        yearBuilt,
        numberOfRooms,
        imageUrl,
        features,
      },
    });

    res.status(201).json(home);
  } catch (err) {
    console.error('Failed to create home:', err);
    res.status(500).json({ error: 'Failed to create home' });
  }
});

export default router;