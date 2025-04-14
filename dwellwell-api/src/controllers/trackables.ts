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
    console.error('❌ Failed to fetch trackables:', err);
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

    // Create the new trackable
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

    // Generate associated tasks
    console.log(`🧪 Creating trackable: ${name}`);
    console.log(`🧪 Looking up templates for model: "${model}" or type: "${type}"`);

    const generatedTasks = generateTasksFromTrackable({
      name,
      type,
      category,
      brand,
      model,
    });

    console.log(`➡️  Generated ${generatedTasks.length} tasks`);

    if (generatedTasks.length > 0) {
      const tasksToInsert = generatedTasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        itemName: t.itemName,
        estimatedTimeMinutes: t.estimatedTimeMinutes,
        estimatedCost: t.estimatedCost,
        canBeOutsourced: t.canBeOutsourced,
        canDefer: t.canDefer,
        deferLimitDays: t.deferLimitDays,
        category: t.category,
        icon: t.icon,
        imageUrl: t.image,
        taskType: t.taskType,
        recurrenceInterval: t.recurrenceInterval,
        criticality: t.criticality,
        dueDate: t.dueDate.toISOString(),
        userId,
        trackableId: newTrackable.id,
      }));

      console.log('📝 Prepared task objects for DB insert:', tasksToInsert);

      try {
        await prisma.task.createMany({ data: tasksToInsert });
        console.log(`✅ Inserted ${tasksToInsert.length} tasks into DB`);
      } catch (insertError) {
        console.error('❌ Task insert failed:', insertError);
      }
    } else {
      console.log('⚠️ No tasks generated — check if templates exist for the model or type.');
    }

    res.status(201).json({
      trackable: newTrackable,
      tasks: generatedTasks,
    });

  } catch (err) {
    console.error('❌ Failed to create trackable:', err);
    res.status(500).json({ error: 'Failed to create trackable' });
  }
};

export const deleteTrackable = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { id } = req.params;

  if (!userId) return res.status(400).json({ message: 'Missing user ID' });

  try {
    // Optional: verify ownership
    const trackable = await prisma.trackable.findUnique({
      where: { id },
    });

    if (!trackable || trackable.userId !== userId) {
      return res.status(404).json({ message: 'Trackable not found' });
    }

    // Delete related tasks first (foreign key constraint)
    await prisma.task.deleteMany({ where: { trackableId: id } });

    // Now delete the trackable
    await prisma.trackable.delete({ where: { id } });

    res.status(204).send(); // no content
  } catch (err) {
    console.error('Failed to delete trackable:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
