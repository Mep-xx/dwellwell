//dwellwell-client/src/pages/Profile.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  Crown,
  Flame,
  Home as HomeIcon,
  ListChecks,
  Medal,
  ShieldCheck,
  Star,
  Trophy,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";

type Units = "imperial" | "metric";
type HouseholdRole = "owner" | "renter" | "property_manager";
type DiySkill = "none" | "beginner" | "intermediate" | "pro";

type ProfileOverview = {
  user: {
    id: string;
    email: string;
    role: "user" | "admin";
  };
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    timezone?: string | null;
    locale?: string | null;
    units?: Units | null;
    householdRole?: HouseholdRole | null;
    diySkill?: DiySkill | null;
  } | null;
  membership: {
    plan: string | null;
    status: string | null;
    trialEndsAt: string | null;
  };
  stats: {
    homes: number;
    trackables: number;
    tasksOpen: number;
    tasksCompleted: number;
    weeklyStreak: number;
  };
  activity: {
    items: { id: string; label: string; ts: string }[];
  };
  badges: {
    id: string;
    label: string;
    icon: "trophy" | "star" | "medal" | "crown" | "shield" | "flame";
    earnedAt?: string | null;
  }[];
};

function Avatar({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
        <UserIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-20 w-20 rounded-full object-cover border border-border"
      referrerPolicy="no-referrer"
    />
  );
}

function IconFromName({
  name,
  className,
}: {
  name: ProfileOverview["badges"][number]["icon"];
  className?: string;
}) {
  switch (name) {
    case "trophy":
      return <Trophy className={className} />;
    case "star":
      return <Star className={className} />;
    case "medal":
      return <Medal className={className} />;
    case "crown":
      return <Crown className={className} />;
    case "shield":
      return <ShieldCheck className={className} />;
    case "flame":
      return <Flame className={className} />;
    default:
      return <Star className={className} />;
  }
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<ProfileOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get<ProfileOverview>("/me/overview");
        if (mounted) setData(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!data?.profile) return user?.email ?? "User";
    const { firstName, lastName } = data.profile;
    const n = [firstName, lastName].filter(Boolean).join(" ");
    return n || user?.email || "User";
  }, [data?.profile, user?.email]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              We couldn’t load your profile right now.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { membership, stats, activity, badges } = data;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={data.profile?.avatarUrl} alt={displayName} />
          <div>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/settings">
            <Button variant="outline">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gamification */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Streak & Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Weekly Streak</div>
              <div className="font-semibold">{stats.weeklyStreak} week{stats.weeklyStreak === 1 ? "" : "s"}</div>
            </div>
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div
                className="h-2 bg-primary"
                style={{
                  width: `${Math.min(stats.weeklyStreak, 52) / 52 * 100}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {badges.length === 0 ? (
                <span className="text-sm text-muted-foreground">No badges yet — complete tasks to earn your first badge.</span>
              ) : badges.map((b) => (
                <Badge
                  key={b.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                  title={b.earnedAt ? `Earned ${new Date(b.earnedAt).toLocaleDateString()}` : undefined}
                >
                  <IconFromName name={b.icon} className="h-3.5 w-3.5" />
                  {b.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Homes & Trackables */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5" />
              Homes & Trackables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Homes</div>
              <div className="font-semibold">{stats.homes}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Trackables</div>
              <div className="font-semibold">{stats.trackables}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Open Tasks</div>
              <div className="font-semibold">{stats.tasksOpen}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="font-semibold">{stats.tasksCompleted}</div>
            </div>
            <div className="flex gap-2">
              <Link to="/app/homes">
                <Button variant="outline" className="w-full">
                  Manage Homes
                </Button>
              </Link>
              <Link to="/app/tasks">
                <Button className="w-full">
                  <ListChecks className="mr-2 h-4 w-4" />
                  View Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Membership */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Plan</div>
              <div className="font-semibold">{membership.plan ?? "Free"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-semibold">{membership.status ?? "inactive"}</div>
            </div>
            {membership.trialEndsAt && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Trial ends</div>
                <div className="font-semibold">
                  {new Date(membership.trialEndsAt).toLocaleDateString()}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Link to="/app/billing">
                <Button className="w-full">Manage Billing</Button>
              </Link>
              <Link to="/app/settings">
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contributions / Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activity.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No recent activity yet. Complete a task or add a trackable to get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {activity.items.map((a) => (
                <li key={a.id} className="text-sm flex items-center justify-between">
                  <span>{a.label}</span>
                  <span className="text-muted-foreground">
                    {new Date(a.ts).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}