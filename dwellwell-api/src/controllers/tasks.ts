import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const trackableId = req.query.trackableId as string;

    if (!userId || !trackableId) {
      return res.status(400).json({ error: 'Missing user ID or trackable ID' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        trackableId,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.create({
      data: req.body,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};
