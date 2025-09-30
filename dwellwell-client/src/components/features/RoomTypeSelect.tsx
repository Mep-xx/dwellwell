// dwellwell-client/src/components/RoomTypeSelect.tsx
import { ROOM_TYPES } from '@shared/constants';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export function RoomTypeSelect({ value, onChange, className }: Props) {
  const sortedTypes = [...ROOM_TYPES].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  return (
    <div className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-token bg-card text-body rounded px-3 py-2 text-sm"
      >
        <option value="">Select a type...</option>
        {sortedTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}
