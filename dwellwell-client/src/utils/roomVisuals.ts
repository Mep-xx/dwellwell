// dwellwell-client/src/utils/roomVisuals.ts
import type { FC } from "react";
import {
    Refrigerator,
    Bath,
    BedDouble,
    Sofa,
    DoorOpen,
    Warehouse,
    Utensils,
    Briefcase,
    Shirt,
    Car,
    Package,
    Home,
    Umbrella,
    Sun,
    Dumbbell,
    Gamepad2,
    MoonStar,
    BookOpen,
    Hammer,
    Tv,
} from "lucide-react";

export type RoomVisual = {
    label: string;
    Icon: FC<any>;
    accent: string;
    image1x: string;   // jpg 1x
    image2x?: string;  // jpg 2x
    webp1x?: string;   // webp 1x
    webp2x?: string;   // webp 2x
};

/** Recommended banner export size */
export const ROOM_BANNER_SIZE = { width: 1600, height: 400 } as const;

// Respect Vite's base URL so this works under /app/*
const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");
const BASE = `${BASE_URL}/room-banners`;

function v(label: string, Icon: FC<any>, accent: string, slug: string): RoomVisual {
    return {
        label,
        Icon,
        accent,
        image1x: `${BASE}/${slug}.jpg`,
        image2x: `${BASE}/${slug}@2x.jpg`,
        webp1x: `${BASE}/${slug}.webp`,
        webp2x: `${BASE}/${slug}@2x.webp`,
    };
}

/**
 * Select visuals based on a human room type string.
 * Includes a bunch of synonyms and falls back to "Room".
 */
export function getRoomVisual(type?: string | null): RoomVisual {
    const key = (type || "").toLowerCase();

    // Core spaces
    if (key.includes("kitchen")) return v("Kitchen", Refrigerator, "#334155", "kitchen"); // slate-800
    if (key.includes("bath")) return v("Bathroom", Bath, "#0369a1", "bathroom"); // sky-800
    if (key.includes("bed")) return v("Bedroom", BedDouble, "#6d28d9", "bedroom"); // violet-700
    if (key.includes("living") || key.includes("family"))
        return v("Living Room", Sofa, "#b45309", "living-room"); // amber-700
    if (key.includes("dining"))
        return v("Dining Room", Utensils, "#7c3aed", "dining-room"); // violet-600
    if (key.includes("office") || (key.includes("study") && !key.includes("library")))
        return v("Office", Briefcase, "#2563eb", "office"); // blue-600
    if (key.includes("laundry"))
        return v("Laundry Room", Shirt, "#059669", "laundry-room"); // emerald-600
    if (key.includes("garage"))
        return v("Garage", Car, "#4b5563", "garage"); // gray-600
    if (key.includes("basement"))
        return v("Basement", Package, "#6b7280", "basement"); // gray-500
    if (key.includes("attic"))
        return v("Attic", Home, "#94a3b8", "attic"); // slate-400
    if (key.includes("closet"))
        return v("Closet", Shirt, "#a78bfa", "closet"); // violet-300
    if (key.includes("pantry"))
        return v("Pantry", Utensils, "#16a34a", "pantry"); // green-600
    if (key.includes("mudroom") || key.includes("mud room"))
        return v("Mudroom", Umbrella, "#ea580c", "mudroom"); // orange-600
    if (key.includes("entryway") || key.includes("entry") || key.includes("foyer"))
        return v("Entryway", DoorOpen, "#be123c", "entryway"); // rose-700
    if (key.includes("sunroom") || key.includes("sun room"))
        return v("Sunroom", Sun, "#eab308", "sunroom"); // yellow-500
    if (key.includes("home gym") || key.includes("gym"))
        return v("Home Gym", Dumbbell, "#22c55e", "home-gym"); // green-500
    if (key.includes("playroom") || key.includes("play room") || key.includes("kids"))
        return v("Playroom", Gamepad2, "#f43f5e", "playroom"); // rose-500
    if (key.includes("nursery"))
        return v("Nursery", MoonStar, "#ec4899", "nursery"); // pink-500
    if (key.includes("library") || (key.includes("study") && !key.includes("office")))
        return v("Library / Study", BookOpen, "#0f766e", "library-study"); // teal-700
    if (key.includes("workshop"))
        return v("Workshop", Hammer, "#92400e", "workshop"); // orange-800
    if (key.includes("theater") || key.includes("media"))
        return v("Theater / Media Room", Tv, "#0f172a", "theater-media-room"); // slate-900
    if (key.includes("guest"))
        return v("Guest Room", BedDouble, "#4f46e5", "guest-room"); // indigo-600
    if (key.includes("other"))
        return v("Room", Warehouse, "#475569", "default"); // slate-600

    // Fallback
    return v("Room", Warehouse, "#475569", "default");
}
