import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const searchApplianceCatalog = async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();

  if (!query || query.length < 3) {
    return res.json([]);
  }

  try {
    const results = await prisma.applianceCatalog.findMany({
      where: {
        OR: [
          { brand: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    res.json(results);
  } catch (err) {
    console.error('Error searching appliance catalog:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
