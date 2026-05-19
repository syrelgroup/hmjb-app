import { Router } from "express";
import * as BillingRoute from "./repositories.js";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.get("/", BillingRoute.GET);
router.post("/", upload.single("file"), BillingRoute.POST);
router.put("/:id", BillingRoute.PUT);
router.put("/", BillingRoute.PUT);
router.delete("/", BillingRoute.DELETE);

export default router;
