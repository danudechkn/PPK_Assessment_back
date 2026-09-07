import express from "express";
import CompetentController from "../controller/competent.controller";
import AssessmentController from "../controller/assessmentcompetent.controller";
import KpiController from "../controller/kpi.controller";
const router = express.Router();
// const apiLogger = require("../middleware/apiLogger");
// const {
//   authenticateToken,
//   authorizeRole,
// } = require("../middleware/authMiddleware");

// --- Competency master data ---
router.get("/categories", CompetentController.getAllCategories); // ดูหมวดหมู่ categories ทั้งหมด
// router.get("/categories/:categoryId/competencies", CompetentController.getCompetenciesByCategory); // ดู categories ของหมวดหมู่
router.post("/categories", CompetentController.createCategory); // เพิ่มหมวดหมู่ categories (รองรับ dataArray)
router.put("/categories/:id", CompetentController.updateCategory); // แก้ไขหมวดหมู่ categories
router.delete("/categories/:id", CompetentController.deleteCategory); // ลบหมวดหมู่ categories

//----------------------------------------------------------------------------------------------------------------
// router.get("/categories/full", CompetentController.getCategoriesFull); // ดูหมวดหมู่พร้อม Competency และพฤติกรรม
//----------------------------------------------------------------------------------------------------------------

router.get("/competencies", CompetentController.getCompetent); // ดู Competency ทั้งหมด
router.post("/competencies", CompetentController.createCompetent); // เพิ่ม Competency (รองรับ dataArray)
router.put("/competencies/:id", CompetentController.updateCompetent); // แก้ไข Competency
router.delete("/competencies/:id", CompetentController.deleteCompetent); // ลบ Competency

router.get("/behaviors", CompetentController.getBehavior); // ดูพฤติกรรมประกอบ Competency ทั้งหมด
// router.get("/competencies/:competencyId/behaviors", CompetentController.getBehaviorsByCompetency); // ดูพฤติกรรมของ Competency
// router.get("/behaviors/:id", CompetentController.getBehaviorById); // ดูพฤติกรรมรายการเดียว
router.post("/behaviors", CompetentController.createBehavior); // เพิ่มพฤติกรรม (รองรับ dataArray)
router.put("/behaviors/:id", CompetentController.updateBehavior); // แก้ไขพฤติกรรม
router.delete("/behaviors/:id", CompetentController.deleteBehavior); // ลบพฤติกรรม

// --- Assessment order management ---
router.get("/assessments", AssessmentController.getAllOrders); // ดูรอบการประเมินทั้งหมด (filter ได้)
router.post("/assessments", AssessmentController.createOrder); // สร้างรอบการประเมิน
router.put("/assessments/:id", AssessmentController.updateOrder); // แก้ไขรอบการประเมิน
router.delete("/assessments/:id", AssessmentController.deleteOrder); // ลบรอบการประเมินและข้อมูลคะแนน

// --- KPI master data ---
router.get("/kpis", KpiController.getIndicators); // ดู KPI ทั้งหมด
router.get("/kpis/:id", KpiController.getIndicatorById); // ดู KPI รายการเดียว
router.post("/kpis", KpiController.createIndicator); // เพิ่ม KPI (รองรับ dataArray)
router.put("/kpis/:id", KpiController.updateIndicator); // แก้ไข KPI
router.delete("/kpis/:id", KpiController.deleteIndicator); // ลบ KPI

router.get("/kpi-levels", KpiController.getScoreLevels); // ดูระดับคะแนน KPI ทั้งหมด
router.post("/kpi-levels", KpiController.createScoreLevels); // เพิ่มระดับคะแนน KPI (รองรับ dataArray)
// router.get("/kpi-levels/:id", KpiController.getScoreLevelById); // ดูระดับคะแนน KPI รายการเดียว
router.put("/kpi-levels/:id", KpiController.updateScoreLevel); // แก้ไขระดับคะแนน KPI
router.delete("/kpi-levels/:id", KpiController.deleteScoreLevel); // ลบระดับคะแนน KPI

router.get("/kpi-assessments", KpiController.getAssessmentValues); // ดูผลประเมิน KPI (filter: value_order_id, kpi_indicator_id, status)
router.get("/kpi-assessments/:id", KpiController.getAssessmentValueById); // ดูผลประเมิน KPI รายการเดียว
router.post("/kpi-assessments", KpiController.createAssessmentValues); // สร้างผลประเมิน KPI (รองรับ dataArray)
router.put("/kpi-assessments/:id", KpiController.updateAssessmentValue); // แก้ไขผลประเมิน KPI โดยผู้ดูแล
router.delete("/kpi-assessments/:id", KpiController.deleteAssessmentValue); // ลบผลประเมิน KPI


// router.use(authenticateToken, apiLogger, authorizeRole(1));

// router.get("/mapAll", AllChoiceController.mapAll);

export default router;
