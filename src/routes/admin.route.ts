import express from "express";
import {
  CategoriesController,
  CompetenciesController,
  BehaviorsController,
} from "../controller/competent";
import AssessmentController from "../controller/assessmentcompetent.controller";
import KpiController from "../controller/kpi.controller";
import { ChoiceSetupController } from "../controller/choice-setup/chioiceSetup.controller";
import { SetupFuncunitController } from "../controller/slot-setup-funcunit/setupFuncunit.controller";
import { HeaderSettingController } from "../controller/header-setting/headerSetting.controller";
import { HeaderTypeController } from "../controller/header-type/headerType.controller";
import { KpiSetUpController } from "../controller/kpi/kpiIndicatorsSetup.controller";
import { KpiScoreLevelsController } from "../controller/kpi/kpiScoreLevels.controler";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
const router = express.Router();

// const apiLogger = require("../middleware/apiLogger");
// const {
//   authenticateToken,
//   authorizeRole,
// } = require("../middleware/authMiddleware");

router.use(authenticateToken, authorizeRole(2));

// --- choice setup conpotency --- //
router.get("/choice-setup", ChoiceSetupController.getListChoiceSetup);

// --- Competency master data ---
router.get("/categories", CategoriesController.getAllCategories); // ดูหมวดหมู่ categories ทั้งหมด
router.get("/categories/:id", CategoriesController.getCategoryById); // ดูหมวดหมู่ categories รายการเดียว
router.post("/categories", CategoriesController.createCategory); // เพิ่มหมวดหมู่ categories (รองรับ dataArray)
router.put("/categories/:id", CategoriesController.updateCategory); // แก้ไขหมวดหมู่ categories
router.delete("/categories/:id", CategoriesController.deleteCategory); // ลบหมวดหมู่ categories

//----------------------------------------------------------------------------------------------------------------
// router.get("/categories/full", CategoriesController.getCategoriesFull); // ดูหมวดหมู่พร้อม Competency และพฤติกรรม
//----------------------------------------------------------------------------------------------------------------

router.get("/competencies", CompetenciesController.getCompetent); // ดู Competency ทั้งหมด
router.get("/competencies/:id", CompetenciesController.getCompetentById); // ดู Competency รายการเดียว
router.post("/competencies", CompetenciesController.createCompetent); // เพิ่ม Competency (รองรับ dataArray)
router.put("/competencies/:id", CompetenciesController.updateCompetent); // แก้ไข Competency
router.delete("/competencies/:id", CompetenciesController.deleteCompetent); // ลบ Competency

router.get("/behaviors", BehaviorsController.getBehavior); // ดูพฤติกรรมประกอบ Competency ทั้งหมด
router.get("/behaviors/:id", BehaviorsController.getBehaviorById); // ดูพฤติกรรมประกอบ Competency รายการเดียว
router.post("/behaviors", BehaviorsController.createBehavior); // เพิ่มพฤติกรรม (รองรับ dataArray)
router.put("/behaviors/:id", BehaviorsController.updateBehavior); // แก้ไขพฤติกรรม
router.delete("/behaviors/:id", BehaviorsController.deleteBehavior); // ลบพฤติกรรม

// --- Assessment order management ---
router.get("/assessments", AssessmentController.getAllOrders); // ดูรอบการประเมินทั้งหมด (filter ได้)
router.get("/assessments/:id", AssessmentController.getOrderById); // ดูรอบการประเมินรายการเดียว
router.post("/assessments", AssessmentController.createOrder); // สร้างรอบการประเมิน
router.put("/assessments/:id", AssessmentController.updateOrder); // แก้ไขรอบการประเมิน
router.delete("/assessments/:id", AssessmentController.deleteOrder); // ลบรอบการประเมินและข้อมูลคะแนน

// --- KPI Indicator Setup (by nes) ---
router.get("/kpi-indicators", KpiSetUpController.index);
router.post("/kpi-indicators", KpiSetUpController.create);
router.get("/kpi-indicators/:id", KpiSetUpController.show);
router.put("/kpi-indicators/:id", KpiSetUpController.update);
router.delete("/kpi-indicators/:id", KpiSetUpController.delete);

