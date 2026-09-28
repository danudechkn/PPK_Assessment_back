import { Op } from "sequelize";
import dbppk from "../../models/ppkhosp-person";
import dbuser from "../../models/centralusers";
import dbproduct from "../../models/product";
import { AssessmentHelper } from "../assessmentcompetent/helper/assessment.helper";

export class DashboardFuncunitService {
  /**
   * ดึงข้อมูลสรุปผลการประเมินแยกตามหน่วยงาน/กลุ่มงาน (FuncUnit Dashboard Summary)
   * @param userId ID ของผู้ใช้งานที่ล็อกอิน
   * @param reqYear ปีงบประมาณ
   * @param reqRound รอบการประเมิน
   * @param reqFuncUnitID รหัสกลุ่มงาน (ส่งมาจาก frontend หรือดึงจาก slot/user)
   */
  static async getFuncunitDashboardSummary(
    userId: number,
    reqYear?: number,
    reqRound?: number,
    reqFuncUnitID?: string | number
  ) {
    const { round: currentRound, year: currentYear } =
      AssessmentHelper.getCurrentRoundAndYear();
    const rawYear = reqYear ? Number(reqYear) : currentYear;
    const year = rawYear > 2400 ? rawYear - 543 : rawYear;
    const round = reqRound ? Number(reqRound) : currentRound;
    const yearConditions = [year, year + 543];

    // -------------------------------------------------------------
    // 1. ตรวจสอบการหา funcunitID โดยคำนึงถึง Slot ลำดับแรกเสมอ
    // -------------------------------------------------------------
    let targetFuncId: number | null = null;

    if (
      reqFuncUnitID !== undefined &&
      reqFuncUnitID !== null &&
      reqFuncUnitID !== "" &&
      reqFuncUnitID !== "all"
    ) {
      targetFuncId = Number(reqFuncUnitID);
    } else {
      // ถ้าไม่ได้ระบุ funcunitID มา ให้เช็ค Slot ของ user ก่อน
      const userSlot = await dbuser.SlotSetupFuncunit.findOne({
        where: {
          userid: userId,
          active: "Y",
        },
      });

      if (userSlot && userSlot.FuncUnitID) {
        targetFuncId = Number(userSlot.FuncUnitID);
      } else {
        // ถ้าไม่มี slot ให้ใช้ FuncUnitID จากข้อมูลบุคลากรของ user เอง
        const personUser = await dbppk.AppUser.findOne({
          where: { userid: userId },
          include: [
            {
              model: dbppk.AppPerson,
              as: "Person",
              attributes: ["FuncUnitID"],
            },
          ],
        });
        targetFuncId = personUser?.Person?.FuncUnitID
          ? Number(personUser.Person.FuncUnitID)
          : null;
      }
    }

    if (!targetFuncId) {
      return {
        success: true,
        data: {
          year,
          round,
          funcunit_id: null,
          funcunit_name: "ไม่พบหน่วยงาน",
          total_persons: 0,
          assessed_count: 0,
          pending_count: 0,
          assessed_percentage: 0,
          avg_total_score: 0,
          avg_kpi_score: 0,
          avg_competency_score: 0,
          person_list: [],
          funcunit_list: [],
        },
      };
    }

    // ดึงชื่อหน่วยงานที่เลือก
    const funcUnitRecord = await dbppk.AppPersonFunctionalUnit.findOne({
      where: { FuncunitID: targetFuncId },
      attributes: ["FuncunitID", "FuncunitName"],
    });
    const funcunitName =
      funcUnitRecord?.FuncunitName || `กลุ่มงาน ID: ${targetFuncId}`;

    // -------------------------------------------------------------
    // 2. ค้นหาบุคลากรในหน่วยงาน (โดยนำ Slot มาคิดรวม คนที่ย้ายเข้า/ย้ายออก)
    // -------------------------------------------------------------
    const slotInMembers = await dbuser.SlotSetupFuncunit.findAll({
      where: {
        FuncUnitID: targetFuncId,
        active: "Y",
      },
      attributes: ["userid"],
    });
    const slotInUserIds = slotInMembers.map((s: any) => Number(s.userid));

    const slotOutMembers = await dbuser.SlotSetupFuncunit.findAll({
      where: {
        FuncUnitID: { [Op.ne]: targetFuncId },
        active: "Y",
      },
      attributes: ["userid"],
    });
    const slotOutUserIds = slotOutMembers.map((s: any) => Number(s.userid));

    const [slotInPersons, slotOutPersons] = await Promise.all([
      slotInUserIds.length > 0
        ? dbppk.AppUser.findAll({
            where: { userid: { [Op.in]: slotInUserIds } },
            attributes: ["personid"],
          })
        : [],
      slotOutUserIds.length > 0
        ? dbppk.AppUser.findAll({
            where: { userid: { [Op.in]: slotOutUserIds } },
            attributes: ["personid"],
          })
        : [],
    ]);

    const slotInPersonIds = slotInPersons
      .map((u: any) => Number(u.personid))
      .filter(Boolean);
    const slotOutPersonIds = slotOutPersons
      .map((u: any) => Number(u.personid))
      .filter(Boolean);

    const personWhereCondition: any = {
      [Op.or]: [
        {
          funcUnitID: targetFuncId,
          ...(slotOutPersonIds.length > 0
            ? { id: { [Op.notIn]: slotOutPersonIds } }
            : {}),
        },
        ...(slotInPersonIds.length > 0
          ? [{ id: { [Op.in]: slotInPersonIds } }]
          : []),
      ],
      StatusID: { [Op.in]: [1, 2, 10] },
      id: { [Op.ne]: 900002 },
    };

    const persons = await dbppk.AppPerson.findAll({
      attributes: ["id", "firstname", "lastname", "OffID", "PosID", "FuncUnitID"],
      where: personWhereCondition,
      include: [
        {
          model: dbppk.AppPositions,
          as: "Position",
          required: false,
          attributes: ["Positionname"],
        },
        {
          model: dbppk.PersonnalOfficeGroup,
          as: "OfficePerson",
          required: false,
          attributes: ["offname"],
        },
        {
          model: dbppk.AppPersonFunctionalUnit,
          as: "FuncUnit",
          required: false,
          attributes: ["FuncunitName"],
        },
        {
          model: dbppk.AppUser,
          as: "Users",
          required: false,
          attributes: ["userid"],
        },
      ],
    });

    const targetUserIds = persons
      .map((p: any) => p.Users?.[0]?.userid || p.Users?.[1]?.userid)
      .filter(Boolean)
      .map(Number);

    // -------------------------------------------------------------
    // 3. ดึงผลสรุปการประเมินจาก assessment_summaries (รองรับทั้งปี ค.ศ. และ พ.ศ.)
    // -------------------------------------------------------------
    const summaries =
      targetUserIds.length > 0
        ? await dbproduct.AssessmentSummaries.findAll({
            where: {
              [Op.or]: [
                {
                  funcunit_id: targetFuncId,
                  year: { [Op.in]: yearConditions },
                  round,
                },
                {
                  user_id: { [Op.in]: targetUserIds },
                  year: { [Op.in]: yearConditions },
                  round,
                },
              ],
            },
          })
        : [];

    const summaryMap = new Map<number, any>();
    for (const s of summaries) {
      if (s.user_id) {
        summaryMap.set(Number(s.user_id), s);
      }
    }

    // เกรด Map
    const gradeMap: Record<number, string> = {
      1: "ดีเด่น",
      2: "ดีมาก",
      3: "ดี",
      4: "พอใช้",
      5: "ต้องปรับปรุง",
    };

    // -------------------------------------------------------------
    // 4. คำนวณสรุปการประเมินของคนในหน่วยงาน
    // -------------------------------------------------------------
    let assessedCount = 0;
    let totalScoreSum = 0;
    let kpiScoreSum = 0;
    let competencyScoreSum = 0;

    const personList = persons.map((p: any, index: number) => {
      const uId = p.Users?.[0]?.userid || p.Users?.[1]?.userid || null;
      const s = uId ? summaryMap.get(Number(uId)) : null;

      const hasAssessed = s && s.total_score !== null;
      if (hasAssessed) {
        assessedCount++;
        totalScoreSum += Number(s.total_score || 0);
        kpiScoreSum += Number(s.kpi_weighted_score || s.kpi_score || 0);
        competencyScoreSum += Number(
          s.competency_weighted_score || s.competency_score || 0
        );
      }

      const gradeLevel = s?.grade_level ? Number(s.grade_level) : null;

      return {
        no: index + 1,
        personid: p.id,
        userid: uId ? Number(uId) : null,
        fullname: `${p.firstname || ""} ${p.lastname || ""}`.trim(),
        position: p.Position?.Positionname || "-",
        office: p.OfficePerson?.offname || "-",
        funcunit_name: p.FuncUnit?.FuncunitName || funcunitName,
        total_score: s?.total_score !== null && s?.total_score !== undefined ? Number(s.total_score) : null,
        kpi_score: s?.kpi_score !== null && s?.kpi_score !== undefined ? Number(s.kpi_score) : null,
        kpi_weighted_score: s?.kpi_weighted_score !== null && s?.kpi_weighted_score !== undefined ? Number(s.kpi_weighted_score) : null,
        competency_score: s?.competency_score !== null && s?.competency_score !== undefined ? Number(s.competency_score) : null,
        competency_weighted_score: s?.competency_weighted_score !== null && s?.competency_weighted_score !== undefined ? Number(s.competency_weighted_score) : null,
        grade_level: gradeLevel,
        grade_label: gradeLevel ? gradeMap[gradeLevel] || "ไม่ระบุ" : "ยังไม่ได้ประเมิน",
        status: s ? (s.status === 3 ? "COMPLETED" : "IN_PROGRESS") : "PENDING",
      };
    });

    const totalPersons = persons.length;
    const pendingCount = totalPersons - assessedCount;
    const assessedPercentage =
      totalPersons > 0
        ? parseFloat(((assessedCount / totalPersons) * 100).toFixed(1))
        : 0;

    const avgTotalScore =
      assessedCount > 0
        ? parseFloat((totalScoreSum / assessedCount).toFixed(2))
        : 0;
    const avgKpiScore =
      assessedCount > 0
        ? parseFloat((kpiScoreSum / assessedCount).toFixed(2))
        : 0;
    const avgCompetencyScore =
      assessedCount > 0
        ? parseFloat((competencyScoreSum / assessedCount).toFixed(2))
        : 0;

    const funcunitSummaryItem = {
      id: targetFuncId,
      name: funcunitName,
      totalPersons,
      assessedCount,
      pendingCount,
      assessedPercentage,
      totalScore: avgTotalScore,
      kpiScore: avgKpiScore,
      competencyScore: avgCompetencyScore,
    };

    // -------------------------------------------------------------
    // 5. วิเคราะห์คะแนนเปรียบเทียบตามตำแหน่งงาน (Position Analysis Chart - เบาที่สุด ไม่ query เพิ่ม)
    // -------------------------------------------------------------
    const positionMap = new Map<
      string,
      {
        count: number;
        assessedCount: number;
        totalScoreSum: number;
        kpiScoreSum: number;
        competencyScoreSum: number;
      }
    >();

    for (const p of personList) {
      const posName = p.position || "ไม่ระบุตำแหน่ง";
      if (!positionMap.has(posName)) {
        positionMap.set(posName, {
          count: 0,
          assessedCount: 0,
          totalScoreSum: 0,
          kpiScoreSum: 0,
          competencyScoreSum: 0,
        });
      }
      const posData = positionMap.get(posName)!;
      posData.count++;
      if (p.total_score !== null && p.total_score !== undefined) {
        posData.assessedCount++;
        posData.totalScoreSum += Number(p.total_score);
        posData.kpiScoreSum += Number(p.kpi_weighted_score ?? p.kpi_score ?? 0);
        posData.competencyScoreSum += Number(
          p.competency_weighted_score ?? p.competency_score ?? 0
        );
      }
    }

    const positionCategories: string[] = [];
    const positionTotalScores: number[] = [];
    const positionKpiScores: number[] = [];
    const positionCompetencyScores: number[] = [];
    const positionDetails: Array<{
      position_name: string;
      total_persons: number;
      assessed_count: number;
      avg_total_score: number;
      avg_kpi_score: number;
      avg_competency_score: number;
    }> = [];

    positionMap.forEach((val, posName) => {
      positionCategories.push(posName);
      const avgTotal =
        val.assessedCount > 0
          ? parseFloat((val.totalScoreSum / val.assessedCount).toFixed(1))
          : 0;
      const avgKpi =
        val.assessedCount > 0
          ? parseFloat((val.kpiScoreSum / val.assessedCount).toFixed(1))
          : 0;
      const avgComp =
        val.assessedCount > 0
          ? parseFloat((val.competencyScoreSum / val.assessedCount).toFixed(1))
          : 0;

      positionTotalScores.push(avgTotal);
      positionKpiScores.push(avgKpi);
      positionCompetencyScores.push(avgComp);

      positionDetails.push({
        position_name: posName,
        total_persons: val.count,
        assessed_count: val.assessedCount,
        avg_total_score: avgTotal,
        avg_kpi_score: avgKpi,
        avg_competency_score: avgComp,
      });
    });

    const chartAnalysisData = {
      categories: positionCategories,
      all: {
        categories: positionCategories,
        series: [
          { name: "คะแนนเฉลี่ยรวม", data: positionTotalScores },
          { name: "คะแนน KPI", data: positionKpiScores },
          { name: "คะแนนสมรรถนะ", data: positionCompetencyScores },
        ],
        totalSeries: positionTotalScores,
        kpiSeries: positionKpiScores,
        compSeries: positionCompetencyScores,
      },
      kpi: {
        categories: positionCategories,
        series: [{ name: "คะแนน KPI", data: positionKpiScores }],
        kpiSeries: positionKpiScores,
      },
      competency: {
        categories: positionCategories,
        series: [{ name: "คะแนนสมรรถนะ", data: positionCompetencyScores }],
        compSeries: positionCompetencyScores,
      },
      position_details: positionDetails,
    };

    // -------------------------------------------------------------
    // 6. การกระจายตัวของระดับผลการประเมิน (Grade Distribution สำหรับ Donut Chart)
    // -------------------------------------------------------------
    const gradeDistribution = [
      { grade_level: 1, label: "ดีเด่น (90-100%)", count: 0, percentage: 0, color: "#6B943B" },
      { grade_level: 2, label: "ดีมาก (80-89%)", count: 0, percentage: 0, color: "#A7D94D" },
      { grade_level: 3, label: "ดี (70-79%)", count: 0, percentage: 0, color: "#F5DE88" },
      { grade_level: 4, label: "พอใช้ (60-69%)", count: 0, percentage: 0, color: "#F7BE88" },
      { grade_level: 5, label: "ต้องปรับปรุง (<60%)", count: 0, percentage: 0, color: "#F89588" },
    ];

    for (const p of personList) {
      if (p.grade_level && p.grade_level >= 1 && p.grade_level <= 5) {
        gradeDistribution[p.grade_level - 1].count++;
      }
    }

    gradeDistribution.forEach((g) => {
      g.percentage =
        assessedCount > 0
          ? parseFloat(((g.count / assessedCount) * 100).toFixed(1))
          : 0;
    });

    const avgGradeLabel =
      avgTotalScore >= 90
        ? "ระดับ ดีเด่น"
        : avgTotalScore >= 80
        ? "ระดับ ดีมาก"
        : avgTotalScore >= 70
        ? "ระดับ ดี"
        : avgTotalScore >= 60
        ? "ระดับ พอใช้"
        : "ระดับ ต้องปรับปรุง";

    const donutChartData = {
      series: gradeDistribution.map((g) => g.count),
      labels: gradeDistribution.map((g) => g.label),
      colors: gradeDistribution.map((g) => g.color),
      distribution: gradeDistribution,
      total_assessed: assessedCount,
      avg_score: avgTotalScore,
      avg_grade_label: avgGradeLabel,
    };

    return {
      success: true,
      data: {
        year: rawYear,
        round,
        funcunit_id: targetFuncId,
        funcunit_name: funcunitName,
        total_persons: totalPersons,
        assessed_count: assessedCount,
        pending_count: pendingCount,
        assessed_percentage: assessedPercentage,
        avg_total_score: avgTotalScore,
        avg_kpi_score: avgKpiScore,
        avg_competency_score: avgCompetencyScore,
        person_list: personList,
        funcunit_list: [funcunitSummaryItem],
        chart_analysis: chartAnalysisData,
        grade_distribution: gradeDistribution,
        donut_chart: donutChartData,
      },
    };
  }
}
