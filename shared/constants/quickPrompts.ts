//shared/constants/quickPrompts.ts
export type QuickPrompt = {
  id: string;
  label: string;
  kind: string;       // maps to Trackable.kind
  category?: string;  // optional
  suggestedName?: string;
};

export const COMMON_ROOM_PROMPTS: Record<string, QuickPrompt[]> = {
  kitchen: [
    { id: "kitchen-dishwasher", label: "Do you have a dishwasher?", kind: "dishwasher", category: "appliance" },
    { id: "kitchen-refrigerator", label: "Do you have a refrigerator?", kind: "refrigerator", category: "appliance" },
    { id: "kitchen-range", label: "Do you have a range or oven?", kind: "range", category: "appliance" },
    { id: "kitchen-microwave", label: "Do you have a microwave?", kind: "microwave", category: "appliance" },
  ],
  living_room: [
    { id: "living-fireplace", label: "Do you have a fireplace?", kind: "fireplace", category: "system" },
    { id: "living-ceiling-fan", label: "Do you have a ceiling fan?", kind: "ceiling_fan", category: "appliance" },
  ],
  laundry: [
    { id: "laundry-washer", label: "Do you have a washing machine?", kind: "washer", category: "appliance" },
    { id: "laundry-dryer", label: "Do you have a dryer?", kind: "dryer", category: "appliance" },
  ],
  basement: [
    { id: "basement-water-heater", label: "Do you have a water heater?", kind: "water_heater", category: "system" },
    { id: "basement-sump-pump", label: "Do you have a sump pump?", kind: "sump_pump", category: "system" },
    { id: "basement-dehumidifier", label: "Do you run a dehumidifier?", kind: "dehumidifier", category: "appliance" },
  ],
  bathroom: [
    { id: "bathroom-exhaust-fan", label: "Do you have a bathroom exhaust fan?", kind: "exhaust_fan", category: "appliance" },
  ],
  bedroom: [
    { id: "bedroom-ceiling-fan", label: "Do you have a ceiling fan?", kind: "ceiling_fan", category: "appliance" },
  ],
};
