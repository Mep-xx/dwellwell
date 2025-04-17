import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getHomes = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const homes = await prisma.home.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(homes);
  } catch (err) {
    console.error('Failed to fetch homes:', err);
    res.status(500).json({ error: 'Failed to fetch homes' });
  }
};

export const createHome = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { address, nickname, squareFeet, lotSize, yearBuilt } = req.body;

  try {
    const newHome = await prisma.home.create({
      data: {
        userId,
        address,
        nickname,
        squareFeet,
        lotSize,
        yearBuilt,
      }
    });

    res.status(201).json(newHome);
  } catch (err) {
    console.error('Failed to create home:', err);
    res.status(500).json({ error: 'Failed to create home' });
  }
};
