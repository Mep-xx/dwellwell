import { Router, Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import OpenAI from "openai";

// NOTE: This route is optional; if you aren't using "web" identification,
// you can delete this file and its mount entirely. If you keep it,
// this version uses global fetch (Node 18+), no axios dependency.

const router = Router();

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

router.get(
  "/identify-product-web",
  asyncHandler(async (req: Request, res: Response) => {
    if (!OPENAI_API_KEY) {
      return res.status(501).json({ error: "OPENAI_API_KEY not configured" });
    }

    const q = (req.query.q as string) || "";
    if (!q.trim()) return res.status(400).json({ error: "Missing q" });

    // Example: call OpenAI with q (no browsing). If you had a remote fetch
    // to your own service, you could use `await fetch(url, { method, headers, body })`.
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You normalize consumer product names (brand + model). No web browsing.",
        },
        { role: "user", content: `Identify: ${q}` },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    res.json({ output: content });
  })
);

export default router;
