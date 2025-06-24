import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { assignTasksToRooms } from 'src/utils/taskAssignment';

// GET /api/homes
export const getHomes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const homes = await prisma.home.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { rooms: true },
    });
    res.json(homes);
  } catch (err) {
    console.error('Failed to fetch homes:', err);
    res.status(500).json({ error: 'Failed to load homes' });
  }
};

// POST /api/homes
export const createHome = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const {
    address,
    apartment,
    city,
    state,
    nickname,
    squareFeet,
    lotSize,
    yearBuilt,
    numberOfRooms,
    features,
    architecturalStyle,
    imageUrl,
    rooms = [],
    isChecked = true,
    boilerType,
    hasCentralAir,
    hasBaseboard,
    roofType,
    sidingType,
  } = req.body;

  if (!address || !city || !state) {
    return res.status(400).json({ message: 'Missing required fields: address, city, or state' });
  }

  const normalizeFloor = (floor: string | number | null | undefined): number | null => {
    if (typeof floor === 'number') return floor;
    switch (floor) {
      case 'Basement': return -1;
      case '1st Floor': return 1;
      case '2nd Floor': return 2;
      case '3rd Floor': return 3;
      case 'Attic': return 99;
      case 'Other': return 0;
      default: return null;
    }
  };

  try {
    const existingHome = await prisma.home.findFirst({
      where: { userId, address, city, state, apartment },
    });

    if (existingHome) {
      return res.status(409).json({ message: 'Home already exists for this address.' });
    }

    const newHome = await prisma.home.create({
      data: {
        userId,
        address,
        apartment,
        city,
        state,
        nickname: nickname ?? null,
        squareFeet: squareFeet ?? null,
        lotSize: lotSize ?? null,
        yearBuilt: yearBuilt ?? null,
        numberOfRooms: numberOfRooms ?? null,
        architecturalStyle: architecturalStyle ?? null,
        features: features ?? [],
        imageUrl: imageUrl ?? '/images/home_placeholder.png',
        isChecked: isChecked,
        boilerType: boilerType ?? null,
        hasCentralAir: hasCentralAir ?? false,
        hasBaseboard: hasBaseboard ?? false,
        roofType: roofType ?? null,
        sidingType: sidingType ?? null,
        rooms: {
          create: Array.isArray(rooms)
            ? rooms.map((room: any) => ({
              name: room.name,
              type: room.type,
              floor: normalizeFloor(room.floor),
            }))
            : [],
        },
      },
    });

    await assignTasksToRooms(newHome.id, userId);
    
    res.status(201).json(newHome);
  } catch (err) {
    console.error('Failed to create home:', err);
    res.status(500).json({ error: 'Failed to create home' });
  }
};

// DELETE /api/homes/:id
export const deleteHome = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const home = await prisma.home.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }

    if (home.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.home.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete home:', err);
    res.status(500).json({ error: 'Failed to delete home' });
  }
};

// PATCH /api/homes/:id/isChecked
export const updateHomeIsChecked = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const homeId = req.params.id;
  const { isChecked } = req.body;

  if (typeof isChecked !== 'boolean') {
    return res.status(400).json({ error: 'isChecked must be a boolean' });
  }

  try {
    const updated = await prisma.home.updateMany({
      where: { id: homeId, userId },
      data: { isChecked },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Home not found or not owned by user' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to update isChecked:', err);
    res.status(500).json({ error: 'Failed to update home isChecked' });
  }
};

// PATCH /api/homes/:id
export const updateHome = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;
  const {
    nickname,
    squareFeet,
    lotSize,
    yearBuilt,
    architecturalStyle,
    imageUrl,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const home = await prisma.home.findUnique({ where: { id } });

    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }

    if (home.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updatedHome = await prisma.home.update({
      where: { id },
      data: {
        nickname: nickname ?? null,
        squareFeet: squareFeet ?? null,
        lotSize: lotSize ?? null,
        yearBuilt: yearBuilt ?? null,
        architecturalStyle: architecturalStyle ?? null,
        imageUrl: imageUrl ?? null,
      },
    });

    res.status(200).json(updatedHome);
  } catch (err) {
    console.error('Failed to update home:', err);
    res.status(500).json({ error: 'Failed to update home' });
  }
};
