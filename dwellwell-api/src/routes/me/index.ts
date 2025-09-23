// dwellwell-api/src/routes/me/index.ts
import { Router } from "express";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { startOfWeek, subWeeks } from "date-fns";

const router = Router();
router.use(requireAuth);

// Compute consecutive weekly streak up to current week.
// Any completed task in a week counts for that week.
function computeWeeklyStreak(completedAtDates: Date[]): number {
  if (!completedAtDates.length) return 0;

  // Map each date to the ISO week start boundary for comparison
  const weeks = new Set<string>();
  for (const d of completedAtDates) {
    const w = startOfWeek(d, { weekStartsOn: 1 }); // Monday
    weeks.add(w.toISOString());
  }
  // Starting from current week, count backwards until a gap
  let streak = 0;
  let cursor = startOfWeek(new Date(), { weekStartsOn: 1 });
  while (true) {
    const key = cursor.toISOString();
    if (weeks.has(key)) {
      streak += 1;
      cursor = subWeeks(cursor, 1);
    } else {
      break;
    }
  }
  return streak;
}

// Map actions to nicer, human-readable text
function formatAction(action: string, entity?: string): string {
  switch (action) {
    case "task_completed":
      return "Completed a task";
    case "trackable_added":
      return "Added a trackable";
    case "trackable_deleted":
      return "Deleted a trackable";
    case "trackable_retired":
      return "Retired a trackable";
    case "trackable_revived":
      return "Revived a trackable";
    case "home_created":
      return "Created a home";
    default: {
      // Fall back to action string with entity context
      const base = action.replaceAll("_", " ");
      return entity ? `${base} ${entity}` : base;
    }
  }
}

router.get("/overview", async (req, res) => {
  const userId = (req as any).user?.id as string;

  // Basic user & profile
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        avatarUrl: true,
        timezone: true,
        locale: true,
        units: true,
        householdRole: true,
        diySkill: true,
      },
    }),
  ]);

  // Membership
  const billing = await prisma.billingAccount.findUnique({
    where: { userId },
    select: { plan: true, status: true, trialEndsAt: true },
  });

  // Stats
  const [homesCount, trackablesCount, tasksOpen, tasksCompletedAll] =
    await Promise.all([
      prisma.home.count({ where: { userId } }),
      prisma.trackable.count({
        where: {
          ownerUserId: userId,
          status: { in: ["IN_USE", "PAUSED", "RETIRED"] },
        },
      }),
      prisma.userTask.count({
        where: { userId, status: "PENDING", archivedAt: null },
      }),
      prisma.userTask.count({
        where: { userId, status: "COMPLETED" },
      }),
    ]);

  // Completed dates for streak
  const recentCompleted = await prisma.userTask.findMany({
    where: { userId, completedDate: { not: null } },
    select: { completedDate: true },
    orderBy: { completedDate: "desc" },
    take: 2000,
  });
  const weeklyStreak = computeWeeklyStreak(
    recentCompleted
      .filter((r) => r.completedDate)
      .map((r) => r.completedDate as Date)
  );

  // Activity feed
  const activityEvents = await prisma.lifecycleEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const activity =
    activityEvents.length > 0
      ? activityEvents.map((e) => ({
          id: e.id,
          label: formatAction(e.action, e.entity),
          ts: e.createdAt.toISOString(),
        }))
      : recentCompleted.slice(0, 10).map((t, i) => ({
          id: `completed-${i}`,
          label: "Completed a task",
          ts: (t.completedDate as Date).toISOString(),
        }));

  // Derived badges from streak
  const badges: {
    id: string;
    label: string;
    icon:
      | "trophy"
      | "star"
      | "medal"
      | "crown"
      | "shield"
      | "flame";
    earnedAt?: string | null;
  }[] = [];
  if (weeklyStreak >= 1)
    badges.push({ id: "first-fire", label: "First Flame", icon: "flame" });
  if (weeklyStreak >= 4)
    badges.push({ id: "ember-4", label: "4-Week Ember", icon: "medal" });
  if (weeklyStreak >= 12)
    badges.push({ id: "quarter-crush", label: "Quarter Crush", icon: "trophy" });
  if (weeklyStreak >= 26)
    badges.push({
      id: "half-year",
      label: "Half-Year Hero",
      icon: "shield",
    });
  if (weeklyStreak >= 52)
    badges.push({
      id: "year-crown",
      label: "Year Crown",
      icon: "crown",
    });

  res.json({
    user,
    profile: profile ?? null,
    membership: {
      plan: billing?.plan ?? null,
      status: billing?.status ?? null,
      trialEndsAt: billing?.trialEndsAt
        ? billing.trialEndsAt.toISOString()
        : null,
    },
    stats: {
      homes: homesCount,
      trackables: trackablesCount,
      tasksOpen,
      tasksCompleted: tasksCompletedAll,
      weeklyStreak,
    },
    activity: {
      items: activity,
    },
    badges,
  });
});

export default router;
