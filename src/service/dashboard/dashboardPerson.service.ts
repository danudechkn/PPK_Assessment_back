import db from "../../models/product";
import { AssessmentHelper } from "../assessmentcompetent/helper/assessment.helper";

export class DashboardPersonService {
  /**
   * ดึงข้อมูลสรุปสำหรับการ์ด Dashboard ของตนเอง (Person Dashboard)
   * @param userid ID ของผู้ใช้งาน
   * @param reqYear ปีงบประมาณ (ระบุหรือไม่ระบุก็ได้ ถ้าไม่ระบุใช้ปีปัจจุบัน)
   * @param reqRound รอบการประเมิน (ระบุหรือไม่ระบุก็ได้)
   */
  static async getDashboardPerson(
    userid: number,
    reqYear?: number,
    reqRound?: number,
  ) {
    const { round: currentRound, year: currentYear } =
      AssessmentHelper.getCurrentRoundAndYear();
    const year = reqYear ? Number(reqYear - 543) : currentYear;
    const round = reqRound ? Number(reqRound) : currentRound;

    // 1. ค้นหาข้อมูลจาก assessment_summaries เฉพาะของ user_id ตนเองเท่านั้น
    const whereCondition: any = {
      user_id: userid,
      year: year,
    };
    if (reqRound) {
      whereCondition.round = round;
    }

    const [valueOrders, summaryRecord] = await Promise.all([
      db.ValueOrders.findAll({
        where: whereCondition,
        include: [
          {
            model: db.ValueData,
            as: "value_data_list",
          },
        ],
        order: [
          ["type_order_id", "ASC"],
          [{ model: db.ValueData, as: "value_data_list" }, "quest", "ASC"],
        ],
      }),
      db.AssessmentSummaries.findOne({
        where: whereCondition,
        order: [
          ["round", "DESC"],
          ["id", "DESC"],
        ],
        include: [
          {
            model: db.AssessmentDevelopmentPlans,
            as: "development_plans",
            required: false,
          },
          {
            model: db.AssessmentSignatures,
            as: "assessment_signatures",
            required: false,
          },
        ],
      }),
    ]);

    // Map ระดับเกรด (1 = ดีเด่น, 2 = ดีมาก, 3 = ดี, 4 = พอใช้, 5 = ต้องปรับปรุง)
    const gradeMap: Record<number, string> = {
      1: "ดีเด่น",
      2: "ดีมาก",
      3: "ดี",
      4: "พอใช้",
      5: "ต้องปรับปรุง",
    };

    // 🟢 ดึงและแปลงข้อมูลคะแนนรายข้อ (user_value และ head_value) สำหรับกราฟ "วิเคราะห์การประเมินรายข้อ"
    const itemAnalysis = (valueOrders || []).flatMap((order: any) => {
      const orderPlain = order.get ? order.get({ plain: true }) : order;
      const typeOrderId = orderPlain.type_order_id;
      const valueList = orderPlain.value_data_list || [];

      return valueList.map((item: any) => ({
        quest: item.quest,
        user_value:
          item.user_value !== null && item.user_value !== undefined
            ? Number(item.user_value)
            : null,
        head_value:
          item.head_value !== null && item.head_value !== undefined
            ? Number(item.head_value)
            : null,
        submit_value:
          item.submit_value !== null && item.submit_value !== undefined
            ? Number(item.submit_value)
            : null,
        type_order_id: typeOrderId,
      }));
    });

    const extractScores = (targetTypeId: number) => {
      const order = (valueOrders || []).find(
        (o: any) => Number(o.type_order_id) === targetTypeId,
      );
      if (!order) return [];
      const orderPlain = order.get ? order.get({ plain: true }) : order;
      return (orderPlain.value_data_list || []).map((item: any) => ({
        quest: item.quest,
        user_value:
          item.user_value !== null && item.user_value !== undefined
            ? Number(item.user_value)
            : null,
        head_value:
          item.head_value !== null && item.head_value !== undefined
            ? Number(item.head_value)
            : null,
        submit_value:
          item.submit_value !== null && item.submit_value !== undefined
            ? Number(item.submit_value)
            : null,
      }));
    };

    const kpiScores = extractScores(1);
    const competencyScores = extractScores(2);

    if (!summaryRecord) {
      return {
        success: true,
        data: {
          user_id: userid,
          year,
          round,
          has_data: false,
          total_score: 0,
          kpi_score: 0,
          kpi_weighted_score: 0,
          kpi_weight: 0,
          competency_score: 0,
          competency_weighted_score: 0,
          competency_weight: 0,
          grade_level: null,
          grade_label: "ยังไม่มีผลการประเมิน",
          evaluator_status: null,
          status: null,
          development_plans: [],
          signatures: [],
          item_analysis: itemAnalysis,
          kpi_scores: kpiScores,
          competency_scores: competencyScores,
        },
      };
    }

    const gradeLevel = summaryRecord.grade_level
      ? Number(summaryRecord.grade_level)
      : null;

    return {
      success: true,
      data: {
        id: summaryRecord.id,
        user_id: summaryRecord.user_id,
        head_id: summaryRecord.head_id,
        year: summaryRecord.year,
        round: summaryRecord.round,
        has_data: true,

        // 🟢 คะแนนเฉลี่ยรวม
        total_score:
          summaryRecord.total_score !== null
            ? Number(summaryRecord.total_score)
            : 0,

        // 🟢 คะแนนรวม KPI
        kpi_score:
          summaryRecord.kpi_score !== null
            ? Number(summaryRecord.kpi_score)
            : 0,
        kpi_weight:
          summaryRecord.kpi_weight !== null
            ? Number(summaryRecord.kpi_weight)
            : 0,
        kpi_weighted_score:
          summaryRecord.kpi_weighted_score !== null
            ? Number(summaryRecord.kpi_weighted_score)
            : 0,

        // 🟢 คะแนนรวม Competency
        competency_score:
          summaryRecord.competency_score !== null
            ? Number(summaryRecord.competency_score)
            : 0,
        competency_weight:
          summaryRecord.competency_weight !== null
            ? Number(summaryRecord.competency_weight)
            : 0,
        competency_weighted_score:
          summaryRecord.competency_weighted_score !== null
            ? Number(summaryRecord.competency_weighted_score)
            : 0,

        // 🟢 ระดับเกรด
        grade_level: gradeLevel,
        grade_label: gradeLevel ? gradeMap[gradeLevel] || "ไม่ระบุ" : "ไม่ระบุ",

        evaluator_status: summaryRecord.evaluator_status,
        status: summaryRecord.status,
        development_plans: summaryRecord.development_plans || [],
        assessment_signatures: summaryRecord.assessment_signatures || [],
        signatures: summaryRecord.assessment_signatures || [],

        // 🟢 คะแนนรายข้อสำหรับกราฟ Dashboard (ประเมินตนเอง vs หัวหน้าประเมิน)
        item_analysis: itemAnalysis,
        kpi_scores: kpiScores,
        competency_scores: competencyScores,
      },
    };
  }
}
