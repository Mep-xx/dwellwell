// shared/constants/roomTypeTemplates.ts
// Central place to define default tasks per room type (created on room creation)
// and suggested trackables per room type (shown as quick-add chips on Room page).

export type DefaultTask = {
  title: string;
  description?: string;
  /** Recurrence descriptor (free-text for now: "3mo", "6mo", "yearly", etc.) */
  recurrenceInterval: string;
  /** Days from creation for first due date. Fallback used if not provided. */
  dueInDays?: number;
  estimatedTimeMinutes?: number;
  criticality?: "low" | "medium" | "high";
  category?: string;
};

export type SuggestedTrackable = {
  name: string;
  /** Optional type/category shown under name on UI */
  type?: string;
};

// ----- Default room tasks by room type -----

export const DEFAULT_ROOM_TASKS: Record<string, DefaultTask[]> = {
  Kitchen: [
    {
      title: "Clean range hood / filter",
      description: "Remove and degrease the filter; wipe the hood body.",
      recurrenceInterval: "3mo",
      dueInDays: 30,
      estimatedTimeMinutes: 20,
      criticality: "medium",
      category: "Maintenance",
    },
    {
      title: "Vacuum refrigerator coils",
      description: "Unplug and vacuum dust from coils to improve efficiency.",
      recurrenceInterval: "6mo",
      dueInDays: 45,
      estimatedTimeMinutes: 20,
      criticality: "medium",
      category: "Efficiency",
    },
    {
      title: "Test GFCI outlets",
      description: "Press TEST/RESET on each GFCI and confirm power cuts/restores.",
      recurrenceInterval: "6mo",
      dueInDays: 15,
      estimatedTimeMinutes: 10,
      criticality: "high",
      category: "Safety",
    },
    {
      title: "Deep clean oven",
      recurrenceInterval: "6mo",
      dueInDays: 60,
      estimatedTimeMinutes: 45,
      category: "Cleaning",
    },
  ],
  Bathroom: [
    {
      title: "Test GFCI outlets",
      recurrenceInterval: "6mo",
      dueInDays: 15,
      estimatedTimeMinutes: 10,
      criticality: "high",
      category: "Safety",
    },
    {
      title: "Descale showerhead / faucet aerators",
      recurrenceInterval: "6mo",
      dueInDays: 30,
      estimatedTimeMinutes: 20,
      category: "Maintenance",
    },
    {
      title: "Inspect caulk/grout",
      recurrenceInterval: "6mo",
      dueInDays: 45,
      estimatedTimeMinutes: 20,
      category: "Maintenance",
    },
  ],
  "Laundry Room": [
    {
      title: "Clean dryer lint duct",
      recurrenceInterval: "6mo",
      dueInDays: 30,
      estimatedTimeMinutes: 20,
      criticality: "high",
      category: "Safety",
    },
    {
      title: "Check washer hoses",
      recurrenceInterval: "6mo",
      dueInDays: 45,
      estimatedTimeMinutes: 10,
      category: "Maintenance",
    },
  ],
  "Living Room": [
    {
      title: "Test smoke/CO detectors",
      recurrenceInterval: "6mo",
      dueInDays: 15,
      estimatedTimeMinutes: 10,
      criticality: "high",
      category: "Safety",
    },
  ],
  Bedroom: [
    {
      title: "Test smoke/CO detectors",
      recurrenceInterval: "6mo",
      dueInDays: 15,
      estimatedTimeMinutes: 10,
      criticality: "high",
      category: "Safety",
    },
  ],
  Garage: [
    {
      title: "Test garage door auto-reverse",
      recurrenceInterval: "6mo",
      dueInDays: 30,
      estimatedTimeMinutes: 10,
      criticality: "high",
      category: "Safety",
    },
  ],
  Other: [],
};

// ----- Suggested trackables by room type -----

export const ROOM_TRACKABLE_SUGGESTIONS: Record<string, SuggestedTrackable[]> = {
  Kitchen: [
    { name: "Refrigerator", type: "Appliance" },
    { name: "Dishwasher", type: "Appliance" },
    { name: "Garbage Disposal", type: "Appliance" },
    { name: "Range Hood", type: "Appliance" },
    { name: "Stove / Oven", type: "Appliance" },
    { name: "Microwave", type: "Appliance" },
    { name: "Sink Faucet", type: "Fixture" },
    { name: "GFCI Outlets", type: "Electrical" },
  ],
  Bathroom: [
    { name: "Sink Faucet", type: "Fixture" },
    { name: "Shower Valve", type: "Fixture" },
    { name: "Toilet", type: "Fixture" },
    { name: "Exhaust Fan", type: "Appliance" },
    { name: "GFCI Outlets", type: "Electrical" },
  ],
  "Laundry Room": [
    { name: "Washer", type: "Appliance" },
    { name: "Dryer", type: "Appliance" },
    { name: "Laundry Sink Faucet", type: "Fixture" },
    { name: "GFCI Outlets", type: "Electrical" },
  ],
  Bedroom: [
    { name: "Ceiling Fan", type: "Electrical" },
    { name: "Smoke Detector", type: "Safety" },
  ],
  "Living Room": [
    { name: "Smoke Detector", type: "Safety" },
    { name: "Fireplace", type: "Fixture" },
  ],
  Garage: [
    { name: "Garage Door Opener", type: "Appliance" },
    { name: "GFCI Outlets", type: "Electrical" },
    { name: "Workbench", type: "Fixture" },
  ],
  Other: [
    { name: "Smoke Detector", type: "Safety" },
  ],
};
