import { Router } from "express";
import * as submissionRepo from "./repositories.js";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.get("/", submissionRepo.GET);
router.post("/", submissionRepo.POST);
router.put("/", submissionRepo.PUT);
router.delete("/", submissionRepo.DELETE);
router.patch("/", submissionRepo.PATCH);
router.post("/import", upload.single("file"), submissionRepo.IMPORT);

export default router;
