import { Router } from "express";
import * as PermitAbsenceRepo from "./repositories.js";

const router = Router();

router.get("/", PermitAbsenceRepo.GET);
router.post("/", PermitAbsenceRepo.POST);
router.put("/", PermitAbsenceRepo.PUT);
router.delete("/", PermitAbsenceRepo.DELETE);

export default router;
