// dwellwell-api/src/routes/rooms/tasks.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";

export default async function tasks(req: Request, res: Response) {
  try {
    const roomId = req.params.roomId;
    if (!roomId) {
      return res.status(400).json({ error: "MISSING_ROOM_ID", message: "Param ':roomId' is required." });
    }

    const data = await prisma.userTask.findMany({
      where: { roomId },
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    return res.json(data);
  } catch (err: any) {
    console.error("[rooms:tasks] error", err);
    return res.status(500).json({ error: "ROOM_TASKS_FAILED", message: "Failed to load room tasks" });
  }
}