// router.get("/kpi-setup", KpiSetUpController.index);
// router.post("/kpi-setup", KpiSetUpController.create);
// router.get("/kpi-setup/:id", KpiSetUpController.show);
// router.put("/kpi-setup/:id", KpiSetUpController.update);
// router.delete("/kpi-setup/:id", KpiSetUpController.delete);

// --- KPI Score Levels Setup (by nes) ---
router.get("/kpi-score-levels", KpiScoreLevelsController.index);
router.get("/kpi-score-levels/get-kpi", KpiScoreLevelsController.getKpi);
router.post("/kpi-score-levels", KpiScoreLevelsController.create);
router.get(
  "/kpi-score-levels/by-indicator/:indicatorId",
  KpiScoreLevelsController.getByIndicator,
);
router.get("/kpi-score-levels/:id", KpiScoreLevelsController.show);
router.put("/kpi-score-levels/:id", KpiScoreLevelsController.update);
router.delete("/kpi-score-levels/:id", KpiScoreLevelsController.delete);

// --- KPI master data (Legacy / fallback) ---
router.get("/kpis", KpiController.getIndicators); // ดู KPI ทั้งหมด
router.get("/kpis/:id", KpiController.getIndicatorById); // ดู KPI รายการเดียว
router.post("/kpis", KpiController.createIndicator); // เพิ่ม KPI (รองรับ dataArray)
router.put("/kpis/:id", KpiController.updateIndicator); // แก้ไข KPI
router.delete("/kpis/:id", KpiController.deleteIndicator); // ลบ KPI

router.get("/kpi-levels", KpiController.getScoreLevels); // ดูระดับคะแนน KPI ทั้งหมด
router.post("/kpi-levels", KpiController.createScoreLevels); // เพิ่มระดับคะแนน KPI (รองรับ dataArray)
router.get("/kpi-levels/:id", KpiController.getScoreLevelById); // ดูระดับคะแนน KPI รายการเดียว
router.put("/kpi-levels/:id", KpiController.updateScoreLevel); // แก้ไขระดับคะแนน KPI
router.delete("/kpi-levels/:id", KpiController.deleteScoreLevel); // ลบระดับคะแนน KPI

router.get("/kpi-assessments", KpiController.getAssessmentValues); // ดูผลประเมิน KPI (filter: value_order_id, kpi_indicator_id, status)
router.get("/kpi-assessments/:id", KpiController.getAssessmentValueById); // ดูผลประเมิน KPI รายการเดียว
router.post("/kpi-assessments", KpiController.createAssessmentValues); // สร้างผลประเมิน KPI (รองรับ dataArray)
router.put("/kpi-assessments/:id", KpiController.updateAssessmentValue); // แก้ไขผลประเมิน KPI โดยผู้ดูแล
router.delete("/kpi-assessments/:id", KpiController.deleteAssessmentValue); // ลบผลประเมิน KPI

// router.use(authenticateToken, apiLogger, authorizeRole(1));

// router.get("/mapAll", AllChoiceController.mapAll);

// slot setup funcunit person
router.get(
  "/person-in-dbcentralusers",
  SetupFuncunitController.personInDBCentralusers,
);

router.post("/get-person-by-userid", SetupFuncunitController.getPersonByUserID);
router.post(
  "/create-edit-setup-person-funcunit",
  SetupFuncunitController.createOrEditSetUpPersonFuncunit,
);

// --- Header Settings Setup (by nes) ---
router.get("/header-settings", HeaderSettingController.index);
router.post("/header-settings", HeaderSettingController.create);
router.get("/header-settings/:id", HeaderSettingController.show);
router.put("/header-settings/:id", HeaderSettingController.update);
router.delete("/header-settings/:id", HeaderSettingController.delete);
router.get(
  "/header-settings/by-funcunit/:funcunitid",
  HeaderSettingController.getByFuncunit,
);
router.get(
  "/header-settings/by-user/:userid",
  HeaderSettingController.getByUser,
);

// --- Header Types Setup (by nes) ---
router.get("/header-types", HeaderTypeController.index);
router.get("/header-types/active", HeaderTypeController.getActive);
router.post("/header-types", HeaderTypeController.create);
router.get("/header-types/:id", HeaderTypeController.show);
router.put("/header-types/:id", HeaderTypeController.update);
router.delete("/header-types/:id", HeaderTypeController.delete);

export default router;
