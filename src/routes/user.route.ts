import { Router } from "express";
import KpiController from "../controller/kpi.controller";
import AssessmentController from "../controller/assessmentcompetent.controller";

const router = Router();

router.get("/competency-scores/:id", AssessmentController.getScoreById);
router.get("/kpi-levels/:id", KpiController.getScoreLevelById);

// const apiLogger = require("../middleware/apiLogger");
// const {
//   authenticateToken,
//   authorizeRole,
// } = require("../middleware/authMiddleware");

// --- Assessment actions for the current user / evaluator ---
router.get("/assessments/:orderId/summary", AssessmentController.getAssessmentSummary); // ดูข้อมูลสรุป Competency และ KPI ของรอบประเมิน

router.get("/assessments/:orderId/sheet", AssessmentController.getAssessmentSheet); // ดูแบบประเมินพร้อมคะแนน
router.post("/competency-scores", AssessmentController.saveScores); // บันทึกคะแนนผู้ประเมินหรือหัวหน้างาน
router.put("/competency-scores/:id", AssessmentController.updateScoreItem); // แก้ไขคะแนนผู้ประเมินหรือหัวหน้างาน
router.put("/competency-scores/:id/submit", AssessmentController.submitScoreItem); // ยืนยันคะแนนสุดท้าย

// --- KPI assessment data ---
router.get("/kpi-levels", KpiController.getScoreLevels); // ดูระดับคะแนน KPI
router.get("/kpi-assessments/:orderId", KpiController.getUserAssessmentValues); // ID รอบประเมิน; ส่ง { value_order, kpi_assessments }
router.put("/kpi-assessments/:id", KpiController.updateAssessmentValueScores); // ID รายการผล KPI; บันทึก actual_value, user_value หรือ head_value
router.put("/kpi-assessments/:id/submit", KpiController.submitAssessmentValue); // ID รายการผล KPI; ยืนยันคะแนนและคำนวณคะแนนถ่วงน้ำหนัก

export default router;
