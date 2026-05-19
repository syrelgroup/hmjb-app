import { Router } from "express";
import * as DeductionRoute from "./repositories.js";

const router = Router();

router.get("/", DeductionRoute.GET);
router.post("/", DeductionRoute.POST);
router.put("/", DeductionRoute.PUT);
router.delete("/", DeductionRoute.DELETE);

export default router;
