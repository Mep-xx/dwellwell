// dwellwell-api/src/routes/rooms/list.ts
import { Request, Response } from "express";
import { prisma } from "../../db/prisma";

export default async function list(req: Request, res: Response) {
  try {
    const homeId = String(req.query.homeId || "").trim();
    if (!homeId) {
      return res.status(400).json({ error: "MISSING_HOME_ID", message: "Query param 'homeId' is required." });
    }

    const includeDetails = String(req.query.includeDetails || "").toLowerCase() === "true";

    const rooms = await prisma.room.findMany({
      where: { homeId },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: includeDetails ? { userTasks: true } : undefined,
    });

    return res.json(rooms);
  } catch (err: any) {
    console.error("[rooms:list] error", err);
    return res.status(500).json({ error: "ROOMS_LIST_FAILED", message: "Failed to list rooms" });
  }
}
