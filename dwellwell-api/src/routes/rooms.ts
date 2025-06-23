import express, { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Utility: Map room type to task template category
const mapRoomTypeToCategory = (roomType: string): string => {
  return roomType.trim().toLowerCase();
};

// Utility: Generate tasks for a room
const generateTasksForRoom = async (roomId: string, roomType: string) => {
  const category = mapRoomTypeToCategory(roomType);
  console.log(`🧩 Mapping room type "${roomType}" to category "${category}"`);

  const templates = await prisma.taskTemplate.findMany({
    where: { category },
  });

  console.log(`🔍 Found ${templates.length} task templates for category "${category}"`);

  if (templates.length === 0) {
    console.warn(`⚠️ No task templates found for room type "${roomType}" (category "${category}")`);
    return;
  }

  const tasks = templates.map((template) => ({
    title: template.title,
    sourceType: 'room',
    sourceId: roomId,
    roomId,
  }));

  console.log(`🛠️ Creating ${tasks.length} tasks for room ID ${roomId}`);
  await prisma.task.createMany({ data: tasks });
};



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

// Get all rooms for a home (with tasks included)
router.get('/home/:homeId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { homeId } = req.params;

  try {
    const home = await prisma.home.findFirst({
      where: { id: homeId, userId },
      include: {
        rooms: {
          include: {
            tasks: true, // ✅ include the room's tasks
          },
        },
      },
    });

    if (!home) return res.status(404).json({ error: 'Home not found' });

    res.json(home.rooms);
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Add a room to a home (with automatic task creation)
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

    console.log(`🏠 Creating tasks for new room "${type}" (${room.id})...`);

    // Automatically create tasks for this room type
    console.log(`⚙️ Generating tasks for room: ${room.id} of type: ${type}`);
    await generateTasksForRoom(room.id, type);
    console.log(`✅ Finished task generation for room: ${room.id}`);


    res.status(201).json(room);
  } catch (err) {
    console.error('Failed to create room:', err);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// PATCH route for updateRoom
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

// Get tasks assigned to a room
router.get('/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        home: true,
        tasks: true,
      },
    });

    if (!room || room.home.userId !== userId) {
      return res.status(404).json({ message: 'Room not found or unauthorized' });
    }

    const disabledTasks = await prisma.disabledTask.findMany({
      where: {
        userId,
        taskId: { in: room.tasks.map((t) => t.id) },
      },
    });

    const disabledMap = new Set(disabledTasks.map((dt) => dt.taskId));

    const result = room.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      disabled: disabledMap.has(task.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('Failed to fetch room tasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update disabled tasks for a room
router.patch('/:id/tasks', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;
  const { disabledTaskIds } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        home: true,
        tasks: true,
      },
    });

    if (!room || room.home.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.disabledTask.deleteMany({
      where: {
        userId,
        taskId: {
          in: room.tasks.map((t) => t.id),
        },
      },
    });

    if (Array.isArray(disabledTaskIds) && disabledTaskIds.length > 0) {
      const inserts = disabledTaskIds.map((taskId: string) => ({
        userId,
        taskId,
      }));
      await prisma.disabledTask.createMany({ data: inserts });
    }

    res.json({ message: 'Room tasks updated' });
  } catch (err) {
    console.error('Failed to update room tasks:', err);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

export default router;
