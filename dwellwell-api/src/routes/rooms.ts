import express from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Get all rooms for a home
router.get('/home/:homeId', requireAuth, async (req, res) => {
  const userId = (req as any).user.userId;
  const { homeId } = req.params;

  try {
    const home = await prisma.home.findFirst({
      where: { id: homeId, userId },
      include: {
        rooms: true,
      },
    });

    if (!home) return res.status(404).json({ error: 'Home not found' });

    res.json(home.rooms);
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a room to a home
router.post('/', requireAuth, async (req, res) => {
  const userId = (req as any).user.userId;
  const { homeId, name, type, floor } = req.body;

  if (!homeId || !name || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) return res.status(404).json({ error: 'Home not found' });

    const room = await prisma.room.create({
      data: {
        homeId,
        name,
        type,
        floor: floor ?? undefined,
      },
    });

    res.status(201).json(room);
  } catch (err) {
    console.error('Failed to create room:', err);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// Delete a room
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;

  try {
    const room = await prisma.room.findFirst({
      where: { id },
      include: { home: true },
    });

    if (!room || room.home.userId !== userId) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }

    await prisma.room.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete room:', err);
    res.status(500).json({ error: 'Error deleting room' });
  }
});

export default router;
