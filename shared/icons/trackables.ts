// shared/icons/trackables.ts

// Emoji fallbacks (still used if no placeholder image is available)
export const TRACKABLE_TYPE_ICONS: Record<string, string> = {
  // Appliances
  dishwasher: "🍽️",
  refrigerator: "🧊",
  "range-oven": "🍳",
  microwave: "🧲",
  washer: "🧺",
  dryer: "🌀",
  "water-heater": "🔥",
  "water-softener": "🧂",
  dehumidifier: "💧",

  // Kitchen
  "sink-faucet": "🚰",
  "garbage-disposal": "♻️",
  "range-hood": "🌀",
  countertop: "🧱",
  cabinetry: "🗄️",

  // Bathroom
  toilet: "🚽",
  "shower-tub": "🛁",
  "bath-faucet": "🚰",
  "exhaust-fan": "🌀",
  vanity: "🪞",

  // Heating
  furnace: "🔥",
  boiler: "🔥",
  "space-heater": "🔥",
  "radiant-heat": "🌡️",
  fireplace: "🔥",

  // Cooling
  "central-ac": "❄️",
  "heat-pump": "♻️",
  "mini-split": "❄️",
  "window-ac": "🪟",
  "portable-ac": "❄️",
  humidifier: "💧",
  "air-purifier": "🌀",

  // Plumbing
  "main-shutoff": "🚰",
  "sump-pump": "🕳️",
  "well-pump": "⛲",
  septic: "🚽",
  "water-filter": "🚰",

  // Electrical
  panel: "⚡",
  generator: "🔌",
  "smoke-co": "🧯",
  "outlets-switches": "🔌",
  doorbell: "🔔",
  thermostat: "🌡️",
  "ceiling-fan": "🌀",

  // Outdoor
  "lawn-mower": "🚜",
  "sprinkler-system": "🌿",
  grill: "🍖",
  "deck-patio": "🪵",
  "fence-gate": "🚧",
  "snow-blower": "❄️",
  "pressure-washer": "💦",

  // Safety
  "fire-extinguisher": "🧯",
  "alarm-system": "🔔",
  "radon-system": "🧪",

  // General
  tool: "🧰",
  window: "🪟",
  door: "🚪",
  flooring: "🪵",
  paint: "🎨",
  other: "📦",

  // Electronics / Computing / Entertainment
  television: "📺",
  projector: "📽️",
  soundbar: "🔊",
  "av-receiver": "🎛️",
  "game-console": "🎮",
  "streaming-device": "📦",
  laptop: "💻",
  desktop: "🖥️",
  tablet: "📱",
  printer: "🖨️",
  nas: "🗄️",
  ups: "🔋",
  router: "📶",
  modem: "🔌",
  camera: "📷",
  "smart-speaker": "🔈",
  "smart-display": "🖼️",
};

// Placeholder images you can generate and store in /public/trackables/.
// Recommended size: 256×256 PNG, simple monochrome glyph on light background.
// Card thumbnail is 64×64 (w-16 h-16), so 256 gives you crisp downscaling.
export const TRACKABLE_TYPE_IMAGES: Record<string, string> = {
  dishwasher: "/trackables/dishwasher.png",
  refrigerator: "/trackables/refrigerator.png",
  "range-oven": "/trackables/range-oven.png",
  microwave: "/trackables/microwave.png",
  washer: "/trackables/washer.png",
  dryer: "/trackables/dryer.png",
  "water-heater": "/trackables/water-heater.png",
  "water-softener": "/trackables/water-softener.png",
  dehumidifier: "/trackables/dehumidifier.png",
  humidifier: "/trackables/humidifier.png",
  "air-purifier": "/trackables/air-purifier.png",
  "garbage-disposal": "/trackables/garbage-disposal.png",
  "range-hood": "/trackables/range-hood.png",

  // HVAC & Cooling
  furnace: "/trackables/furnace.png",
  boiler: "/trackables/boiler.png",
  "central-ac": "/trackables/central-ac.png",
  "heat-pump": "/trackables/heat-pump.png",
  "mini-split": "/trackables/mini-split.png",
  "window-ac": "/trackables/window-ac.png",
  "portable-ac": "/trackables/portable-ac.png",
  "radiant-heat": "/trackables/radiant-heat.png",
  thermostat: "/trackables/thermostat.png",

  // Plumbing
  "main-shutoff": "/trackables/main-shutoff.png",
  "sump-pump": "/trackables/sump-pump.png",
  "well-pump": "/trackables/well-pump.png",
  septic: "/trackables/septic.png",
  "water-filter": "/trackables/water-filter.png",

  // Electrical
  panel: "/trackables/panel.png",
  generator: "/trackables/generator.png",
  "smoke-co": "/trackables/smoke-co.png",
  "outlets-switches": "/trackables/outlets-switches.png",
  doorbell: "/trackables/doorbell.png",
  "ceiling-fan": "/trackables/ceiling-fan.png",

  // Outdoor
  "lawn-mower": "/trackables/lawn-mower.png",
  "sprinkler-system": "/trackables/sprinkler-system.png",
  grill: "/trackables/grill.png",
  "deck-patio": "/trackables/deck-patio.png",
  "fence-gate": "/trackables/fence-gate.png",
  "snow-blower": "/trackables/snow-blower.png",
  "pressure-washer": "/trackables/pressure-washer.png",

  // General + Furniture + Lighting + Cleaning
  tool: "/trackables/tool.png",
  window: "/trackables/window.png",
  door: "/trackables/door.png",
  flooring: "/trackables/flooring.png",
  paint: "/trackables/paint.png",
  other: "/trackables/other.png",
  desk: "/trackables/desk.png",
  chair: "/trackables/chair.png",
  sofa: "/trackables/sofa.png",
  bed: "/trackables/bed.png",
  shelving: "/trackables/shelving.png",
  "light-fixture": "/trackables/light-fixture.png",
  "smart-bulb": "/trackables/smart-bulb.png",
  lamp: "/trackables/lamp.png",
  vacuum: "/trackables/vacuum.png",
  "robot-vacuum": "/trackables/robot-vacuum.png",
  "steam-cleaner": "/trackables/steam-cleaner.png",
  "carpet-cleaner": "/trackables/carpet-cleaner.png",

  // Electronics / Computing / Entertainment
  television: "/trackables/television.png",
  projector: "/trackables/projector.png",
  soundbar: "/trackables/soundbar.png",
  "av-receiver": "/trackables/av-receiver.png",
  "game-console": "/trackables/game-console.png",
  "streaming-device": "/trackables/streaming-device.png",
  laptop: "/trackables/laptop.png",
  desktop: "/trackables/desktop.png",
  tablet: "/trackables/tablet.png",
  printer: "/trackables/printer.png",
  nas: "/trackables/nas.png",
  ups: "/trackables/ups.png",
  router: "/trackables/router.png",
  modem: "/trackables/modem.png",
  camera: "/trackables/camera.png",
  "smart-speaker": "/trackables/smart-speaker.png",
  "smart-display": "/trackables/smart-display.png",
};
