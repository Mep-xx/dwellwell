import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const trackableName = req.query.trackable as string;

    if (!userId || !trackableName) {
      return res.status(400).json({ error: 'Missing user or trackable' });
    }

    const trackable = await prisma.trackable.findFirst({
      where: {
        name: trackableName,
        userId,
      },
    });

    if (!trackable) {
      return res.status(404).json({ error: 'Trackable not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { trackableId: trackable.id },
      orderBy: { dueDate: 'asc' }, // optional
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
