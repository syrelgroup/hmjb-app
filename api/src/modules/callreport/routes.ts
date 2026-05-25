import { Router, type Request, type Response } from "express";
import { DashboardCallreport, LaporanCallreport } from "../route.js";

const router = Router();

router.get("/", DashboardCallreport);
router.get("/laporan", LaporanCallreport);

export default router;
