import { Router } from "express";
import listHomes from "./list";
import createHome from "./create";
import updateHome from "./update";
import removeHome from "./remove";
import uploadImage from "./upload-image";
import summary from "./summary";
import enrich from "./enrich";
import getOne from "./get-one";

const router = Router();

router.use("/", listHomes);
router.use("/", createHome);
router.use("/", uploadImage);
router.use("/", updateHome);
router.use("/", summary);
router.use("/", removeHome);
router.use("/", getOne);
router.use("/", enrich);

export default router;
