// src/routes/homes/index.ts
import { Router } from "express";
import listHomes from "./list";
import createHome from "./create";
import updateHome from "./update";
import removeHome from "./remove";
import uploadImage from "./upload-image";
import summary from "./summary";
import getOne from "./get-one";
import enrich from "./enrich";

const router = Router();

router.use("/", listHomes);
router.use("/", createHome);
router.use("/", summary);
router.use("/", uploadImage);
router.use("/", enrich);
router.use("/", getOne);
router.use("/", updateHome);
router.use("/", removeHome);

export default router;
