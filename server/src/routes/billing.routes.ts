import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requirePermission } from "../middleware/auth.js";
import { PERMISSIONS } from "../constants.js";
import { createCheckoutSchema } from "../schemas/billing.schema.js";
import { checkout, portal, subscription } from "../controllers/billing.controller.js";

const router = Router();
router.post(
  "/checkout",
  requirePermission(PERMISSIONS.BILLING_MANAGE),
  validate(createCheckoutSchema),
  checkout,
);
router.post("/portal", requirePermission(PERMISSIONS.BILLING_MANAGE), portal);
router.get("/subscription", requirePermission(PERMISSIONS.BILLING_MANAGE), subscription);
export default router;
