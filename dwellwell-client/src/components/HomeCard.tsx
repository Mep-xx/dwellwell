// src/components/HomeCard.tsx

import { useState } from 'react';
import { Home } from '@shared/types/home';
import { Room } from '@shared/types/room';
import { Task } from '@shared/types/task';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

type TaskSummary = {
  complete: number;
  dueSoon: number;
  overdue: number;
  total: number;
};

type Props = {
  home: Home & { rooms?: (Room & { tasks?: Task[] })[] };
  summary?: TaskSummary;
  onToggle: (homeId: string, newValue: boolean) => void;
  onEdit: (home: Home) => void;
  onDelete: (homeId: string) => void;
};

export function HomeCard({ home, summary, onToggle, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);

  const getPercent = (complete: number, total: number) =>
    total === 0 ? 0 : Math.round((complete / total) * 100);

  const getRoomStats = (tasks: Task[] = []) => {
    const now = new Date();
    const complete = tasks.filter((t) => t.status === 'COMPLETED').length;
    const overdue = tasks.filter((t) => !t.completedDate && new Date(t.dueDate) < now).length;
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

  return (
    <div className="rounded-xl border shadow bg-white overflow-hidden">
      {/* Image */}
      <img
        src={
          home.imageUrl
            ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${home.imageUrl}`
            : '/images/home_placeholder.png'
        }
        alt={home.nickname || home.address}
        title={home.nickname || home.address}
        className="w-full h-40 object-cover"
      />

      {/* Info */}
      <div className="p-4 space-y-2 text-sm text-gray-700">
        {home.nickname && (
          <p className="text-sm text-gray-500 italic">{home.nickname}</p>
        )}
        <p className="text-base font-semibold text-gray-800">
          {home.address}, {home.city}, {home.state}
        </p>
        <p>
          {home.squareFeet?.toLocaleString?.()} sq. ft. • {home.lotSize} acres • Built in{' '}
          {home.yearBuilt}
        </p>
        {home.features?.length > 0 && (
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
          <span className="flex items-center gap-1">
            ✅ {summary?.complete ?? 0} Tasks Done
          </span>
          <span className="flex items-center gap-1">
            🕒 {summary?.dueSoon ?? 0} Due Soon
          </span>
          <span className="flex items-center gap-1">
            ⚠️ {summary?.overdue ?? 0} Overdue
          </span>
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
          onClick={() => setExpanded((prev) => !prev)}
          className="px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-full flex items-center gap-2 text-sm font-medium mx-auto my-2 transition-colors"
        >
          {expanded ? "Show Less" : "Show More"}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}

      {/* Expanded Room Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-6">
          {home.rooms?.map((room) => {
            const stats = getRoomStats(room.tasks || []);
            return (
              <div key={room.id} className="border-t pt-4">
                <p className="font-medium text-gray-800">
                  {room.name} ({room.type})
                </p>
                <p className="text-sm text-gray-600">
                  ✅ {stats.complete} done • 🕒 {stats.dueSoon} due soon • ⚠️ {stats.overdue} overdue
                </p>
                <div className="w-full bg-gray-200 h-2 rounded mt-1 overflow-hidden">
                  <div
                    className="bg-brand-primary h-2"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
                {room.tasks?.length ? (
                  <ul className="mt-2 pl-4 text-sm list-disc text-gray-700 space-y-1">
                    {room.tasks
                      .filter((t) => t.status !== 'COMPLETED')
                      .slice(0, 5)
                      .map((task) => (
                        <li key={task.id}>{task.title}</li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-gray-400 mt-1">No tasks for this room</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Switch
            checked={home.isChecked}
            onCheckedChange={(value) => onToggle(home.id, value)}
          />
          <span className="text-sm text-gray-600">Include in To-Do</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(home)}
            title="Edit"
            className="text-gray-500 hover:text-gray-700"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(home.id)}
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
