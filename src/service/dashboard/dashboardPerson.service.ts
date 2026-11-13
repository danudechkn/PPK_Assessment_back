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
    const rawYear = reqYear ? Number(reqYear) : currentYear;
    const year = rawYear > 2400 ? rawYear - 543 : rawYear;
    const round = reqRound ? Number(reqRound) : currentRound;
    const yearConditions = [year, year + 543];

    // 1. ค้นหาข้อมูลจาก assessment_summaries และ ValueOrders เฉพาะของ user_id ตนเอง
    let [valueOrders, summaryRecord] = await Promise.all([
      db.ValueOrders.findAll({
        where: {
          user_id: userid,
          year: { [db.Sequelize.Op.in]: yearConditions },
          ...(reqRound ? { round } : {}),
        },
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
        where: {
          user_id: userid,
          year: { [db.Sequelize.Op.in]: yearConditions },
          ...(reqRound ? { round } : {}),
        },
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

    // 1.1 Fallback: หากไม่พบข้อมูลในปีงบประมาณที่ส่งมา ให้ค้นหาปีล่าสุดที่มีข้อมูลของผู้ใช้นี้
    if (!summaryRecord && (!valueOrders || valueOrders.length === 0)) {
      const latestSummary = await db.AssessmentSummaries.findOne({
        where: { user_id: userid },
        order: [
          ["year", "DESC"],
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
      });

      if (latestSummary) {
        summaryRecord = latestSummary;
        const targetYearConditions = [
          Number(latestSummary.year),
          Number(latestSummary.year) + 543,
        ];
        valueOrders = await db.ValueOrders.findAll({
          where: {
            user_id: userid,
            year: { [db.Sequelize.Op.in]: targetYearConditions },
            round: latestSummary.round,
          },
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
        });
      } else {
        const latestOrder = await db.ValueOrders.findOne({
          where: { user_id: userid },
          order: [
            ["year", "DESC"],
            ["round", "DESC"],
            ["id", "DESC"],
          ],
        });
        if (latestOrder) {
          const targetYearConditions = [
            Number(latestOrder.year),
            Number(latestOrder.year) + 543,
          ];
          valueOrders = await db.ValueOrders.findAll({
            where: {
              user_id: userid,
              year: { [db.Sequelize.Op.in]: targetYearConditions },
              round: latestOrder.round,
            },
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
          });
        }
      }
    }

    // Map ระดับเกรด (1 = ดีเด่น, 2 = ดีมาก, 3 = ดี, 4 = พอใช้, 5 = ต้องปรับปรุง)
    const gradeMap: Record<number, string> = {
      1: "ดีเด่น",
      2: "ดีมาก",
      3: "ดี",
      4: "พอใช้",
      5: "ต้องปรับปรุง",
    };

    // 🟢 ดึงชื่อหัวข้อเกณฑ์ KPI และ Competency แบบเร็วระดับ O(1) Memory Map
    const [allCompetencies, allKpiLevels, allKpiIndicators] = await Promise.all([
      db.Competencies.findAll({
        attributes: ["id", "competency"],
        raw: true,
      }).catch(() => []),
      db.KpiScoreLevels.findAll({
        attributes: ["id", "criteria_text", "kpi_indicator_id"],
        include: [{ model: db.KpiIndicators, as: "kpi_indicator", attributes: ["id", "name"] }],
        raw: true,
        nest: true,
      }).catch(() => []),
      db.KpiIndicators.findAll({
        attributes: ["id", "name"],
        raw: true,
      }).catch(() => []),
    ]);

    const compNameMap = new Map<number, string>();
    for (const c of allCompetencies as any[]) {
      if (c?.id && c?.competency) {
        compNameMap.set(Number(c.id), String(c.competency).trim());
      }
    }

    const kpiNameMap = new Map<number, string>();
    for (const lvl of allKpiLevels as any[]) {
      if (lvl?.id) {
        const title = lvl.criteria_text || lvl.kpi_indicator?.name;
        if (title) {
          kpiNameMap.set(Number(lvl.id), String(title).trim());
        }
      }
    }
    for (const ind of allKpiIndicators as any[]) {
      if (ind?.id && ind?.name && !kpiNameMap.has(Number(ind.id))) {
        kpiNameMap.set(Number(ind.id), String(ind.name).trim());
      }
    }

    // 🟢 ดึงและแปลงข้อมูลคะแนนรายข้อ (เน้น head_value และ head_actual_value พร้อมชื่อข้อ)
    const itemAnalysis = (valueOrders || []).flatMap((order: any) => {
      const orderPlain = order.get ? order.get({ plain: true }) : order;
      const typeOrderId = orderPlain.type_order_id;
      const valueList = orderPlain.value_data_list || [];

      return valueList.map((item: any, idx: number) => {
        const questId = Number(item.quest);
        let questTitle = "";
        if (Number(typeOrderId) === 1) {
          const rawName = kpiNameMap.get(questId);
          questTitle = rawName ? `${idx + 1}. ${rawName}` : `KPI ${item.quest || idx + 1}`;
        } else {
          const rawName = compNameMap.get(questId);
          questTitle = rawName ? `${idx + 1}. ${rawName}` : `Comp ${item.quest || idx + 1}`;
        }

        const uVal = item.user_value != null ? Number(item.user_value) : null;
        const hVal = item.head_value != null ? Number(item.head_value) : null;
        const sVal = item.submit_value != null ? Number(item.submit_value) : null;

        const uAct = item.user_actual_value != null ? Number(item.user_actual_value) : null;
        const hAct = item.head_actual_value != null ? Number(item.head_actual_value) : null;
        const sAct = item.submit_actual_value != null ? Number(item.submit_actual_value) : null;

        // แปลงคะแนนของหัวหน้าสำหรับสเกลแท่งกราฟ (0-5)
        let effectiveHeadScore = hVal;
        if (effectiveHeadScore == null && hAct != null) {
          effectiveHeadScore = hAct <= 5 ? hAct : Number((hAct / 20).toFixed(2));
        }
        if (effectiveHeadScore == null && sVal != null) {
          effectiveHeadScore = sVal;
        }

        return {
          quest: item.quest,
          title: questTitle,
          name: questTitle,
          user_value: uVal ?? effectiveHeadScore,
          head_value: effectiveHeadScore,
          submit_value: sVal ?? effectiveHeadScore,
          user_actual_value: uAct ?? hAct,
          head_actual_value: hAct,
          submit_actual_value: sAct ?? hAct,
          type_order_id: typeOrderId,
        };
      });
    });

    const extractScores = (targetTypeId: number) => {
      const order = (valueOrders || []).find(
        (o: any) => Number(o.type_order_id) === targetTypeId,
      );
      if (!order) return [];
      const orderPlain = order.get ? order.get({ plain: true }) : order;
      return (orderPlain.value_data_list || []).map((item: any, idx: number) => {
        const questId = Number(item.quest);
        let questTitle = "";
        if (Number(targetTypeId) === 1) {
          const rawName = kpiNameMap.get(questId);
          questTitle = rawName ? `${idx + 1}. ${rawName}` : `KPI ${item.quest || idx + 1}`;
        } else {
          const rawName = compNameMap.get(questId);
          questTitle = rawName ? `${idx + 1}. ${rawName}` : `Comp ${item.quest || idx + 1}`;
        }

        const uVal = item.user_value != null ? Number(item.user_value) : null;
        const hVal = item.head_value != null ? Number(item.head_value) : null;
        const sVal = item.submit_value != null ? Number(item.submit_value) : null;
        const hAct = item.head_actual_value != null ? Number(item.head_actual_value) : null;

        let effectiveHeadScore = hVal;
        if (effectiveHeadScore == null && hAct != null) {
          effectiveHeadScore = hAct <= 5 ? hAct : Number((hAct / 20).toFixed(2));
        }

        return {
          quest: item.quest,
          title: questTitle,
          name: questTitle,
          user_value: uVal ?? effectiveHeadScore,
          head_value: effectiveHeadScore,
          submit_value: sVal ?? effectiveHeadScore,
          head_actual_value: hAct,
        };
      });
    };

    const kpiScores = extractScores(1);
    const competencyScores = extractScores(2);

    // คำนวณสรุปคะแนน KPI & Competency & TotalScore จาก ValueOrders และ Summary
    const kpiOrder = (valueOrders || []).find(
      (o: any) => Number(o.type_order_id) === 1,
    );
    const compOrder = (valueOrders || []).find(
      (o: any) => Number(o.type_order_id) === 2,
    );

    let kpiScore = summaryRecord ? Number(summaryRecord.kpi_score || 0) : 0;
    if (kpiScore === 0 && kpiOrder) {
      kpiScore = Number(kpiOrder.total_value || 0);
      if (kpiScore === 0 && kpiOrder.value_data_list?.length > 0) {
        const sumVal = kpiOrder.value_data_list.reduce((acc: number, item: any) => {
          const val = item.head_value ?? item.submit_value ?? item.user_value ?? 0;
          return acc + Number(val);
        }, 0);
        kpiScore = Number((sumVal / kpiOrder.value_data_list.length * 20).toFixed(2));
      }
    }

    let competencyScore = summaryRecord ? Number(summaryRecord.competency_score || 0) : 0;
    if (competencyScore === 0 && compOrder) {
      competencyScore = Number(compOrder.total_value || 0);
      if (competencyScore === 0 && compOrder.value_data_list?.length > 0) {
        const sumVal = compOrder.value_data_list.reduce((acc: number, item: any) => {
          const act = item.head_actual_value ?? item.submit_actual_value ?? item.user_actual_value;
          if (act != null) return acc + Number(act);
          const val = item.head_value ?? item.submit_value ?? item.user_value ?? 0;
          return acc + (Number(val) <= 5 ? Number(val) * 20 : Number(val));
        }, 0);
        competencyScore = Number((sumVal / compOrder.value_data_list.length).toFixed(2));
      }
    }

    const kpiWeight = summaryRecord?.kpi_weight ? Number(summaryRecord.kpi_weight) : 70.0;
    const compWeight = summaryRecord?.competency_weight ? Number(summaryRecord.competency_weight) : 30.0;

    const kpiWeightedScore = Number((kpiScore * (kpiWeight / 100)).toFixed(2));
    const competencyWeightedScore = Number((competencyScore * (compWeight / 100)).toFixed(2));

    let totalScore = summaryRecord ? Number(summaryRecord.total_score || 0) : 0;
    if (totalScore === 0 && (kpiScore > 0 || competencyScore > 0)) {
      totalScore = Number((kpiWeightedScore + competencyWeightedScore).toFixed(2));
    }

    let gradeLevel = summaryRecord?.grade_level ? Number(summaryRecord.grade_level) : null;
    if (!gradeLevel && totalScore > 0) {
      if (totalScore >= 90) gradeLevel = 1;
      else if (totalScore >= 80) gradeLevel = 2;
      else if (totalScore >= 70) gradeLevel = 3;
      else if (totalScore >= 60) gradeLevel = 4;
      else gradeLevel = 5;
    }

    const hasData = Boolean(
      summaryRecord ||
      (valueOrders && valueOrders.length > 0 && (kpiScore > 0 || competencyScore > 0))
    );

    if (!hasData) {
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

    const resolvedYear = summaryRecord?.year ? Number(summaryRecord.year) : year;
    const resolvedRound = summaryRecord?.round ? Number(summaryRecord.round) : round;

    return {
      success: true,
      data: {
        id: summaryRecord?.id || null,
        user_id: userid,
        head_id: summaryRecord?.head_id || null,
        year: resolvedYear,
        round: resolvedRound,
        has_data: true,

        // 🟢 คะแนนเฉลี่ยรวม
        total_score: totalScore,

        // 🟢 คะแนนรวม KPI
        kpi_score: kpiScore,
        kpi_weight: kpiWeight,
        kpi_weighted_score: kpiWeightedScore,

        // 🟢 คะแนนรวม Competency
        competency_score: competencyScore,
        competency_weight: compWeight,
        competency_weighted_score: competencyWeightedScore,

        // 🟢 ระดับเกรด
        grade_level: gradeLevel,
        grade_label: gradeLevel ? gradeMap[gradeLevel] || "ไม่ระบุ" : "ไม่ระบุ",

        evaluator_status: summaryRecord?.evaluator_status ?? 1,
        status: summaryRecord?.status ?? 1,
        development_plans: summaryRecord?.development_plans || [],
        assessment_signatures: summaryRecord?.assessment_signatures || [],
        signatures: summaryRecord?.assessment_signatures || [],

        // 🟢 คะแนนรายข้อสำหรับกราฟ Dashboard
        item_analysis: itemAnalysis,
        kpi_scores: kpiScores,
        competency_scores: competencyScores,
      },
    };
  }
}
