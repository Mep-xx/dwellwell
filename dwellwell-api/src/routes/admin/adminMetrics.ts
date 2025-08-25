// dwellwell-api/src/routes/admin/adminMetrics.ts
import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { startOfMonth } from 'date-fns';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const since = startOfMonth(new Date());
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersCount,
      premiumUsersCount,
      homesCount,
      trackablesCount,
      tasksCompletedThisMonth,
      aiQueriesLast7d,
      mostDismissedTemplates,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.billingAccount.count({ where: { plan: 'premium', status: 'active' } }),
      prisma.home.count(),
      prisma.trackable.count(),
      prisma.userTask.count({
        where: {
          completedDate: { gte: since },            // <-- matches your schema
          status: { equals: 'COMPLETED' as any },   // if you're using enum TaskStatus
        },
      }),
      prisma.aIQueryHistory.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.$queryRaw<
        { templateId: string | null; dismisses: bigint; name: string | null }[]
      >`
        SELECT tt.id as "templateId",
               COUNT(dut.id) as dismisses,
               tt.title as name
        FROM "DismissedUserTask" dut
        JOIN "UserTask" ut ON ut.id = dut."userTaskId"
        LEFT JOIN "TaskTemplate" tt ON tt.id = ut."taskTemplateId"
        GROUP BY tt.id
        ORDER BY dismisses DESC
        LIMIT 5;
      `,
    ]);

    // Feedback not in your schema yet; expose 0 for now.
    const feedbackOpenCount = 0;

    res.json({
      usersCount,
      premiumUsersCount,
      homesCount,
      trackablesCount,
      tasksCompletedThisMonth,
      feedbackOpenCount,
      aiQueriesLast7d,
      mostDismissedTemplates: (mostDismissedTemplates as any[]).map((r) => ({
        templateId: r.templateId,
        name: r.name ?? 'Unknown Template',
        dismisses: Number(r.dismisses),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch admin metrics' });
  }
});

export default router;
