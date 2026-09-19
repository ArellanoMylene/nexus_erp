import express from "express";
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getStatistics,
} from "../controllers/scholarshipBeneficiaries.controller.js";

const router = express.Router();

router.get("/", getAllBeneficiaries);
router.get("/statistics", getStatistics);
router.get("/:id", getBeneficiaryById);
router.post("/", createBeneficiary);
router.put("/:id", updateBeneficiary);
router.delete("/:id", deleteBeneficiary);

export default router;
