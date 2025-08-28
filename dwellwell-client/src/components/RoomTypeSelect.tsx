// src/components/RoomTypeSelect.tsx
import { ROOM_TYPES } from '@shared/constants';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export function RoomTypeSelect({ value, onChange, className }: Props) {
  return (
    <div className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      >
        <option value="">Select a type...</option>
        {ROOM_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}
