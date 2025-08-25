import { Router } from "express";
import listHomes from "./list";
import createHome from "./create";
import updateHome from "./update";
import removeHome from "./remove";
import uploadImage from "./upload-image";
import summary from "./summary";
import enrich from "./enrich";

const router = Router();

router.use("/", listHomes);
router.use("/", createHome);
router.use("/", updateHome);
router.use("/", removeHome);
router.use("/", uploadImage);
router.use("/", summary);
router.use("/", enrich);

export default router;
