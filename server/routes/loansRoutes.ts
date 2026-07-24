import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { createLoanHandler, returnLoanHandler } from "../handlers/loansHandlers";

const router = Router();

router.post("/loans", authMiddleware, createLoanHandler);
router.patch("/loans/:id/return", authMiddleware, returnLoanHandler);

export default router;
