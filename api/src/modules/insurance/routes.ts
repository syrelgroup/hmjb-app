import { Router } from "express";
import * as insuranceRepo from "./repositories.js";

const router = Router();

router.get("/", insuranceRepo.GET);
router.post("/", insuranceRepo.POST);
router.put("/", insuranceRepo.PUT);
router.delete("/", insuranceRepo.DELETE);

export default router;
