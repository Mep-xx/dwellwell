import express from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import enrichHomeRoute from './enrich-home-OpenAI';
import { getHomes, createHome } from '../../controllers/home';
import { prisma } from '../../db/prisma';

const router = express.Router();

router.use(enrichHomeRoute);

// PATCH /api/homes/:id — update isChecked
router.patch('/:id', requireAuth, async (req, res) => {
  const userId = (req as any).user?.userId;
  const homeId = req.params.id;
  const { isChecked } = req.body;

  if (typeof isChecked !== 'boolean') {
    return res.status(400).json({ error: 'isChecked must be a boolean' });
  }

  try {
    const updatedHome = await prisma.home.updateMany({
      where: { id: homeId, userId },
      data: { isChecked },
    });

    if (updatedHome.count === 0) {
      return res.status(404).json({ error: 'Home not found or not owned by user' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update home' });
  }
});

// Use the controller functions here
router.get('/', requireAuth, getHomes);
router.post('/', requireAuth, createHome);

export default router;
