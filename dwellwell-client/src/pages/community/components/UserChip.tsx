//dwellwell-client/src/pages/community/components/UserChip.tsx
export default function UserChip({ user, rep }: { user: any; rep: { level: number; totalXP: number } }) {
  return (
    <div className="flex items-center gap-2">
      <img src={user?.avatarUrl ?? "/avatar.svg"} className="h-8 w-8 rounded-full" />
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-medium">{user?.displayName ?? "User"}</span>
          <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted">Lv {rep.level}</span>
          <span className="text-[10px] text-muted-foreground">{rep.totalXP} XP</span>
        </div>
      </div>
    </div>
  );
}
