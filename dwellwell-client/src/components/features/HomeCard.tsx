// dwellwell-client/src/components/HomeCard.tsx
import { useState } from "react";
import { Home } from "@shared/types/home";
import { Room } from "@shared/types/room";
import { Task } from "@shared/types/task";
import { ROOM_TYPE_ICONS } from "@shared/constants";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

type TaskSummary = {
  complete: number;
  dueSoon: number;
  overdue: number;
  total: number;
};

type Props = {
  home: Home & { rooms?: (Room & { userTasks?: Task[] })[] };
  summary?: TaskSummary;
  onToggle: (homeId: string, newValue: boolean) => void;
  onEdit: (home: Home) => void;
  onDelete: (homeId: string) => void;
};

function resolveHomeImageUrl(v?: string | null ) {
  const PLACEHOLDER = "/images/home_placeholder.png";
  if (!v) return PLACEHOLDER;

  // Already an absolute URL
  if (/^https?:\/\//i.test(v)) return v;

  // App-provided placeholders
  if (v.startsWith("/images/")) return v;

  // Things like "/uploads/..." or "uploads/..."
  const base = api.defaults.baseURL ?? window.location.origin; // e.g. http://localhost:4000/api
  const apiOrigin = new URL("/", base).origin;                  // -> http://localhost:4000

  const trimmed = v.replace(/^\/?api\/?/, "").replace(/^\/+/, ""); // drop leading api/ and slashes
  if (trimmed.startsWith("uploads/")) return `${apiOrigin}/${trimmed}`;

  // Last resort: if server returned a weird relative path, still try to make it absolute
  return `${apiOrigin}/${trimmed}`;
}

export function HomeCard({ home, summary, onToggle, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const getPercent = (complete: number, total: number) =>
    total === 0 ? 100 : Math.round((complete / Math.max(total, 1)) * 100);

  const getRoomStats = (tasks: Task[] = []) => {
    const now = new Date();
    const complete = tasks.filter((t) => t.status === "COMPLETED").length;
    const overdue = tasks.filter(
      (t) => !t.completedDate && new Date(t.dueDate) < now
    ).length;
    const dueSoon = tasks.filter(
      (t) =>
        !t.completedDate &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    ).length;
    return {
      complete,
      dueSoon,
      overdue,
      total: tasks.length,
      percent: getPercent(complete, tasks.length),
    };
  };

  const imageSrc = resolveHomeImageUrl(home.imageUrl);
  const acres = typeof home.lotSize === "number" ? home.lotSize / 43560 : undefined;

  return (
    <div
      className={`relative rounded-xl border shadow overflow-hidden
                  transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer
                  focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2 focus-within:ring-offset-background`}
    >
      {/* Image */}
      <img
        src={imageSrc}
        alt={home.nickname || home.address}
        title={home.nickname || home.address}
        className={`w-full h-40 object-cover transition-all ${home.isChecked ? "" : "grayscale"}`}
      />

      {!home.isChecked && (
        <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
          Not in To-Do
        </div>
      )}

      {/* Info */}
      <div className="p-4 space-y-2 text-sm text-gray-700">
        {home.nickname && (
          <p className="text-sm text-gray-500 italic">{home.nickname}</p>
        )}
        <p className="text-base font-semibold text-gray-800">
          {home.address}, {home.city}, {home.state}
        </p>
        <p>
          {home.squareFeet?.toLocaleString?.()} sq. ft. • {acres?.toFixed?.(2)} acres • Built in {home.yearBuilt}
        </p>
        {Array.isArray(home.features) && home.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {home.features.map((feature) => (
              <span
                key={feature}
                className="bg-gray-100 text-xs text-gray-800 px-2 py-1 rounded-full border border-gray-300"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="px-4 pb-4">
        <p className="text-base font-medium text-gray-800">
          🏅 Maintenance Score: {getPercent(summary?.complete || 0, summary?.total || 0)}% Complete
        </p>
        <p className="text-sm text-gray-600 flex gap-4">
          <span className="flex items-center gap-1">✅ {summary?.complete ?? 0} Tasks Done</span>
          <span className="flex items-center gap-1">🕒 {summary?.dueSoon ?? 0} Due Soon</span>
          <span className="flex items-center gap-1">⚠️ {summary?.overdue ?? 0} Overdue</span>
        </p>
        <div className="w-full bg-gray-200 h-2 rounded mt-2 overflow-hidden">
          <div
            className="bg-brand-primary h-2 transition-all"
            style={{ width: `${getPercent(summary?.complete || 0, summary?.total || 0)}%` }}
          />
        </div>
      </div>

      {/* Expand / Collapse Button */}
      {home.rooms && home.rooms.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent parent navigation
            setExpanded((prev) => !prev);
          }}
          className="px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-full
                     flex items-center gap-2 text-sm font-medium mx-auto my-2 transition-colors"
        >
          {expanded ? "Hide Rooms" : "Show Rooms"}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}

      {/* Expanded Room Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-6">
          {home.rooms?.map((room) => {
            const stats = getRoomStats(room.userTasks || []);
            return (
              <div key={room.id} className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-lg">{ROOM_TYPE_ICONS[room.type] ?? "📦"}</span>
                    {room.name || room.type}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-500 hover:text-brand-primary"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent parent navigation
                      setEditingRoom(room);
                    }}
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  📋 {stats.total} total • ✅ {stats.complete} done • 🕒 {stats.dueSoon} due soon • ⚠️ {stats.overdue} overdue
                </p>
                <div className="w-full bg-gray-200 h-2 rounded mt-1 overflow-hidden">
                  <div className="bg-brand-primary h-2" style={{ width: `${stats.percent}%` }} />
                </div>
                {room.userTasks && room.userTasks.length > 0 ? (
                  room.userTasks.some((t) => t.status !== "COMPLETED") ? (
                    <ul className="mt-2 pl-4 text-sm list-disc text-gray-700 space-y-1">
                      {room.userTasks
                        .filter((t) => t.status !== "COMPLETED")
                        .slice(0, 5)
                        .map((userTask) => <li key={userTask.id}>{userTask.title}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-gray-400 mt-1">All tasks are complete!</p>
                  )
                ) : (
                  <p className="text-sm italic text-gray-400 mt-1">No tasks assigned to this room.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Switch
            checked={home.isChecked}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(value) => onToggle(home.id, value)}
          />
          <span className="text-sm text-gray-600">Include in To-Do</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(home);
            }}
            title="Edit"
            className="text-gray-500 hover:text-gray-700"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(home.id);
            }}
            title="Delete"
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
