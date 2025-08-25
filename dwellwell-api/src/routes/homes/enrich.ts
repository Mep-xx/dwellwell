// dwellwell-api/src/routes/homes/enrich.ts
import { Router } from "express";

// If you have auth, uncomment the next line and apply to the route:
// import { requireAuth } from "../../middlewares/auth";

const router = Router();

/**
 * POST /homes/:id/enrich
 * Returns partial fields to prefill the client’s AddHomeWizard.
 * Start with a stub for working UX; later, plug in your AI logic where marked.
 */
router.post("/homes/:id/enrich", /* requireAuth, */ async (req, res) => {
  try {
    const { id } = req.params;

    // TODO (recommended): load the home from your DB using `id`
    // Example (Prisma): const home = await prisma.home.findUnique({ where: { id } });
    // If not found, return 404. For now we'll assume it exists.

    // ----- STUB OUTPUT (works today) -----
    // Give the wizard good-looking defaults so the UX feels "enhanced".
    // You can tweak heuristics based on address/state if you like.
    const stub = {
      nickname: "My Home",
      yearBuilt: 1998,
      squareFeet: 2200,
      lotSize: 0.25,
      architecturalStyle: "Colonial",
      rooms: [
        { type: "Bedroom" },
        { type: "Bedroom" },
        { type: "Bathroom" },
        { type: "Kitchen" },
        { type: "Living Room" },
      ],
      hasCentralAir: true,
      hasBaseboard: false,
      boilerType: "Gas-Fired",
      roofType: "Asphalt Shingle",
      sidingType: "Vinyl",
      features: ["Fireplace", "Deck", "Attached Garage"],
      apartment: "",
    };

    // ----- REAL AI (optional; add later) -----
    // If you want to power this with an LLM, replace `stub` with your AI result.
    // Pseudocode outline:
    //
    // const detailsForModel = {
    //   address: home.address,
    //   city: home.city,
    //   state: home.state,
    //   zip: home.zip,
    // };
    //
    // const result = await callYourAI(detailsForModel); // Returns the same shape as `stub`
    // const enriched = validateAndClamp(result);        // Ensure numbers/ranges sane
    //
    // return res.json(enriched);

    return res.json(stub);
  } catch (err: any) {
    console.error("[enrich] failed:", err);
    return res
      .status(500)
      .json({ message: "Enhanced lookup is unavailable. You can continue manually." });
  }
});

export default router;
