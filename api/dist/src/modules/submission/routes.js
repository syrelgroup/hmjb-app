import { Router } from "express";
import * as submissionRepo from "./repositories.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
// Export, Import, and Template routes must be before wildcard routes
router.get("/export", submissionRepo.EXPORT);
router.get("/template", submissionRepo.TEMPLATE);
router.post("/import", upload.single("file"), submissionRepo.IMPORT);
// CRUD routes
router.get("/", submissionRepo.GET);
router.post("/", submissionRepo.POST);
router.put("/", submissionRepo.PUT);
router.delete("/", submissionRepo.DELETE);
router.patch("/", submissionRepo.PATCH);
export default router;
