import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { generateTasksFromTrackable } from '../utils/generateTasksFromTrackable';

export const getTrackables = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Missing user ID' });
    }

    const { homeId } = req.query;
    if (!homeId || typeof homeId !== 'string') {
      return res.status(400).json({ message: 'Missing home ID' });
    }

    const trackables = await prisma.trackable.findMany({
      where: { homeId },
    });

    res.json(trackables);
  } catch (err) {
    console.error('❌ Failed to fetch trackables:', err);
    res.status(500).json({ error: 'Failed to fetch trackables' });
  }
};

export const createTrackable = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ message: 'Missing user ID' });

    const {
      homeId,
      applianceCatalogId,
      userDefinedName,
      serialNumber,
      imageUrl,
      notes,
    } = req.body;

    if (!homeId || !applianceCatalogId || !userDefinedName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTrackable = await prisma.trackable.create({
      data: {
        home: { connect: { id: homeId } },
        applianceCatalog: { connect: { id: applianceCatalogId } },
        userDefinedName,
        serialNumber,
        imageUrl,
        notes,
      },
    });

    // Look up appliance info for task generation
    const appliance = await prisma.applianceCatalog.findUnique({
      where: { id: applianceCatalogId },
    });

    if (!appliance) {
      return res.status(400).json({ message: 'Appliance catalog item not found' });
    }

    console.log(`🧪 Creating trackable: ${userDefinedName}`);
    console.log(`🧪 Looking up templates for model: "${appliance.model}" or type: "${appliance.type}"`);

    const generatedTasks = await generateTasksFromTrackable({
      name: userDefinedName,
      type: appliance.type,
      category: appliance.category,
      brand: appliance.brand,
      model: appliance.model,
    });

    console.log(`➡️  Generated ${generatedTasks.length} tasks`);

    if (generatedTasks.length > 0) {
      const tasksToInsert = generatedTasks.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status ?? 'PENDING',
        itemName: t.itemName,
        estimatedTimeMinutes: t.estimatedTimeMinutes,
        estimatedCost: t.estimatedCost,
        canBeOutsourced: t.canBeOutsourced,
        canDefer: t.canDefer,
        deferLimitDays: t.deferLimitDays,
        category: t.category,
        icon: t.icon,
        imageUrl: t.image ?? null,
        taskType: ['GENERAL', 'AI_GENERATED', 'USER_DEFINED'].includes(t.taskType)
          ? (t.taskType as 'GENERAL' | 'AI_GENERATED' | 'USER_DEFINED')
          : 'GENERAL',
        recurrenceInterval: t.recurrenceInterval,
        criticality: t.criticality,
        dueDate: t.dueDate.toISOString(),
        userId,
        trackableId: newTrackable.id,
      }));

      try {
        await prisma.userTask.createMany({ data: tasksToInsert });
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
  const userId = (req as any).user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(400).json({ message: 'Missing user ID' });

  try {
    const trackable = await prisma.trackable.findUnique({
      where: { id },
      include: { home: true },
    });

    if (!trackable || trackable.home.userId !== userId) {
      return res.status(404).json({ message: 'Trackable not found' });
    }

    await prisma.userTask.deleteMany({ where: { trackableId: id } });
    await prisma.trackable.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete trackable:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
