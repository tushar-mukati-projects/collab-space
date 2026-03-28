import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { editorUpload } from "../controllers/attachments.controller.js";

const router = Router();
router.post("/", upload.single("file"), editorUpload);
export default router;
