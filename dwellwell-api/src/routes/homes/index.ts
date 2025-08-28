// src/routes/homes/index.ts
import { Router } from "express";
import listHomes from "./list";
import createHome from "./create";
import updateHome from "./update";
import patchHome from "./patch";
import removeHome from "./remove";
import uploadImage from "./upload-image";
import summary from "./summary";
import getOne from "./get-one";
import enrich from "./enrich";
import applyStyleDefaults from "./apply-style-defaults";

const router = Router();

router.use("/", listHomes);
router.use("/", createHome);
router.use("/", updateHome);
router.use("/", patchHome);
router.use("/", removeHome);
router.use("/", uploadImage);
router.use("/", summary);
router.use("/", getOne);
router.use("/", enrich);
router.use("/", applyStyleDefaults);

export default router;
