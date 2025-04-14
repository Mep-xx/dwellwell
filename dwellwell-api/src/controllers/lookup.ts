import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const searchApplianceCatalog = async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Query too short' });
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
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
