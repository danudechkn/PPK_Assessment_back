import { Router } from "express";
import KpiController from "../controller/kpi.controller";
import AssessmentController from "../controller/assessmentcompetent.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import CompetentController from "../controller/competent.controller";
import { GetPersonController } from "../controller/get-person/getPerson.controller";
import { KpiSetUpController } from "../controller/kpi/kpiIndicatorsSetup.controller";
import { KpiScoreLevelsController } from "../controller/kpi/kpiScoreLevels.controler";
import { SignatureController } from "../controller/signature/signature.controller";

const router = Router();

router.use(authenticateToken, authorizeRole(1, 2));

// updata by nes
router.get(
  "/conpetency-by-access",
  CompetentController.getCompetentByUserAccess,
);

router.get("/check-self-assessment", AssessmentController.checkSelfAssessment);
router.get(
  "/get-person-by-funcunit",
  GetPersonController.headGetPersonByFuncUnit,
);

//

router.get("/competency-scores/:id", AssessmentController.getScoreById);
router.get("/kpi-levels/:id", KpiController.getScoreLevelById);

// const apiLogger = require("../middleware/apiLogger");

// --- Assessment actions for the current user / evaluator ---
router.get("/assessments", AssessmentController.getAllOrders);

router.get(
  "/assessments/:orderId/summary",
  AssessmentController.getAssessmentSummary,
); // ดูข้อมูลสรุป Competency และ KPI ของรอบประเมิน

router.get(
  "/assessments/:orderId/sheet",
  AssessmentController.getAssessmentSheet,
); // ดูแบบประเมินพร้อมคะแนน
router.post("/competency-scores", AssessmentController.saveScores); // บันทึกคะแนนผู้ประเมินหรือหัวหน้างาน
router.put("/competency-scores/:id", AssessmentController.updateScoreItem); // แก้ไขคะแนนผู้ประเมินหรือหัวหน้างาน
router.put(
  "/competency-scores/:id/submit",
  AssessmentController.submitScoreItem,
); // ยืนยันคะแนนสุดท้าย

// --- KPI assessment data ---
router.get("/kpi-indicators", KpiSetUpController.index);
router.get("/kpi-indicators/:id", KpiSetUpController.show);
router.get("/kpi-score-levels", KpiScoreLevelsController.index);
router.get("/kpi-score-levels/get-kpi", KpiScoreLevelsController.getKpi);
router.get(
  "/kpi-score-levels/by-indicator/:indicatorId",
  KpiScoreLevelsController.getByIndicator,
);
router.get("/kpi-score-levels/:id", KpiScoreLevelsController.show);

router.get("/kpi-levels", KpiController.getScoreLevels); // ดูระดับคะแนน KPI
router.get("/kpi-assessments/:orderId", KpiController.getUserAssessmentValues); // ID รอบประเมิน; ส่ง { value_order, kpi_assessments }
router.put("/kpi-assessments/:id", KpiController.updateAssessmentValueScores); // ID รายการผล KPI; บันทึก actual_value, user_value หรือ head_value
router.put("/kpi-assessments/:id/submit", KpiController.submitAssessmentValue); // ID รายการผล KPI; ยืนยันคะแนนและคำนวณคะแนนถ่วงน้ำหนัก

// signature
router.get("/signature", SignatureController.getSignatureByUserid);
router.post("/upsert-signature", SignatureController.upsertSignature);

export default router;
