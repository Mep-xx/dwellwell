import type { FC } from "react";
import {
  Refrigerator, Bath, BedDouble, Sofa, DoorOpen, Warehouse, Utensils, Briefcase,
  Shirt, Car, Package, Home, Umbrella, Sun, Dumbbell, Gamepad2, MoonStar,
  BookOpen, Hammer, Tv,
} from "lucide-react";

export type RoomVisual = {
  label: string;
  Icon: FC<any>;
  accent: string;
  // you only use webp
  imageWebp1x: string;
  imageWebp2x?: string;
};

export const ROOM_BANNER_SIZE = { width: 1600, height: 400 } as const;

// ✅ Always absolute so the browser never treats it as a hostname.
const BASE = "/room-banners";

function v(label: string, Icon: FC<any>, accent: string, slug: string): RoomVisual {
  return {
    label,
    Icon,
    accent,
    imageWebp1x: `${BASE}/${slug}.webp`,
  };
}

/** Select visuals based on a human room type string. */
export function getRoomVisual(type?: string | null): RoomVisual {
  const key = (type || "").toLowerCase();

  if (key.includes("kitchen")) return v("Kitchen", Refrigerator, "#334155", "kitchen");
  if (key.includes("bath")) return v("Bathroom", Bath, "#0369a1", "bathroom");
  if (key.includes("bed")) return v("Bedroom", BedDouble, "#6d28d9", "bedroom");
  if (key.includes("living") || key.includes("family")) return v("Living Room", Sofa, "#b45309", "living-room");
  if (key.includes("dining")) return v("Dining Room", Utensils, "#7c3aed", "dining-room");
  if (key.includes("office") || (key.includes("study") && !key.includes("library"))) return v("Office", Briefcase, "#2563eb", "office");
  if (key.includes("laundry")) return v("Laundry Room", Shirt, "#059669", "laundry-room");
  if (key.includes("garage")) return v("Garage", Car, "#4b5563", "garage");
  if (key.includes("basement")) return v("Basement", Package, "#6b7280", "basement");
  if (key.includes("attic")) return v("Attic", Home, "#94a3b8", "attic");
  if (key.includes("closet")) return v("Closet", Shirt, "#a78bfa", "closet");
  if (key.includes("pantry")) return v("Pantry", Utensils, "#16a34a", "pantry");
  if (key.includes("mudroom") || key.includes("mud room")) return v("Mudroom", Umbrella, "#ea580c", "mudroom");
  if (key.includes("entryway") || key.includes("entry") || key.includes("foyer")) return v("Entryway", DoorOpen, "#be123c", "entryway");
  if (key.includes("sunroom") || key.includes("sun room")) return v("Sunroom", Sun, "#eab308", "sunroom");
  if (key.includes("home gym") || key.includes("gym")) return v("Home Gym", Dumbbell, "#22c55e", "home-gym");
  if (key.includes("playroom") || key.includes("play room") || key.includes("kids")) return v("Playroom", Gamepad2, "#f43f5e", "playroom");
  if (key.includes("nursery")) return v("Nursery", MoonStar, "#ec4899", "nursery");
  if (key.includes("library") || (key.includes("study") && !key.includes("office"))) return v("Library / Study", BookOpen, "#0f766e", "library-study");
  if (key.includes("workshop")) return v("Workshop", Hammer, "#92400e", "workshop");
  if (key.includes("theater") || key.includes("media")) return v("Theater / Media Room", Tv, "#0f172a", "theater-media-room");
  if (key.includes("guest")) return v("Guest Room", BedDouble, "#4f46e5", "guest-room");
  if (key.includes("other")) return v("Room", Warehouse, "#475569", "default");

  return v("Room", Warehouse, "#475569", "default");
}
