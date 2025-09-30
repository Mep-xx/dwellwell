// dwellwell-client/src/pages/community/components/UserChip.tsx
import { memo, useMemo } from "react";

function initials(nameOrEmail?: string) {
  if (!nameOrEmail) return "U";
  const base = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail;
  const parts = base
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (!parts.length) return base.slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type Rep = { level: number; totalXP: number };
type User = { email?: string; avatarUrl?: string; image?: string; photoUrl?: string; picture?: string };

function UserChipBase({ user, rep }: { user: User; rep: Rep }) {
  const src =
    user?.avatarUrl || user?.image || user?.photoUrl || user?.picture || "";

  const displayEmail = user?.email ?? "User";
  const init = useMemo(() => initials(displayEmail), [displayEmail]);

  return (
    <div className="flex items-center gap-2 min-w-0">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-700 dark:text-slate-100"
          title={displayEmail}
          aria-hidden
        >
          {init}
        </div>
      )}
      <div className="leading-tight min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate max-w-[160px]" title={displayEmail}>
            {displayEmail}
          </span>
          <span className="text-[10px] rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 shrink-0">
            Lv {rep.level}
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
            {rep.totalXP} XP
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(UserChipBase);
