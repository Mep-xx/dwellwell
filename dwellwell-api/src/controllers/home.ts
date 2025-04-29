import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

// GET /api/homes
export const getHomes = async (req: Request, res: Response) => {
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
};

// POST /api/homes
export const createHome = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const {
    address,
    city,
    state,
    nickname,
    squareFeet,
    lotSize,
    yearBuilt,
    numberOfRooms,
    architecturalStyle,
    features,
    imageUrl,
    rooms = [],
    isChecked = true
  } = req.body;

  if (!address || !city || !state) {
    console.error('🚫 Missing required fields:', { address, city, state });
    return res.status(400).json({ message: 'Missing required fields: address, city, or state' });
  }

  try {
    const existingHome = await prisma.home.findFirst({
      where: {
        userId,
        address,
        city,
        state,
      },
    });

    if (existingHome) {
      return res.status(409).json({ message: 'Home already exists for this address.' });
    }

    const newHome = await prisma.home.create({
      data: {
        userId,
        address,
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
        rooms: {
          create: Array.isArray(rooms)
            ? rooms.map((room: any) => ({
              name: room.name,
              type: room.type,
              floor: room.floor ?? null,
            }))
            : [],
        },
      },
      include: {
        rooms: true, // Optional, returns the created rooms too
      },
    });

    res.status(201).json(newHome);
  } catch (err) {
    console.error('Failed to create home:', err);
    res.status(500).json({ error: 'Failed to create home' });
  }
};

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

// Update only the isChecked field on a home
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

export const updateHome = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const { id } = req.params;
  const { nickname, squareFeet, lotSize, yearBuilt, architecturalStyle } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const home = await prisma.home.findUnique({
      where: { id },
    });

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
        architecturalStyle: architecturalStyle ?? null, // 🆕 Allow editing style
      },
    });

    res.status(200).json(updatedHome);
  } catch (err) {
    console.error('Failed to update home:', err);
    res.status(500).json({ error: 'Failed to update home' });
  }
};