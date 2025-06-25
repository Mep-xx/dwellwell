import express, { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { assignTasksToRooms } from '../utils/taskAssignment';

const router = express.Router();

// PATCH /api/rooms/:id — Update Room Details
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  try {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const home = await prisma.home.findUnique({ where: { id: room.homeId } });
    if (home?.userId !== userId) return res.status(403).json({ message: 'Forbidden' });

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name: req.body.name,
        type: req.body.type,
        floor: req.body.floor,
        hasFireplace: req.body.hasFireplace ?? false,
        hasBoiler: req.body.hasBoiler ?? false,
        hasSmokeDetector: req.body.hasSmokeDetector ?? false,
      },
    });

    res.json(updatedRoom);
  } catch (err) {
    console.error('Failed to update room:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// GET /api/rooms/home/:homeId — Get All Rooms for a Home
router.get('/home/:homeId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { homeId } = req.params;

  try {
    const rooms = await prisma.room.findMany({
      where: { homeId, home: { userId } },
    });

    res.json(rooms);
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rooms — Add Room and Assign Tasks
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

    await assignTasksToRooms(homeId, userId);

    res.status(201).json(room);
  } catch (err) {
    console.error('Failed to create room:', err);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// DELETE /api/rooms/:id — Delete Room
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

// GET /api/rooms/:id/tasks — Get Tasks for Room (direct + trackable)
router.get('/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id: roomId } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { home: true },
    });

    if (!room || room.home.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const tasks = await prisma.userTask.findMany({
      where: {
        userId,
        OR: [
          { roomId },
          { trackable: { roomId } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    const response = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      disabled: false, // Default to false, can be modified via PATCH
    }));

    res.json(response);
  } catch (err) {
    console.error('Failed to fetch room tasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


export default router;
