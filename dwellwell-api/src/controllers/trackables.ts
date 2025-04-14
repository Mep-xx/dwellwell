import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { generateTasksFromTrackable } from '../shared/utils/generateTasksFromTrackable';

export const getTrackables = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ message: 'Missing user ID' });

    const trackables = await prisma.trackable.findMany({
      where: { userId },
    });

    res.json(trackables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trackables' });
  }
};

export const createTrackable = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ message: 'Missing user ID' });

    const {
      name,
      type,
      category,
      brand,
      model,
      serialNumber,
      imageUrl,
      notes,
    } = req.body;

    if (!name || !type || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTrackable = await prisma.trackable.create({
      data: {
        name,
        type,
        category,
        brand,
        model,
        serialNumber,
        imageUrl,
        notes,
        user: { connect: { id: userId } },
      },
    });

    const tasks = generateTasksFromTrackable({
      name,
      type,
      category,
      brand,
      model,
    });

    if (tasks.length > 0) {
      await prisma.task.createMany({
        data: tasks.map((t) => ({
          title: t.title,
          description: t.description,
          dueDate: t.dueDate.toISOString(), // ✅ convert Date to string
          status: t.status,
          itemName: t.itemName,
          estimatedTimeMinutes: t.estimatedTimeMinutes,
          estimatedCost: t.estimatedCost,
          canBeOutsourced: t.canBeOutsourced,
          canDefer: t.canDefer,
          deferLimitDays: t.deferLimitDays,
          category: t.category,
          icon: t.icon,
          imageUrl: t.imageUrl,
          taskType: t.taskType,
          trackableId: newTrackable.id,
          userId: userId,
        })),
      });
    }

    res.status(201).json(newTrackable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trackable' });
  }
};
