//dwellwell-client/src/pages/community/components/UserChip.tsx
function initials(nameOrEmail?: string) {
  if (!nameOrEmail) return "U";
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = base.replace(/[^a-z0-9]+/gi, " ").trim().split(" ").filter(Boolean);
  if (!parts.length) return base.slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function UserChip({ user, rep }: { user: any; rep: { level: number; totalXP: number } }) {
  const src =
    user?.avatarUrl ||
    user?.image ||
    user?.photoUrl ||
    user?.picture ||
    "";

  return (
    <div className="flex items-center gap-2">
      {src ? (
        <img src={src} alt="" className="h-8 w-8 rounded-full object-cover"
          referrerPolicy="no-referrer" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-700">
          {initials(user?.email)}
        </div>
      )}
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate max-w-[140px]">{user?.email ?? "User"}</span>
          <span className="text-[10px] rounded-full px-2 py-0.5 bg-slate-100 text-slate-700">Lv {rep.level}</span>
          <span className="text-[10px] text-slate-600">{rep.totalXP} XP</span>
        </div>
      </div>
    </div>
  );
}
