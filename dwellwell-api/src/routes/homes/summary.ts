import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { isBefore, addDays } from 'date-fns';

const router = express.Router();

router.get('/:id/task-summary', requireAuth, async (req, res) => {
  const userId = (req as any).user.userId;
  const homeId = req.params.id;

  try {
    const tasks = await prisma.userTask.findMany({
      where: {
        userId,
        trackable: {
          homeId,
        },
      },
      select: {
        dueDate: true,
        completedDate: true,
      },
    });

    const now = new Date();
    const dueSoonThreshold = addDays(now, 7);

    let complete = 0;
    let dueSoon = 0;
    let overdue = 0;

    for (const task of tasks) {
      const due = new Date(task.dueDate);
      if (task.completedDate) complete++;
      else if (isBefore(due, now)) overdue++;
      else if (isBefore(due, dueSoonThreshold)) dueSoon++;
    }

    res.json({ complete, dueSoon, overdue, total: tasks.length });
  } catch (err) {
    console.error('Failed to fetch task summary:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
