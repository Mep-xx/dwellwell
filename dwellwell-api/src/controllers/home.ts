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
    features,
    imageUrl,
    isChecked = true
  } = req.body;

  if (!address || !city || !state) {
    console.error('🚫 Missing required fields:', { address, city, state });
    return res.status(400).json({ message: 'Missing required fields: address, city, or state' });
  }

  try {
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
        features: Array.isArray(features) ? features : [],
        imageUrl: imageUrl ?? 'https://via.placeholder.com/300',
        isChecked: true
      }
    });

    res.status(201).json(newHome);
  } catch (err) {
    console.error('Failed to create home:', err);
    res.status(500).json({ error: 'Failed to create home' });
  }
};
