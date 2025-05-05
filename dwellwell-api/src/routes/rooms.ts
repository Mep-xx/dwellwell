import express, { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// PATCH /api/rooms/:id
export const updateRoom = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  try {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const home = await prisma.home.findUnique({ where: { id: room.homeId } });
    if (home?.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const {
      name,
      type,
      floor,
      hasFireplace,
      hasBoiler,
      hasSmokeDetector,
    }: {
      name: string;
      type: string;
      floor?: number;
      hasFireplace?: boolean;
      hasBoiler?: boolean;
      hasSmokeDetector?: boolean;
    } = req.body;

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name,
        type,
        floor,
        hasFireplace,
        hasBoiler,
        hasSmokeDetector,
      },
    });

    res.json(updatedRoom);
  } catch (err) {
    console.error('Failed to update room:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
};

// Get all rooms for a home
router.get('/home/:homeId', requireAuth, async (req: Request, res: Response) => {
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
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const {
    homeId,
    name,
    type,
    floor,
    hasFireplace = false,
    hasBoiler = false,
    hasSmokeDetector = false,
  }: {
    homeId: string;
    name: string;
    type: string;
    floor?: number;
    hasFireplace?: boolean;
    hasBoiler?: boolean;
    hasSmokeDetector?: boolean;
  } = req.body;

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
        floor,
        hasFireplace,
        hasBoiler,
        hasSmokeDetector,
      },
    });

    res.status(201).json(room);
  } catch (err) {
    console.error('Failed to create room:', err);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// Properly attach the PATCH route
router.patch('/:id', requireAuth, updateRoom);

// Delete a room
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
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
