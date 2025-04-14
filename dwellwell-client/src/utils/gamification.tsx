// src/utils/gamification.tsx

import confetti from 'canvas-confetti';

/**
 * Triggers a celebration animation, like when completing a task group.
 */
export function launchConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

/**
 * Calculates XP earned from completing a task.
 * You can later expand this to support streaks, multipliers, etc.
 */
export function calculateXp(taskDifficulty: 'easy' | 'medium' | 'hard'): number {
  switch (taskDifficulty) {
    case 'easy':
      return 10;
    case 'medium':
      return 25;
    case 'hard':
      return 50;
    default:
      return 0;
  }
}

/**
 * Stub for future achievement unlocking system.
 */
export function checkForAchievements(completedTaskCount: number): string[] {
  const unlocked: string[] = [];
  if (completedTaskCount === 1) unlocked.push('First Task Done!');
  if (completedTaskCount === 10) unlocked.push('10 Tasks - On a Roll!');
  if (completedTaskCount === 50) unlocked.push('Certified Home Hero');
  return unlocked;
}
