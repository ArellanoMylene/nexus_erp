import express from "express";
import * as departmentController from "../controllers/departmentController/dept.controller.js";

const router = express.Router();

router.get("/departments", departmentController.getDepartments);

router.post("/departments", departmentController.createDepartment);

router.get("/departments/eligible-heads", departmentController.eligibleHeads);
router.get("/departments/:id", departmentController.getDepartmentById);
router.put("/departments/:id", departmentController.updateDepartment);

router.delete("/departments/:id", departmentController.deleteDepartment);
router.get("/test", (req, res) => res.json({ message: "Route works!" }));

export default router;
