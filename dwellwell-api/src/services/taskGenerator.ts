/**
 * Build-safe no-op implementations.
 * Your Prisma schema for TaskTemplate/UserTask doesn't match the assumptions
 * from the earlier draft (enabled, cadenceMonths, auto, etc.). Rather than
 * guessing and breaking builds, these stubs keep the app compiling/running.
 *
 * When you're ready to wire up real generation, we can map to YOUR actual fields
 * (e.g., Template.state, Template.description, UserTask.sourceType/status/etc.).
 */

export async function generateTasksForRoom(_roomId: string) {
  // TODO: implement against your real Prisma schema
  return;
}

export async function generateTasksForHomeFeatures(_homeId: string) {
  // TODO: implement against your real Prisma schema
  return;
}
