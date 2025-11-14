// dwellwell-client/src/components/ui/RotatingGreeting.tsx
import { useState } from "react";

/**
 * Time of day buckets (local to the user's browser)
 */
function getTimeOfDay(d: Date) {
  const h = d.getHours();
  if (h < 5) return "lateNight" as const; // 12a–4:59a
  if (h < 12) return "morning" as const; // 5a–11:59a
  if (h < 17) return "afternoon" as const; // 12p–4:59p
  return "evening" as const; // 5p–11:59p
}

/**
 * Northern hemisphere seasons by month.
 */
function getSeason(d: Date) {
  const m = d.getMonth(); // 0=Jan
  if (m === 11 || m <= 1) return "winter" as const; // Dec–Feb
  if (m <= 4) return "spring" as const; // Mar–May
  if (m <= 7) return "summer" as const; // Jun–Aug
  return "fall" as const; // Sep–Nov
}

/**
 * Optional: light date-specific “mini-events”
 */
function getDateBoosts(d: Date): string[] {
  const m = d.getMonth() + 1; // 1..12
  const day = d.getDate();

  if (m === 1 && day <= 7)
    return ["Happy New Year! Let’s start the year on the right foot."];
  if (m === 4 && day <= 30)
    return ["Spring cleaning vibes — small wins add up!"];
  if (m === 7 && day <= 7)
    return ["Hope your summer’s off to a great start!"];
  if (m === 9 && day <= 15)
    return ["Back-to-routine season — let’s tidy up the to-dos."];
  if (m === 11 && day >= 20 && day <= 30)
    return ["Grateful for a well-kept home. 🧡"];
  if (m === 12 && day >= 1 && day <= 31)
    return ["Holiday prep made easier with a few quick tasks."];

  return [];
}

/**
 * Base pools
 */
const GENERAL: string[] = [
  "Welcome back! Here’s what’s coming up.",
  "Nice to see you again — ready to tackle some tasks?",
  "Your home’s been waiting for you!",
  "Every little bit of maintenance counts.",
  "Here’s to a well-kept home and a stress-free week.",
  "Let’s make things shine today.",
  "Your future self will thank you for this.",
  "Another week, another few wins for your home.",
  "Let’s keep your home happy and healthy.",
  "You’re doing great — let’s see what’s next.",
];

const BY_TIME: Record<ReturnType<typeof getTimeOfDay>, string[]> = {
  lateNight: [
    "Burning the midnight oil? A quick win now can save headaches later.",
    "Night owl mode — knock out one small task and call it a day.",
  ],
  morning: [
    "Good morning! A tidy start sets the tone.",
    "Morning momentum — pick one easy win to kick things off.",
    "Fresh day, fresh checklist. Let’s go!",
  ],
  afternoon: [
    "Good afternoon — perfect time for a quick maintenance win.",
    "A small task now means a smoother evening later.",
    "Halfway there — let’s keep things humming.",
  ],
  evening: [
    "Evening check-in — one quick task, then relax.",
    "Wind down with a tiny to-do and a big sigh of relief.",
    "A little effort now means a better tomorrow.",
  ],
};

const BY_SEASON: Record<ReturnType<typeof getSeason>, string[]> = {
  winter: [
    "Cozy home, cozy vibes — let’s keep it running smoothly.",
    "Winter tune-ups now, fewer surprises later.",
    "Short days, short tasks — small steps count.",
  ],
  spring: [
    "Spring refresh — perfect time to tidy and tune.",
    "New season, fresh start — let’s spruce things up.",
    "A little spring upkeep goes a long way.",
  ],
  summer: [
    "Summer mode — quick tasks, more free time.",
    "Keep it light and easy — maintenance can be breezy.",
    "Hot tip: small tasks prevent big headaches.",
  ],
  fall: [
    "Fall prep makes winter easier — future-you approves.",
    "Crisp air, crisp checklist — let’s tidy up.",
    "Autumn tune-ups now keep things cozy later.",
  ],
};

type Props = {
  /** Optional: user’s first name for subtle personalization */
  name?: string;
  /** Optional: add/override extra messages to include in the pool */
  extraMessages?: string[];
};

function buildGreeting(name?: string, extraMessages: string[] = []): string {
  const now = new Date();
  const tod = getTimeOfDay(now);
  const season = getSeason(now);
  const boosts = getDateBoosts(now);

  const baseCandidates = [
    ...GENERAL,
    ...BY_TIME[tod],
    ...BY_SEASON[season],
    ...boosts,
    ...extraMessages,
  ];

  const candidates = Array.from(new Set(baseCandidates));

  if (name) {
    candidates.push(`Welcome back, ${name}. Let’s line up a quick win.`);
    candidates.push(`${name}, small steps = big home wins. Let’s begin.`);
  }

  if (!candidates.length) return "";
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

export default function RotatingGreeting({ name, extraMessages = [] }: Props) {
  // Pick once when this component mounts on this page load
  const [message] = useState<string>(() => buildGreeting(name, extraMessages));

  return <p className="mt-1 text-sm text-muted">{message}</p>;
}
