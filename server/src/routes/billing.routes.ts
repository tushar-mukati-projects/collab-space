import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createCheckoutSchema } from "../schemas/billing.schema.js";
import { checkout, portal, subscription } from "../controllers/billing.controller.js";

const router = Router();

router.post("/checkout", validate(createCheckoutSchema), checkout);
router.post("/portal", portal);
router.get("/subscription", subscription);

export default router;
