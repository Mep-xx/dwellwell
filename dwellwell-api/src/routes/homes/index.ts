// dwellwell-api/src/routes/homes/index.ts
import { Router } from "express";
import listHomes from "./list";
import createHome from "./create";
// import updateHome from "./update"; // ⛔️ DO NOT mount this; PATCH handles updates
import patchHome from "./patch";
import removeHome from "./remove";
import uploadImage from "./upload-image";
import summary from "./summary";
import getOne from "./get-one";
import enrich from "./enrich";
import reorder from "./reorder";
import applyStyleDefaults from "./apply-style-defaults";

const router = Router();

// Order is now irrelevant since we don't have PUT /:id,
// but keeping static-ish routes first is nice hygiene.
router.use("/", reorder);             // PUT /homes/reorder
router.use("/", listHomes);           // GET /homes
router.use("/", createHome);          // POST /homes
router.use("/", patchHome);           // PATCH /homes/:id
router.use("/", removeHome);          // DELETE /homes/:id
router.use("/", uploadImage);         // POST /homes/:id/image
router.use("/", summary);             // GET /homes/:id/summary
router.use("/", getOne);              // GET /homes/:id
router.use("/", enrich);              // POST /homes/:id/enrich
router.use("/", applyStyleDefaults);  // POST /homes/:id/apply-style-defaults

export default router;
