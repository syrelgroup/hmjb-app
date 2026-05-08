import { Router } from "express";
import * as AbsenceReportRepo from "./repositories.js";

const router = Router();

router.get("/", AbsenceReportRepo.GET);
router.delete("/", AbsenceReportRepo.DELETE);

export default router;
