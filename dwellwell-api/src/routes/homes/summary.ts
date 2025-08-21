// dwellwell-api/src/routes/homes/summary.ts
import express from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { isBefore, addDays } from 'date-fns';

const router = express.Router();

async function handleSummary(req: express.Request, res: express.Response) {
  const userId = (req as any).user.userId;
  // path can be /homes/:id/task-summary or /:id/task-summary — pick whichever exists
  const homeId = (req.params as any).id;

  if (!homeId) {
    return res.status(400).json({ error: 'homeId is required' });
  }

  try {
    // NOTE: This matches your original schema usage:
    // userTask -> trackable -> homeId
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
      const due = task.dueDate ? new Date(task.dueDate) : null;
      if (task.completedDate) {
        complete++;
      } else if (due && isBefore(due, now)) {
        overdue++;
      } else if (due && isBefore(due, dueSoonThreshold)) {
        dueSoon++;
      }
    }

    res.json({ complete, dueSoon, overdue, total: tasks.length });
  } catch (err) {
    console.error('Failed to fetch task summary:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Original path (when mounted at '/api' this is '/api/:id/task-summary')
router.get('/:id/task-summary', requireAuth, handleSummary);

// Alias that matches your client call (when mounted at '/api' this is '/api/homes/:id/task-summary')
router.get('/homes/:id/task-summary', requireAuth, handleSummary);

export default router;
