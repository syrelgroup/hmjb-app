import { Router } from "express";
import * as payOfficeRepo from "./repositories.js";
const router = Router();
router.get("/", payOfficeRepo.GET);
router.post("/", payOfficeRepo.POST);
router.put("/", payOfficeRepo.PUT);
router.delete("/", payOfficeRepo.DELETE);
export default router;
