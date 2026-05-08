import { Router } from "express";
import * as IntensifRoute from "./repositories.js";

const router = Router();

router.get("/", IntensifRoute.GET);
router.post("/", IntensifRoute.POST);
router.put("/", IntensifRoute.PUT);
router.delete("/", IntensifRoute.DELETE);

export default router;
