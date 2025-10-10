// shared/constants/quickPrompts.ts

export type QuickPrompt = {
  id: string;
  label: string;
  kind: string;       // maps to Trackable.kind (kebab-case slug)
  category?: string;  // must be one of CATEGORY_OPTIONS values
  suggestedName?: string;
};

export const COMMON_ROOM_PROMPTS: Record<string, QuickPrompt[]> = {
  kitchen: [
    { id: "kitchen-dishwasher",   label: "Do you have a dishwasher?",   kind: "dishwasher",   category: "appliance" },
    { id: "kitchen-refrigerator", label: "Do you have a refrigerator?", kind: "refrigerator", category: "appliance" },
    { id: "kitchen-range",        label: "Do you have a range or oven?",kind: "range-oven",   category: "appliance" },
    { id: "kitchen-microwave",    label: "Do you have a microwave?",    kind: "microwave",    category: "appliance" },
    { id: "kitchen-range-hood",   label: "Range hood above the stove?", kind: "range-hood",   category: "kitchen"   },
    { id: "kitchen-sink-faucet",  label: "Sink faucet to track?",       kind: "sink-faucet",  category: "kitchen"   },
  ],
  living_room: [
    { id: "living-fireplace",     label: "Do you have a fireplace?",    kind: "fireplace",    category: "heating"   },
    { id: "living-ceiling-fan",   label: "Do you have a ceiling fan?",  kind: "ceiling-fan",  category: "electrical"},
  ],
  laundry: [
    { id: "laundry-washer",       label: "Do you have a washing machine?", kind: "washer",    category: "appliance" },
    { id: "laundry-dryer",        label: "Do you have a dryer?",           kind: "dryer",     category: "appliance" },
  ],
  basement: [
    { id: "basement-water-heater", label: "Do you have a water heater?",  kind: "water-heater",  category: "water"     },
    { id: "basement-sump-pump",    label: "Do you have a sump pump?",     kind: "sump-pump",     category: "plumbing"  },
    { id: "basement-dehumidifier", label: "Do you run a dehumidifier?",   kind: "dehumidifier",  category: "hvac"      },
  ],
  bathroom: [
    { id: "bathroom-exhaust-fan",  label: "Do you have a bathroom exhaust fan?", kind: "exhaust-fan", category: "bathroom" },
    { id: "bathroom-sink-faucet",  label: "Sink faucet to track?",             kind: "bath-faucet", category: "bathroom" },
  ],
  bedroom: [
    { id: "bedroom-ceiling-fan",   label: "Do you have a ceiling fan?",        kind: "ceiling-fan", category: "electrical" },
    { id: "bedroom-smoke-co",      label: "Smoke/CO detector installed?",      kind: "smoke-co",    category: "electrical" },
  ],
};
