import { Op } from "sequelize";
import db from "../../models/product";
import dbuser from "../../models/centralusers";
import dbppk from "../../models/ppkhosp-person";
import { ApiError } from "../../utils/api-response.util";
import { parseScore } from "../../utils/score.util";
import { bufferToSign } from "../../utils/sign-buffer.util";
import { AssessmentHelper } from "./helper/assessment.helper";
import {
  AssessmentMode,
  AssessmentStatus,
  SaveScoresParams,
  SaveSelfScoresParams,
  SaveHeadScoresParams,
  SaveAgreementScoresParams,
} from "../../types/assessmentcompetent";

class AssessmentService {
  // =================================================================
  // 0. Self Assessment Check
  // =================================================================

  /**
   * ดึง Data URL (Base64) ของลายเซ็นตาม signature_id
   */
  private static async getSignatureUrlById(signatureId: number) {
    if (!signatureId) return null;

    const userSignData = await dbuser.UserSignData.findByPk(signatureId);
    if (userSignData?.signature) {
      return bufferToSign(userSignData.signature);
    }

    const doctorSignData = await dbuser.DoctorImageData.findByPk(signatureId);
    if (doctorSignData?.signature) {
      return bufferToSign(doctorSignData.signature);
    }

    return null;
  }

  /**
   * ตรวจสอบสถานะการประเมินตนเองและคะแนนภาพรวมของผู้ใช้ในรอบ/ปีปัจจุบัน
   * รองรับทั้งการระบุ typeOrderId เจาะจง (1 = KPI, 2 = Competency) หรือดึงทั้งสองประเภทพร้อมกัน
   */
  static async checkSelfAssessment(
    userId: number,
    typeOrderId?: number,
    typeId?: number,
    doctorId?: number,
    reqYear?: number,
    reqRound?: number,
    reqOrderId?: number,
  ) {
    let year = reqYear
      ? Number(reqYear) > 2500
        ? Number(reqYear) - 543
        : Number(reqYear)
      : undefined;
    let round = reqRound ? Number(reqRound) : undefined;
    let targetUserId = userId;

    if (reqOrderId) {
      const orderRecord = await db.ValueOrders.findByPk(reqOrderId);
      if (orderRecord) {
        if (!year) year = Number(orderRecord.year);
        if (!round) round = Number(orderRecord.round);
        if (orderRecord.user_id) targetUserId = Number(orderRecord.user_id);
      } else {
        const sumRecord = await db.AssessmentSummaries.findByPk(reqOrderId);
        if (sumRecord) {
          if (!year) year = Number(sumRecord.year);
          if (!round) round = Number(sumRecord.round);
          if (sumRecord.user_id) targetUserId = Number(sumRecord.user_id);
        }
      }
    }

    const { round: currentRound, year: currentYear } =
      AssessmentHelper.getCurrentRoundAndYear();
    if (!year) year = currentYear;
    if (!round) round = currentRound;
    const activeUserId = targetUserId;

    // 1. ดึงข้อมูลสรุปผลการประเมิน แผนพัฒนาตนเอง และรายการลายเซ็นที่ลงในใบประเมิน
    let summaryRecord: any = null;
    const summaryIncludeOptions = [
      {
        model: db.AssessmentDevelopmentPlans,
        as: "development_plans",
        attributes: [
          "id",
          "summary_id",
          "need_development",
          "development_method",
          "development_period",
          "sort_order",
        ],
      },
      {
        model: db.AssessmentSignatures,
        as: "assessment_signatures",
        attributes: [
          "id",
          "summary_id",
          "signer_id",
          "signer_type_id",
          "signer_name",
          "signer_position",
          "signature_id",
          "signed_at",
        ],
      },
    ];

    if (reqOrderId) {
      summaryRecord = await db.AssessmentSummaries.findByPk(reqOrderId, {
        attributes: [
          "id",
          "user_id",
          "head_id",
          "round",
          "year",
          "kpi_score",
          "kpi_weight",
          "kpi_weighted_score",
          "competency_score",
          "competency_weight",
          "competency_weighted_score",
          "total_score",
          "grade_level",
          "evaluator_status",
          "status",
          "createdAt",
        ],
        include: summaryIncludeOptions,
        order: [
          [
            { model: db.AssessmentDevelopmentPlans, as: "development_plans" },
            "sort_order",
            "ASC",
          ],
        ],
      });
    }

    if (!summaryRecord) {
      summaryRecord = await db.AssessmentSummaries.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { user_id: activeUserId, year, round },
            { head_id: activeUserId, year, round },
          ],
        },
        attributes: [
          "id",
          "user_id",
          "head_id",
          "round",
          "year",
          "kpi_score",
          "kpi_weight",
          "kpi_weighted_score",
          "competency_score",
          "competency_weight",
          "competency_weighted_score",
          "total_score",
          "grade_level",
          "evaluator_status",
          "status",
          "createdAt",
        ],
        include: summaryIncludeOptions,
        order: [
          ["id", "DESC"],
          [
            { model: db.AssessmentDevelopmentPlans, as: "development_plans" },
            "sort_order",
            "ASC",
          ],
        ],
      });
    }

    // 2. แปลงผลลัพธ์ summaryRecord และดึงรูปภาพ Base64 ของลายเซ็นแต่ละคนที่ลงชื่อในใบประเมิน
    let summaryList: any = null;
    let userSignatureUrl: string | null = null;
    let headSignatureUrl: string | null = null;

    if (summaryRecord) {
      const plainSummary = summaryRecord.get({ plain: true });

      const formattedSignatures = await Promise.all(
        (plainSummary.assessment_signatures || []).map(async (sig: any) => {
          const signatureUrl = await this.getSignatureUrlById(sig.signature_id);

          // แยกไว้เผื่อเรียกใช้อัจฉริยะ (signer_type_id: 1 = ผู้รับการประเมิน, 2 = ผู้ประเมิน/หัวหน้า)
          if (sig.signer_type_id === 1) userSignatureUrl = signatureUrl;
          if (sig.signer_type_id === 2) headSignatureUrl = signatureUrl;

          return {
            ...sig,
            signature_url: signatureUrl, // 👈 แนบ Base64 Data URL ของลายเซ็นออกมา!
          };
        }),
      );

      summaryList = {
        ...plainSummary,
        assessment_signatures: formattedSignatures,
      };
    }

    // 3. ดึงลายเซ็นโปรไฟล์ส่วนตัวของผู้ใช้ปัจจุบันที่ล็อกอินอยู่
    let mySignatureRecord: any = null;
    if ([3, 4].includes(typeId || 0)) {
      mySignatureRecord = await dbuser.UserSign.findOne({
        where: { userid: userId, flag_cancel: "N" },
        include: [{ model: dbuser.UserSignData, as: "SignData" }],
      });
    } else if (typeId === 5) {
      const whereCondition: any = { userid: userId, flag_cancel: "N" };
      if (doctorId) whereCondition.doctorid = doctorId;

      mySignatureRecord = await dbuser.DoctorImage.findOne({
        where: whereCondition,
        include: [{ model: dbuser.DoctorImageData, as: "DoctorSignData" }],
      });
    }

    const mySignatureUrl = bufferToSign(
      mySignatureRecord?.SignData?.signature ||
        mySignatureRecord?.DoctorSignData?.signature ||
        null,
    );

    if (typeOrderId) {
      const data = await db.ValueOrders.findOne({
        where: { user_id: activeUserId, round, year, type_order_id: typeOrderId },
        include: [
          {
            model: db.ValueData,
            as: "value_data_list",
          },
        ],
      });

      const summaryResult = this.calculateAssessmentSummary(
        data,
        activeUserId,
        round,
        year,
        typeOrderId,
      );

      return {
        ...summaryResult,
        summaryList: summaryList || null,
        summary_data: summaryList || null,
        my_signature: mySignatureUrl,
        user_signature: userSignatureUrl,
        head_signature: headSignatureUrl,
      };
    }

    // กรณีไม่ระบุ typeOrderId ให้ค้นหา orders ทั้งหมดของผู้ใช้ในรอบ/ปีนี้
    const allOrders = await db.ValueOrders.findAll({
      where: { user_id: activeUserId, round, year },
      include: [
        {
          model: db.ValueData,
          as: "value_data_list",
        },
      ],
      order: [["type_order_id", "ASC"]],
    });

    const kpiOrder =
      allOrders.find((o: any) => Number(o.type_order_id) === 1) || null;
    const competencyOrder =
      allOrders.find((o: any) => Number(o.type_order_id) === 2) || null;

    // ตรวจสอบ fallback สำหรับลายเซ็นหัวหน้า หากยังไม่มีใน assessment_signatures
    if (!headSignatureUrl) {
      try {
        const headIdToLookup =
          summaryRecord?.head_id ||
          (kpiOrder as any)?.head_id ||
          (competencyOrder as any)?.head_id;
        if (headIdToLookup) {
          const headUserSign = await dbuser.UserSign.findOne({
            where: { userid: headIdToLookup, flag_cancel: "N" },
            include: [{ model: dbuser.UserSignData, as: "SignData" }],
          });
          if (headUserSign?.SignData?.signature) {
            headSignatureUrl = bufferToSign(headUserSign.SignData.signature);
          }
        }
      } catch (err) {
        // Fallback silently if signature lookup fails
      }
    }

    if (summaryList && !summaryList.assessment_signatures.some((s: any) => s.signer_type_id === 2 || s.signer_type_id === "2")) {
      if (headSignatureUrl) {
        let headName = "ผู้บังคับบัญชา / ผู้ประเมิน";
        let headPos = "หัวหน้ากลุ่มงาน / ผู้บังคับบัญชา";
        if (summaryRecord?.head_id) {
          try {
            const headUser = await dbppk.AppUser.findOne({
              where: { userid: summaryRecord.head_id },
              attributes: ["userid", "personid"],
              include: [
                {
                  model: dbppk.AppPerson,
                  as: "Person",
                  attributes: ["firstname", "lastname"],
                },
              ],
            });
            const pFirst = headUser?.Person?.firstname || "";
            const pLast = headUser?.Person?.lastname || "";
            if (pFirst || pLast) {
              headName = `${pFirst} ${pLast}`.trim();
            }
          } catch (err) {
            // Keep default headName
          }
        }

        summaryList.assessment_signatures.push({
          id: 0,
          summary_id: summaryRecord ? summaryRecord.id : 0,
          signer_id: summaryRecord ? summaryRecord.head_id : 0,
          signer_type_id: 2,
          signer_name: headName,
          signer_position: headPos,
          signature_url: headSignatureUrl,
          signed_at: summaryRecord?.createdAt || new Date(),
        });
      }
    }

    const kpiSummary = this.calculateAssessmentSummary(
      kpiOrder,
      activeUserId,
      round,
      year,
      1,
    );
    const competencySummary = this.calculateAssessmentSummary(
      competencyOrder,
      activeUserId,
      round,
      year,
      2,
    );

    const hasSelfAssessed =
      kpiSummary.hasSelfAssessed || competencySummary.hasSelfAssessed;
    const hasHeadAssessed =
      kpiSummary.hasHeadAssessed || competencySummary.hasHeadAssessed;

    return {
      // 🟢 ข้อมูลสรุปผลการประเมิน แผนพัฒนา และลายเซ็นของแต่ละคน
      summaryList: summaryList || null,
      summary_data: summaryList || null,
      my_signature: mySignatureUrl,
      user_signature: userSignatureUrl,
      head_signature: headSignatureUrl,

      // 1. แยกตาม Key เพื่อให้เรียกใช้ง่าย
      kpi: kpiSummary,
      competency: competencySummary,

      // 2. โครงสร้างแบบ Array items ตรงกับตอนบันทึก (type_order_id 1 และ 2)
      item: [
        { ...kpiSummary, type_order_id: 1 },
        { ...competencySummary, type_order_id: 2 },
      ],

      // 3. Dictionary สำหรับเข้าถึงด้วยรหัสประเภท: by_type[1], by_type[2]
      by_type: {
        1: kpiSummary,
        2: competencySummary,
      },

      // 4. Backward Compatibility เพื่อให้โค้ดหน้าบ้านเดิมที่ดึง competency ไม่พัง
      ...competencySummary,
      hasSelfAssessed,
      hasHeadAssessed,
    };
  }

  /**
   * ดึงประวัติการประเมินตนเองของผู้ใช้ทั้งหมด ทุกปีและทุกรอบ
   */
  static async getMyAssessmentHistory(userId: number, reqYear?: number) {
    let yearFilter: number | undefined = undefined;
    if (reqYear) {
      yearFilter = reqYear > 2500 ? reqYear - 543 : reqYear;
    }

    const orderWhere: any = { user_id: userId };
    const summaryWhere: any = { user_id: userId };
    if (yearFilter) {
      orderWhere.year = yearFilter;
      summaryWhere.year = yearFilter;
    }

    // 1. ดึง ValueOrders ทั้งหมดของผู้ใช้
    const orders = await db.ValueOrders.findAll({
      where: orderWhere,
      order: [
        ["year", "DESC"],
        ["round", "DESC"],
        ["type_order_id", "ASC"],
      ],
    });

    // 2. ดึง AssessmentSummaries ทั้งหมดของผู้ใช้
    const summaries = await db.AssessmentSummaries.findAll({
      where: summaryWhere,
      include: [
        {
          model: db.AssessmentSignatures,
          as: "assessment_signatures",
          attributes: ["id", "signer_id", "signer_type_id", "signed_at"],
        },
      ],
      order: [
        ["year", "DESC"],
        ["round", "DESC"],
      ],
    });

    // 3. รวมและจัดกลุ่มตาม year_round
    const groupMap = new Map<string, any>();
    const allYearsSet = new Set<number>();

    // เพิ่มปีปัจจุบันลงใน set เป็นอย่างน้อย
    const currentYearThai = new Date().getFullYear() + 543;
    allYearsSet.add(currentYearThai);

    // นำเข้า orders
    for (const ord of orders) {
      const y = Number(ord.year);
      const r = Number(ord.round);
      if (!y || !r) continue;
      const thaiYear = y > 2500 ? y : y + 543;
      allYearsSet.add(thaiYear);

      const key = `${y}_${r}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          year: y,
          thai_year: thaiYear,
          round: r,
          kpiOrder: null,
          competencyOrder: null,
          summary: null,
          updatedAt: ord.updatedAt || ord.createdAt,
        });
      }
      const item = groupMap.get(key);
      if (Number(ord.type_order_id) === 1) {
        item.kpiOrder = ord.get({ plain: true });
      } else if (Number(ord.type_order_id) === 2) {
        item.competencyOrder = ord.get({ plain: true });
      }
      if (
        ord.updatedAt &&
        (!item.updatedAt || new Date(ord.updatedAt) > new Date(item.updatedAt))
      ) {
        item.updatedAt = ord.updatedAt;
      }
    }

    // นำเข้า summaries
    for (const sum of summaries) {
      const y = Number(sum.year);
      const r = Number(sum.round);
      if (!y || !r) continue;
      const thaiYear = y > 2500 ? y : y + 543;
      allYearsSet.add(thaiYear);

      const key = `${y}_${r}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          year: y,
          thai_year: thaiYear,
          round: r,
          kpiOrder: null,
          competencyOrder: null,
          summary: null,
          updatedAt: sum.updatedAt || sum.createdAt,
        });
      }
      const item = groupMap.get(key);
      item.summary = sum.get({ plain: true });
      if (
        sum.updatedAt &&
        (!item.updatedAt || new Date(sum.updatedAt) > new Date(item.updatedAt))
      ) {
        item.updatedAt = sum.updatedAt;
      }
    }

    // 4. แปลงโครงสร้างส่งกลับไปให้ Frontend
    const historyList = Array.from(groupMap.values()).map((grp) => {
      const {
        year,
        thai_year: thaiYear,
        round,
        kpiOrder,
        competencyOrder,
        summary,
        updatedAt,
      } = grp;
      const orderId =
        kpiOrder?.id || competencyOrder?.id || summary?.id || `${year}_${round}`;

      // Period text
      const period =
        round === 1
          ? `1 ต.ค. ${thaiYear - 1} - 31 มี.ค. ${thaiYear}`
          : `1 เม.ย. ${thaiYear} - 30 ก.ย. ${thaiYear}`;

      // Scores (safe number conversion for Sequelize DECIMAL strings)
      const rawKpiScore = summary?.kpi_score ?? kpiOrder?.total_value ?? null;
      const rawCompScore =
        summary?.competency_score ?? competencyOrder?.total_value ?? null;
      const rawTotalScore = summary?.total_score ?? null;

      const kpiScore =
        rawKpiScore != null && !isNaN(Number(rawKpiScore))
          ? Number(Number(rawKpiScore).toFixed(2))
          : null;
      const compScore =
        rawCompScore != null && !isNaN(Number(rawCompScore))
          ? Number(Number(rawCompScore).toFixed(2))
          : null;
      const totalScore =
        rawTotalScore != null && !isNaN(Number(rawTotalScore))
          ? Number(Number(rawTotalScore).toFixed(2))
          : null;

      // Signatures
      const sigs = summary?.assessment_signatures || [];
      const hasUserSigned = sigs.some((s: any) => Number(s.signer_type_id) === 1);
      const hasHeadSigned = sigs.some((s: any) => Number(s.signer_type_id) === 2);

      // Grade
      let gradeLevel = "-";
      let gradeBadge = "bg-neutral-50 text-neutral-500 border-neutral-200/80";
      if (totalScore != null) {
        if (totalScore >= 90) {
          gradeLevel = "ดีเด่น";
          gradeBadge = "bg-[#F2F9E6] text-[#4F7327] border-[#D6EE9C]";
        } else if (totalScore >= 80) {
          gradeLevel = "ดีมาก";
          gradeBadge = "bg-[#F0F7FB] text-[#246B9C] border-[#CEE4F2]";
        } else if (totalScore >= 70) {
          gradeLevel = "ดี";
          gradeBadge = "bg-[#F5F8ED] text-[#55782B] border-[#DCEDBE]";
        } else if (totalScore >= 60) {
          gradeLevel = "พอใช้";
          gradeBadge = "bg-[#FDF7ED] text-[#A0631F] border-[#F7E4C4]";
        } else {
          gradeLevel = "ต้องปรับปรุง";
          gradeBadge = "bg-[#FFF5F4] text-[#A84A42] border-[#FBD6D2]";
        }
      }

      // Status
      const isCompleted =
        summary?.status === 1 ||
        (hasUserSigned && hasHeadSigned) ||
        (kpiOrder?.status === "COMPLETED" && competencyOrder?.status === "COMPLETED") ||
        kpiOrder?.status === "COMPLETED" ||
        competencyOrder?.status === "COMPLETED";

      let status = "PENDING";
      let statusText = "รอดำเนินการ";
      let statusBadge = "bg-neutral-50 text-neutral-500 border-neutral-200/80";
      let tabStatus: "completed" | "pending" = "pending";

      if (isCompleted) {
        status = "COMPLETED";
        statusText = "ประเมินเสร็จสมบูรณ์";
        statusBadge = "bg-[#F1F9E4] text-[#4F7327] border-[#D6EE9C]";
        tabStatus = "completed";
      } else if (hasHeadSigned && !hasUserSigned) {
        status = "WAITING_ACKNOWLEDGE";
        statusText = "รอลงชื่อรับทราบ";
        statusBadge = "bg-[#FDF8EE] text-[#9E6E1C] border-[#F6E6C0]";
        tabStatus = "pending";
      } else if (
        kpiOrder?.status === "WAITING_AGREEMENT" ||
        competencyOrder?.status === "WAITING_AGREEMENT"
      ) {
        status = "WAITING_AGREEMENT";
        statusText = "รอกรรมการสรุปตกลง";
        statusBadge = "bg-[#F8F5FC] text-[#6E4E9E] border-[#E8DEF5]";
        tabStatus = "pending";
      } else if (
        kpiOrder?.status === "SELF_SUBMITTED" ||
        competencyOrder?.status === "SELF_SUBMITTED"
      ) {
        status = "SELF_SUBMITTED";
        statusText = "ประเมินตนเองแล้ว (รอหัวหน้า)";
        statusBadge = "bg-[#F0F6FC] text-[#2A659B] border-[#D2E4F7]";
        tabStatus = "pending";
      }

      return {
        orderId,
        kpiOrderId: kpiOrder?.id || null,
        competencyOrderId: competencyOrder?.id || null,
        summaryId: summary?.id || null,
        year,
        thaiYear,
        round,
        title: `รอบที่ ${round}/${thaiYear}`,
        period,
        status,
        statusText,
        statusBadge,
        tabStatus,
        kpiScore,
        competencyScore: compScore,
        totalScore,
        gradeLevel,
        gradeBadge,
        hasUserSigned,
        hasHeadSigned,
        updatedAt,
      };
    });

    // Sort by year DESC, round DESC
    historyList.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.round - a.round;
    });

    const years = Array.from(allYearsSet).sort((a, b) => b - a);

    return {
      history: historyList,
      years,
      totalCount: historyList.length,
      completedCount: historyList.filter((h) => h.tabStatus === "completed").length,
      pendingCount: historyList.filter((h) => h.tabStatus === "pending").length,
    };
  }

  // =================================================================
  // 1. Assessment Orders Management
  // =================================================================

  static async getOrderById(id: number) {
    AssessmentHelper.assertPositiveId(id, "id");
    return AssessmentHelper.ensureOrder(id);
  }

  static async getAllOrders(filter: unknown = {}) {
    AssessmentHelper.assertObject(filter, "query");
    const where: Record<string, unknown> = {};

    for (const field of AssessmentHelper.ORDER_FIELDS) {
      if (
        (filter as any)[field] !== undefined &&
        (filter as any)[field] !== ""
      ) {
        where[field] = (filter as any)[field];
      }
    }

    return db.ValueOrders.findAll({
      where: AssessmentHelper.orderPayload(where),
      order: [["id", "DESC"]],
    });
  }

  static async createOrder(data: unknown) {
    const payload = AssessmentHelper.orderPayload(data);
    return db.ValueOrders.create(payload);
  }

  static async updateOrder(id: number, data: unknown) {
    AssessmentHelper.assertPositiveId(id, "orderId");
    const payload = AssessmentHelper.orderPayload(data);
    if (Object.keys(payload).length === 0) {
      throw new ApiError("At least one assessment order field is required");
    }
    const order = await AssessmentHelper.ensureOrder(id);
    return order.update(payload);
  }

  static async deleteOrder(id: number) {
    AssessmentHelper.assertPositiveId(id, "orderId");
    await db.sequelize.transaction(async (transaction: any) => {
      const order = await db.ValueOrders.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!order) throw new ApiError("Assessment order not found", 404);

      if (db.KpiAssessmentValues) {
        await db.KpiAssessmentValues.destroy({
          where: { value_order_id: id },
          transaction,
        });
      }
      await db.ValueData.destroy({
        where: { value_order_id: id },
        transaction,
      });
      await order.destroy({ transaction });
    });

    return { message: "Assessment order deleted successfully" };
  }

  // =================================================================
  // 2. Assessment Scores Management (Save / Update / Submit)
  // =================================================================

  /**
   * บันทึกคะแนน Competency รองรับทั้ง SELF, HEAD และ AGREEMENT
   */
  static async saveScores(
    paramsOrOrderId: SaveScoresParams | unknown,
    itemsInput?: unknown,
    userIdInput?: unknown,
    headIdInput?: number,
    modeInput?: AssessmentMode | string,
  ) {
    const {
      orderId,
      items,
      itemGroup,
      userId,
      headId,
      mode,
      development_plans,
      signature,
      clientIp,
    } = this.parseSaveParams(
      paramsOrOrderId,
      itemsInput,
      userIdInput,
      headIdInput,
      modeInput,
    );

    // 🔀 กระจายตาม Mode การประเมิน
    switch (mode) {
      case "HEAD":
        return this.saveHeadScores({
          orderId,
          items,
          item: itemGroup,
          targetUserId: userId,
          headId,
          development_plans,
          signature,
          clientIp,
        });

      case "AGREEMENT":
        return this.saveAgreementScores({
          orderId,
          items,
          item: itemGroup,
          userId,
          headId,
          development_plans,
          signature,
          clientIp,
        });

      case "ACKNOWLEDGE":
        return this.acknowledgeAssessment({
          userId: Number(userId),
          summaryId: Number(orderId),
          signature,
          clientIp,
        });

      case "SELF":
      default:
        return this.saveSelfScores({
          orderId,
          items,
          item: itemGroup,
          userId,
        });
    }
  }

  /**
   * บันทึกคะแนนการประเมินตนเอง (Self Assessment)
   */
  static async saveSelfScores({
    orderId,
    items,
    item,
    userId,
  }: SaveSelfScoresParams) {
    return this.persistScores({
      orderIdInput: orderId,
      items,
      multiTypeItems: item,
      targetUserIdInput: userId,
      isHead: false,
      mode: "SELF",
    });
  }

  /**
   * บันทึกคะแนนโดยหัวหน้างาน (Head Assessment)
   * 1. บันทึกคะแนน KPI และ Competency (head_value, head_actual_value) ลงในตาราง ValueOrders & ValueData
   * 2. คำนวณสรุปผลคะแนน KPI (70%) และ Competency (30%) พร้อมเกณฑ์ระดับคะแนนลงตาราง assessment_summaries
   * 3. บันทึกแผนพัฒนาตนเอง (assessment_development_plans)
   * 4. บันทึกลายเซ็นผู้ประเมิน/หัวหน้างาน (assessment_signatures, signer_type_id: 2)
   */
  static async saveHeadScores({
    orderId,
    items,
    item,
    targetUserId,
    headId,
    development_plans,
    signature,
    clientIp,
  }: SaveHeadScoresParams) {
    // 1. บันทึกคะแนนหัวหน้างานลง ValueOrders & ValueData
    const scoreResults = await this.persistScores({
      orderIdInput: orderId,
      items,
      multiTypeItems: item,
      targetUserIdInput: targetUserId,
      headId,
      isHead: true,
      mode: "HEAD",
    });

    const parsedUserId = AssessmentHelper.parsePositiveId(targetUserId, "targetUserId");
    const parsedHeadId = headId ? Number(headId) : 0;
    const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

    await db.sequelize.transaction(async (transaction: any) => {
      // 2. ดึงคะแนน ValueOrders ทั้ง KPI (type 1) และ Competency (type 2) เพื่อสรุปผล
      const orders = await db.ValueOrders.findAll({
        where: { user_id: parsedUserId, round, year },
        transaction,
      });

      const kpiOrder = orders.find((o: any) => Number(o.type_order_id) === 1);
      const competencyOrder = orders.find((o: any) => Number(o.type_order_id) === 2);

      const kpiScore = kpiOrder ? Number(kpiOrder.total_value || 0) : 0;
      const competencyScore = competencyOrder ? Number(competencyOrder.total_value || 0) : 0;

      const kpiWeight = 70.0;
      const competencyWeight = 30.0;

      const kpiWeightedScore = Number((kpiScore * (kpiWeight / 100)).toFixed(2));
      const competencyWeightedScore = Number((competencyScore * (competencyWeight / 100)).toFixed(2));
      const totalScore = Number((kpiWeightedScore + competencyWeightedScore).toFixed(2));

      // คำนวณเกณฑ์ระดับคะแนน (grade_level: 1 = ดีเด่น, 2 = ดีมาก, 3 = ดี, 4 = พอใช้, 5 = ต้องปรับปรุง)
      let gradeLevel = 5;
      if (totalScore >= 90) gradeLevel = 1;
      else if (totalScore >= 80) gradeLevel = 2;
      else if (totalScore >= 70) gradeLevel = 3;
      else if (totalScore >= 60) gradeLevel = 4;

      // 3. บันทึก/อัปเดตลงตาราง assessment_summaries
      let summaryRecord = await db.AssessmentSummaries.findOne({
        where: { user_id: parsedUserId, round, year },
        transaction,
      });

      // หา funcunit_id ของผู้รับการประเมิน (ไม่ส่ง transaction ของ db.sequelize ข้าม connection)
      let targetFuncUnitId: number | null = null;
      try {
        const activeSlot = await dbuser.SlotSetupFuncunit.findOne({
          where: { userid: parsedUserId, active: "Y" },
        });

        if (activeSlot && activeSlot.FuncUnitID) {
          targetFuncUnitId = Number(activeSlot.FuncUnitID);
        } else {
          const personUser = await dbppk.AppUser.findOne({
            where: { userid: parsedUserId },
            attributes: ["userid", "personid"],
            include: [
              {
                model: dbppk.AppPerson,
                as: "Person",
                attributes: ["id", "FuncUnitID"],
              },
            ],
          });

          if (personUser?.Person?.FuncUnitID) {
            targetFuncUnitId = Number(personUser.Person.FuncUnitID);
          } else if (summaryRecord?.funcunit_id) {
            targetFuncUnitId = Number(summaryRecord.funcunit_id);
          }
        }
      } catch (slotErr) {
        console.warn("Could not retrieve funcunit_id for user:", slotErr);
        if (summaryRecord?.funcunit_id) {
          targetFuncUnitId = Number(summaryRecord.funcunit_id);
        }
      }

      const summaryData = {
        user_id: parsedUserId,
        head_id: parsedHeadId || (summaryRecord ? summaryRecord.head_id : 0),
        funcunit_id: targetFuncUnitId,
        round,
        year,
        kpi_score: kpiScore,
        kpi_weight: kpiWeight,
        kpi_weighted_score: kpiWeightedScore,
        competency_score: competencyScore,
        competency_weight: competencyWeight,
        competency_weighted_score: competencyWeightedScore,
        total_score: totalScore,
        grade_level: gradeLevel,
        evaluator_status: 1, // 1 = หัวหน้าแจ้งผลแล้ว
        status: 2, // 2 = รอผู้รับการประเมินลงนามรับทราบ
      };

      if (summaryRecord) {
        await summaryRecord.update(summaryData, { transaction });
      } else {
        summaryRecord = await db.AssessmentSummaries.create(summaryData, {
          transaction,
        });
      }

      const summaryId = summaryRecord.id;

      // 4. บันทึกแผนพัฒนาตนเอง (assessment_development_plans)
      if (Array.isArray(development_plans) && development_plans.length > 0) {
        await db.AssessmentDevelopmentPlans.destroy({
          where: { summary_id: summaryId },
          transaction,
        });

        const plansToInsert = (development_plans as any[]).map(
          (plan: any, idx: number) => ({
            summary_id: summaryId,
            need_development: plan.need_development || "",
            development_method: plan.development_method || "",
            development_period: plan.development_period || "",
            sort_order: String(plan.sort_order || idx + 1),
          }),
        );

        await db.AssessmentDevelopmentPlans.bulkCreate(plansToInsert, {
          transaction,
        });
      }

      // 5. บันทึกลายเซ็นหัวหน้า/ผู้ประเมิน (assessment_signatures: signer_type_id: 2)
      if (signature) {
        const sigObj = signature as any;
        const signatureId = sigObj.signature_id || sigObj.id;

        if (signatureId) {
          // ลบลายเซ็นหัวหน้าเดิมของ summary นี้ เพื่ออัปเดตลายเซ็นล่าสุด
          await db.AssessmentSignatures.destroy({
            where: {
              summary_id: summaryId,
              signer_type_id: 2,
            },
            transaction,
          });

          await db.AssessmentSignatures.create(
            {
              summary_id: summaryId,
              signer_id: sigObj.signer_id || parsedHeadId || parsedUserId,
              signer_type_id: 2, // 2 = หัวหน้า/ผู้ประเมิน
              signer_name: sigObj.signer_name || "",
              signer_position: sigObj.signer_position || null,
              signature_id: signatureId,
              comment: sigObj.comment || null,
              signed_at: new Date(),
              ip_address: sigObj.ip_address || clientIp || "127.0.0.1",
            },
            { transaction },
          );
        }
      }
    });

    return scoreResults;
  }

  /**
   * บันทึกคะแนนข้อตกลงร่วมกัน (Agreement Assessment)
   * คำนวณสรุปผลคะแนน KPI, Competency และเกณฑ์ลงใน assessment_summaries โดยอัตโนมัติที่ Backend
   * พร้อมบันทึกแผนพัฒนาตนเอง (assessment_development_plans) และลายเซ็น (assessment_signatures)
   */
  static async saveAgreementScores({
    orderId,
    items,
    item,
    userId,
    headId,
    development_plans,
    signature,
    clientIp,
  }: SaveAgreementScoresParams) {
    // 1. บันทึกคะแนนลง ValueOrders & ValueData (KPI + Competency)
    const scoreResults = await this.persistScores({
      orderIdInput: orderId,
      items,
      multiTypeItems: item,
      targetUserIdInput: userId,
      headId,
      isHead: true,
      mode: "AGREEMENT",
    });

    const targetUserId = AssessmentHelper.parsePositiveId(userId, "userId");
    const targetHeadId = headId ? Number(headId) : 0;
    const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

    await db.sequelize.transaction(async (transaction: any) => {
      // 2. ดึงคะแนน ValueOrders ทั้ง KPI (type 1) และ Competency (type 2) เพื่อคำนวณอัตโนมัติ
      const orders = await db.ValueOrders.findAll({
        where: { user_id: targetUserId, round, year },
        transaction,
      });

      const kpiOrder = orders.find((o: any) => Number(o.type_order_id) === 1);
      const competencyOrder = orders.find(
        (o: any) => Number(o.type_order_id) === 2,
      );

      const kpiScore = kpiOrder ? Number(kpiOrder.total_value || 0) : 0;
      const competencyScore = competencyOrder
        ? Number(competencyOrder.total_value || 0)
        : 0;

      const kpiWeight = 70.0;
      const competencyWeight = 30.0;

      const kpiWeightedScore = Number(
        (kpiScore * (kpiWeight / 100)).toFixed(2),
      );
      const competencyWeightedScore = Number(
        (competencyScore * (competencyWeight / 100)).toFixed(2),
      );
      const totalScore = Number(
        (kpiWeightedScore + competencyWeightedScore).toFixed(2),
      );

      // คำนวณเกณฑ์ระดับคะแนน (grade_level: 1 = ดีเด่น, 2 = ดีมาก, 3 = ดี, 4 = พอใช้, 5 = ต้องปรับปรุง)
      let gradeLevel = 5;
      if (totalScore >= 90) gradeLevel = 1;
      else if (totalScore >= 80) gradeLevel = 2;
      else if (totalScore >= 70) gradeLevel = 3;
      else if (totalScore >= 60) gradeLevel = 4;

      // 3. บันทึก/อัปเดตลงตาราง assessment_summaries โดยอัตโนมัติที่ Backend
      let summaryRecord = await db.AssessmentSummaries.findOne({
        where: { user_id: targetUserId, round, year },
        transaction,
      });

      // 3.1 หา funcunit_id ของผู้รับการประเมิน (ไม่ส่ง transaction ของ db.sequelize ข้าม connection)
      let targetFuncUnitId: number | null = null;
      try {
        const activeSlot = await dbuser.SlotSetupFuncunit.findOne({
          where: { userid: targetUserId, active: "Y" },
        });

        if (activeSlot && activeSlot.FuncUnitID) {
          targetFuncUnitId = Number(activeSlot.FuncUnitID);
        } else {
          const personUser = await dbppk.AppUser.findOne({
            where: { userid: targetUserId },
            attributes: ["userid", "personid"],
            include: [
              {
                model: dbppk.AppPerson,
                as: "Person",
                attributes: ["id", "FuncUnitID"],
              },
            ],
          });

          if (personUser?.Person?.FuncUnitID) {
            targetFuncUnitId = Number(personUser.Person.FuncUnitID);
          } else if (summaryRecord?.funcunit_id) {
            targetFuncUnitId = Number(summaryRecord.funcunit_id);
          }
        }
      } catch (slotErr) {
        console.warn("Could not retrieve funcunit_id for target user:", slotErr);
        if (summaryRecord?.funcunit_id) {
          targetFuncUnitId = Number(summaryRecord.funcunit_id);
        }
      }

      const summaryData = {
        user_id: targetUserId,
        head_id: targetHeadId || (summaryRecord ? summaryRecord.head_id : 0),
        funcunit_id: targetFuncUnitId,
        round,
        year,
        kpi_score: kpiScore,
        kpi_weight: kpiWeight,
        kpi_weighted_score: kpiWeightedScore,
        competency_score: competencyScore,
        competency_weight: competencyWeight,
        competency_weighted_score: competencyWeightedScore,
        total_score: totalScore,
        grade_level: gradeLevel,
        evaluator_status: 2,
        status: 3,
      };

      if (summaryRecord) {
        await summaryRecord.update(summaryData, { transaction });
      } else {
        summaryRecord = await db.AssessmentSummaries.create(summaryData, {
          transaction,
        });
      }

      const summaryId = summaryRecord.id;

      // 4. บันทึกลงตาราง assessment_development_plans (ลบของเดิมที่มี แล้วบันทึกรายการใหม่จาก Array)
      if (Array.isArray(development_plans) && development_plans.length > 0) {
        await db.AssessmentDevelopmentPlans.destroy({
          where: { summary_id: summaryId },
          transaction,
        });

        const plansToInsert = (development_plans as any[]).map(
          (plan: any, idx: number) => ({
            summary_id: summaryId,
            need_development: plan.need_development || "",
            development_method: plan.development_method || "",
            development_period: plan.development_period || "",
            sort_order: String(plan.sort_order || idx + 1),
          }),
        );

        await db.AssessmentDevelopmentPlans.bulkCreate(plansToInsert, {
          transaction,
        });
      }

      // 5. บันทึกลงตาราง assessment_signatures (signed_at สร้างอัตโนมัติที่ Backend ด้วย new Date())
      if (signature) {
        const sigObj = signature as any;
        const signatureId = sigObj.signature_id || sigObj.id;

        if (signatureId) {
          await db.AssessmentSignatures.create(
            {
              summary_id: summaryId,
              signer_id: sigObj.signer_id || targetHeadId || targetUserId,
              signer_type_id: sigObj.signer_type_id || 2, // 2 = หัวหน้า/ผู้ประเมิน
              signer_name: sigObj.signer_name || "",
              signer_position: sigObj.signer_position || null,
              signature_id: signatureId,
              comment: sigObj.comment || null,
              signed_at: new Date(), // 💡 Auto-generated at Backend!
              ip_address: sigObj.ip_address || clientIp || "127.0.0.1",
            },
            { transaction },
          );
        }
      }
    });

    return scoreResults;
  }

  /**
   * ลูกน้องลงชื่อรับทราบผลการประเมิน (Acknowledge Assessment)
   * บันทึกลายเซ็นลูกน้อง (signer_type_id: 1) และเปลี่ยนสถานะเป็น COMPLETED
   */
  static async acknowledgeAssessment({
    userId,
    summaryId,
    signature,
    clientIp,
  }: {
    userId: number;
    summaryId?: number;
    signature?: unknown;
    clientIp?: string;
  }) {
    const targetUserId = AssessmentHelper.parsePositiveId(userId, "userId");
    const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

    return db.sequelize.transaction(async (transaction: any) => {
      let summary = summaryId
        ? await db.AssessmentSummaries.findByPk(summaryId, { transaction })
        : null;

      // Fallback 1: ค้นหาจากรอบ/ปีปัจจุบันของผู้รับการประเมิน
      if (!summary) {
        summary = await db.AssessmentSummaries.findOne({
          where: { user_id: targetUserId, round, year },
          transaction,
        });
      }

      // Fallback 2: ถ้า summaryId ที่ส่งมาอาจเป็น ValueOrders ID
      if (!summary && summaryId) {
        const orderRecord = await db.ValueOrders.findByPk(summaryId, {
          transaction,
        });
        if (orderRecord && orderRecord.user_id) {
          summary = await db.AssessmentSummaries.findOne({
            where: {
              user_id: Number(orderRecord.user_id),
              round: Number(orderRecord.round),
              year: Number(orderRecord.year),
            },
            transaction,
          });
        }
      }

      // Fallback 3: ค้นหารายการ summary ล่าสุดของผู้ใช้
      if (!summary) {
        summary = await db.AssessmentSummaries.findOne({
          where: { user_id: targetUserId },
          order: [["id", "DESC"]],
          transaction,
        });
      }

      // Fallback 4: ถ้ายังไม่พบ summary เลย (เช่น เกิดจากข้อมูลที่หัวหน้าประเมินไว้ก่อนอัปเดตระบบ)
      // ดึง ValueOrders มาคำนวณและสร้าง AssessmentSummaries ให้โดยอัตโนมัติ ไม่ให้ 404
      if (!summary) {
        const orders = await db.ValueOrders.findAll({
          where: { user_id: targetUserId, round, year },
          transaction,
        });

        const kpiOrder = orders.find((o: any) => Number(o.type_order_id) === 1);
        const competencyOrder = orders.find((o: any) => Number(o.type_order_id) === 2);

        const kpiScore = kpiOrder ? Number(kpiOrder.total_value || 0) : 0;
        const competencyScore = competencyOrder ? Number(competencyOrder.total_value || 0) : 0;
        const kpiWeightedScore = Number((kpiScore * 0.7).toFixed(2));
        const competencyWeightedScore = Number((competencyScore * 0.3).toFixed(2));
        const totalScore = Number((kpiWeightedScore + competencyWeightedScore).toFixed(2));

        let gradeLevel = 5;
        if (totalScore >= 90) gradeLevel = 1;
        else if (totalScore >= 80) gradeLevel = 2;
        else if (totalScore >= 70) gradeLevel = 3;
        else if (totalScore >= 60) gradeLevel = 4;

        const headIdFromOrder = kpiOrder?.head_id || competencyOrder?.head_id || 0;

        summary = await db.AssessmentSummaries.create(
          {
            user_id: targetUserId,
            head_id: headIdFromOrder,
            round,
            year,
            kpi_score: kpiScore,
            kpi_weight: 70.0,
            kpi_weighted_score: kpiWeightedScore,
            competency_score: competencyScore,
            competency_weight: 30.0,
            competency_weighted_score: competencyWeightedScore,
            total_score: totalScore,
            grade_level: gradeLevel,
            evaluator_status: 1,
            status: 2,
          },
          { transaction },
        );
      }

      const activeSummaryId = summary.id;

      if (signature) {
        const sigObj = signature as any;
        const signatureId = sigObj.signature_id || sigObj.id;

        if (signatureId) {
          await db.AssessmentSignatures.destroy({
            where: {
              summary_id: activeSummaryId,
              signer_type_id: 1, // 1 = ผู้รับการประเมิน
            },
            transaction,
          });

          await db.AssessmentSignatures.create(
            {
              summary_id: activeSummaryId,
              signer_id: targetUserId,
              signer_type_id: 1, // 1 = ผู้รับการประเมิน
              signer_name: sigObj.signer_name || "",
              signer_position: sigObj.signer_position || null,
              signature_id: signatureId,
              comment: sigObj.comment || "รับทราบผลการประเมินเรียบร้อยแล้ว",
              signed_at: new Date(),
              ip_address: sigObj.ip_address || clientIp || "127.0.0.1",
            },
            { transaction },
          );
        }
      }

      // ปรับสถานะ summary เป็น 1 (เสร็จสมบูรณ์) และ evaluator_status = 2 (รับทราบแล้ว)
      await summary.update(
        {
          status: 1,
          evaluator_status: 2,
        },
        { transaction },
      );

      // ปรับคำสั่ง ValueOrders ให้เสร็จสมบูรณ์
      await db.ValueOrders.update(
        { status: "COMPLETED" },
        {
          where: { user_id: targetUserId, round, year },
          transaction,
        },
      );

      return {
        message: "Acknowledged assessment successfully",
        summary_id: activeSummaryId,
        status: "COMPLETED",
      };
    });
  }
  static async updateScoreItem(id: number, data: unknown) {
    AssessmentHelper.assertPositiveId(id, "scoreId");
    const payload = AssessmentHelper.scorePayload(data);

    return db.sequelize.transaction(async (transaction: any) => {
      const score = await db.ValueData.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!score) throw new ApiError("Score item not found", 404);

      if (score.value_order_id) {
        const order = await db.ValueOrders.findByPk(score.value_order_id, {
          transaction,
        });
        if (order?.status === "COMPLETED") {
          throw new ApiError(
            "This competency assessment has already been completed and cannot be changed",
            409,
          );
        }
      }

      const isSavingSubmitValue = "submit_value" in payload;
      if (!isSavingSubmitValue) {
        AssessmentHelper.assertEditable(score);
      }
      return score.update(payload, { transaction });
    });
  }

  /**
   * ยืนยันคะแนนสุดท้ายรายข้อ (Final submit_value)
   */
  static async submitScoreItem(id: number, submitValue: unknown) {
    AssessmentHelper.assertPositiveId(id, "scoreId");
    const finalScore = parseScore(submitValue, "submit_value", 127);

    return db.sequelize.transaction(async (transaction: any) => {
      const score = await db.ValueData.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!score) throw new ApiError("Score item not found", 404);

      if (score.value_order_id) {
        const order = await db.ValueOrders.findByPk(score.value_order_id, {
          transaction,
        });
        if (order?.status === "COMPLETED") {
          throw new ApiError(
            "This competency assessment has already been completed and cannot be changed",
            409,
          );
        }
      }

      if (score.user_value == null || score.head_value == null) {
        throw new ApiError(
          "Both user_value and head_value are required before submitting the final score",
        );
      }

      await score.update({ submit_value: finalScore }, { transaction });

      // ถ้าทุกข้อของ order นี้มี submit_value ครบแล้ว ให้เปลี่ยนสถานะ order เป็น COMPLETED
      if (score.value_order_id) {
        await this.syncOrderCompletion(score.value_order_id, transaction);
      }

      return score;
    });
  }

  // =================================================================
  // 3. Summary & Sheet Reports
  // =================================================================

  static async getScoreById(id: number) {
    AssessmentHelper.assertPositiveId(id, "id");
    const score = await db.ValueData.findByPk(id);
    if (!score) throw new ApiError("Competency score not found", 404);
    return score;
  }

  static async getValueDataByOrderId(orderId: number) {
    AssessmentHelper.assertPositiveId(orderId, "orderId");
    await AssessmentHelper.ensureOrder(orderId);
    return db.ValueData.findAll({
      where: { value_order_id: orderId },
      order: [["quest", "ASC"]],
    });
  }

  static async getAssessmentSummary(orderId: number) {
    AssessmentHelper.assertPositiveId(orderId, "orderId");
    const order = await AssessmentHelper.ensureOrder(orderId);

    const [competencyScores, kpiAssessments] = await Promise.all([
      db.ValueData.findAll({
        where: { value_order_id: orderId },
        include: [{ model: db.Competencies, as: "quest_competency" }],
        order: [["quest", "ASC"]],
      }),
      db.KpiAssessmentValues
        ? db.KpiAssessmentValues.findAll({
            where: { value_order_id: orderId },
            include: [{ model: db.KpiIndicators, as: "kpi_indicator" }],
            order: [["id", "ASC"]],
          })
        : Promise.resolve([]),
    ]);

    return {
      order,
      competency_scores: competencyScores,
      kpi_assessments: kpiAssessments,
    };
  }

  static async getAssessmentSheet(orderId: number) {
    AssessmentHelper.assertPositiveId(orderId, "orderId");
    const order = await AssessmentHelper.ensureOrder(orderId);

    const categories = await db.CompetencyCategories.findAll({
      include: [
        {
          model: db.Competencies,
          as: "competencies",
          include: [
            { model: db.Behavior, as: "behaviors" },
            {
              model: db.ValueData,
              as: "value_data_quests",
              where: { value_order_id: orderId },
              required: false,
            },
          ],
        },
      ],
      order: [
        ["id", "ASC"],
        [{ model: db.Competencies, as: "competencies" }, "id", "ASC"],
      ],
    });

    return {
      value_order: order,
      categories: AssessmentHelper.formatSheetCategories(categories),
    };
  }

  // =================================================================
  // 4. Private Core Helpers (Clean Code & Business Orchestration)
  // =================================================================

  /**
   * ทำความสะอาดและแปลง Input Params ให้เป็นรูปแบบมาตรฐาน
   */
  private static parseSaveParams(
    paramsOrOrderId: SaveScoresParams | unknown,
    itemsInput?: unknown,
    userIdInput?: unknown,
    headIdInput?: number,
    modeInput?: AssessmentMode | string,
  ) {
    let orderId: unknown;
    let items: unknown;
    let itemGroup: unknown;
    let userId: unknown;
    let headId: number | undefined;
    let rawMode: unknown;
    let isHead = false;
    let development_plans: unknown;
    let signature: unknown;
    let clientIp: string | undefined;

    if (paramsOrOrderId && typeof paramsOrOrderId === "object") {
      const opts = paramsOrOrderId as SaveScoresParams;
      orderId = opts.orderId;
      items = opts.items;
      itemGroup = (opts as any).item;
      userId = opts.userId;
      headId = opts.headId;
      rawMode = opts.mode;
      isHead = opts.isHead === true;
      development_plans = opts.development_plans;
      signature = opts.signature;
      clientIp = opts.clientIp;
    } else {
      orderId = paramsOrOrderId;
      items = itemsInput;
      userId = userIdInput;
      headId = headIdInput;
      rawMode = modeInput;
    }

    const normalizedMode =
      typeof rawMode === "string" ? rawMode.trim().toUpperCase() : "";

    const mode: AssessmentMode =
      isHead || normalizedMode === "HEAD"
        ? "HEAD"
        : normalizedMode === "AGREEMENT"
          ? "AGREEMENT"
          : normalizedMode === "ACKNOWLEDGE"
            ? "ACKNOWLEDGE"
            : "SELF";

    return {
      orderId,
      items,
      itemGroup,
      userId,
      headId,
      mode,
      development_plans,
      signature,
      clientIp,
    };
  }

  /**
   * ควบคุม Transaction และรันขั้นตอนการบันทึกคะแนนทั้งหมด
   * รองรับทั้งการบันทึกแบบเดี่ยว และแบบพร้อมกันหลายกลุ่มตาม type_order_id (1 = KPI, 2 = Competency)
   */
  private static async persistScores({
    orderIdInput,
    items,
    multiTypeItems,
    targetUserIdInput,
    headId,
    isHead,
    mode,
  }: {
    orderIdInput?: unknown;
    items?: unknown;
    multiTypeItems?: unknown;
    targetUserIdInput?: unknown;
    headId?: number;
    isHead: boolean;
    mode?: AssessmentMode;
  }) {
    // ตรวจสอบว่าส่งข้อมูลแบบหลายกลุ่ม (item: [{ type_order_id, value }]) มาหรือไม่
    const isMultiType =
      Array.isArray(multiTypeItems) &&
      multiTypeItems.length > 0 &&
      multiTypeItems.some(
        (g: any) => g && ("type_order_id" in g || "value" in g),
      );

    return db.sequelize.transaction(async (transaction: any) => {
      if (isMultiType) {
        const groupResults = [];

        for (const group of multiTypeItems as any[]) {
          const typeOrderId = Number(group.type_order_id) || 2;
          const rawGroupItems = group.value ?? group.items ?? [];
          const validatedItems =
            AssessmentHelper.parseScoreItems(rawGroupItems);

          // 1. ค้นหาหรือสร้าง Order ตาม type_order_id
          const order = await this.resolveOrderForScores({
            transaction,
            orderIdInput: group.orderId,
            targetUserIdInput,
            headId,
            isHead,
            typeOrderId,
          });

          if (order && order.status === "COMPLETED" && mode !== "AGREEMENT") {
            throw new ApiError(
              `Assessment order (type ${typeOrderId}) has already been completed and cannot be changed`,
              409,
            );
          }

          // 2. บันทึกคะแนนลง ValueData
          const results = await this.upsertScoreItems({
            transaction,
            orderId: order.id,
            validatedItems,
            typeOrderId,
            isAgreement: mode === "AGREEMENT",
          });

          // 3. ปรับสถานะ Order และคำนวณ total_value
          await this.syncOrderStatus({
            transaction,
            order,
            typeOrderId,
          });

          groupResults.push({
            type_order_id: typeOrderId,
            orderId: order.id,
            status: order.status,
            total_value: order.total_value,
            scores: results,
          });
        }

        return groupResults;
      }

      // กรณีส่งแบบเดิม (Single type - ค่าเริ่มต้น Competency type_order_id: 2)
      const validatedItems = AssessmentHelper.parseScoreItems(items);
      const defaultTypeOrderId = 2;

      const order = await this.resolveOrderForScores({
        transaction,
        orderIdInput,
        targetUserIdInput,
        headId,
        isHead,
        typeOrderId: defaultTypeOrderId,
      });

      if (order && order.status === "COMPLETED" && mode !== "AGREEMENT") {
        throw new ApiError(
          "This competency assessment has already been completed and cannot be changed",
          409,
        );
      }

      const results = await this.upsertScoreItems({
        transaction,
        orderId: order.id,
        validatedItems,
        typeOrderId: defaultTypeOrderId,
        isAgreement: mode === "AGREEMENT",
      });

      await this.syncOrderStatus({
        transaction,
        order,
        typeOrderId: defaultTypeOrderId,
      });

      return results;
    });
  }

  /**
   * ค้นหาหรือสร้าง ValueOrders พร้อมล็อกแถวใน Transaction โดยแยกตาม type_order_id
   */
  private static async resolveOrderForScores({
    transaction,
    orderIdInput,
    targetUserIdInput,
    headId,
    isHead,
    typeOrderId,
  }: {
    transaction: any;
    orderIdInput?: unknown;
    targetUserIdInput?: unknown;
    headId?: number;
    isHead: boolean;
    typeOrderId?: number;
  }) {
    // กรณีที่ 1: ส่ง orderId มาโดยตรง
    if (
      orderIdInput !== undefined &&
      orderIdInput !== null &&
      orderIdInput !== ""
    ) {
      const orderId = AssessmentHelper.parsePositiveId(orderIdInput, "orderId");
      const order = await AssessmentHelper.ensureOrder(orderId, transaction);

      if (isHead && headId && order.head_id !== headId) {
        await order.update({ head_id: headId }, { transaction });
      }
      return order;
    }

    // กรณีที่ 2: ส่ง targetUserId มา ค้นหาตามรอบ/ปีปัจจุบัน และ type_order_id
    if (
      targetUserIdInput !== undefined &&
      targetUserIdInput !== null &&
      targetUserIdInput !== ""
    ) {
      const userId = AssessmentHelper.parsePositiveId(
        targetUserIdInput,
        isHead ? "targetUserId (ลูกน้อง)" : "userId",
      );
      const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

      const whereClause: any = { user_id: userId, round, year };
      if (typeOrderId !== undefined && typeOrderId !== null) {
        whereClause.type_order_id = typeOrderId;
      }

      let order = await db.ValueOrders.findOne({
        where: whereClause,
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        order = await db.ValueOrders.create(
          {
            user_id: userId,
            head_id: isHead ? headId : null,
            round,
            year,
            status: "PENDING",
            type_order_id: typeOrderId ?? null,
            total_value: 0,
          },
          { transaction },
        );
      } else if (isHead && headId && order.head_id !== headId) {
        await order.update({ head_id: headId }, { transaction });
      }

      return order;
    }

    throw new ApiError(
      isHead
        ? "กรุณาระบุ orderId หรือ user_id ของผู้รับการประเมิน"
        : "Either orderId or userId must be provided",
      400,
    );
  }

  /**
   * วนลูปบันทึกหรืออัปเดตคะแนนลงใน ValueData
   */
  private static async upsertScoreItems({
    transaction,
    orderId,
    validatedItems,
    typeOrderId = 2,
    isAgreement = false,
  }: {
    transaction: any;
    orderId: number;
    validatedItems: Array<{ quest: number; scores: Record<string, unknown> }>;
    typeOrderId?: number;
    isAgreement?: boolean;
  }) {
    const results = [];

    for (const { quest, scores } of validatedItems) {
      if (typeOrderId === 1) {
        let indicatorId = quest;
        let currentKpiText = "";
        let scoreLevels = await db.KpiScoreLevels.findAll({
          where: { kpi_indicator_id: indicatorId },
          transaction,
        });

        if (scoreLevels.length === 0) {
          const scoreLevel = await db.KpiScoreLevels.findByPk(quest, {
            transaction,
          });
          if (scoreLevel) {
            indicatorId = scoreLevel.kpi_indicator_id;
            currentKpiText = scoreLevel.criteria_text || "";
            scoreLevels = await db.KpiScoreLevels.findAll({
              where: { kpi_indicator_id: indicatorId },
              transaction,
            });
          } else {
            const indicator = await db.KpiIndicators.findByPk(quest, {
              transaction,
            });
            if (!indicator) {
              throw new ApiError(`KPI item ${quest} not found`, 404);
            }
            currentKpiText = indicator.name || "";
          }
        }

        // 🎯 Auto Evaluate Score from Actual Value using kpi_score_levels (Server-side validation)
        const actualVal = scores.actual_value as number | undefined;
        const userActual = scores.user_actual_value as number | undefined;
        const headActual = scores.head_actual_value as number | undefined;
        const submitActual = scores.submit_actual_value as number | undefined;

        if (userActual !== undefined && userActual !== null) {
          const evalScore = AssessmentHelper.evaluateKpiScore(
            userActual,
            scoreLevels,
            currentKpiText,
            quest,
          );
          if (evalScore !== null) {
            scores.user_value = evalScore;
          }
        } else if (
          actualVal !== undefined &&
          actualVal !== null &&
          !isAgreement &&
          !("head_value" in scores) &&
          !("head_actual_value" in scores)
        ) {
          scores.user_actual_value = actualVal;
          const evalScore = AssessmentHelper.evaluateKpiScore(
            actualVal,
            scoreLevels,
            currentKpiText,
            quest,
          );
          if (evalScore !== null) {
            scores.user_value = evalScore;
          }
        }

        if (headActual !== undefined && headActual !== null) {
          const evalScore = AssessmentHelper.evaluateKpiScore(
            headActual,
            scoreLevels,
            currentKpiText,
            quest,
          );
          if (evalScore !== null) {
            scores.head_value = evalScore;
          }
        } else if (
          actualVal !== undefined &&
          actualVal !== null &&
          ("head_value" in scores || "head_actual_value" in scores)
        ) {
          scores.head_actual_value = actualVal;
          const evalScore = AssessmentHelper.evaluateKpiScore(
            actualVal,
            scoreLevels,
            currentKpiText,
            quest,
          );
          if (evalScore !== null) {
            scores.head_value = evalScore;
          }
        }

        if (submitActual !== undefined && submitActual !== null) {
          const evalScore = AssessmentHelper.evaluateKpiScore(
            submitActual,
            scoreLevels,
            currentKpiText,
            quest,
          );
          if (evalScore !== null) {
            scores.submit_value = evalScore;
          }
        } else if (actualVal !== undefined && actualVal !== null && isAgreement) {
          scores.submit_actual_value = actualVal;
          const evalScore = AssessmentHelper.evaluateKpiScore(
            actualVal,
            scoreLevels,
            currentKpiText,
            quest,
          );
          if (evalScore !== null) {
            scores.submit_value = evalScore;
          }
        }

        delete scores.actual_value;
      } else {
        const competency = await db.Competencies.findByPk(quest, {
          transaction,
        });
        if (!competency) {
          throw new ApiError(`Competency ${quest} not found`, 404);
        }

        // รองรับการส่ง actual_value ของ Competency และ mapping 0-100 สู่ระดับ 1-5
        const actualVal = scores.actual_value as number | undefined;
        if (actualVal !== undefined && actualVal !== null) {
          if (!isAgreement && !("head_value" in scores) && !("head_actual_value" in scores)) {
            if (!("user_actual_value" in scores)) scores.user_actual_value = actualVal;
          } else if ("head_value" in scores || "head_actual_value" in scores) {
            if (!("head_actual_value" in scores)) scores.head_actual_value = actualVal;
          } else if (isAgreement) {
            if (!("submit_actual_value" in scores)) scores.submit_actual_value = actualVal;
          }
        }

        // Auto map actual score (0-100) to level score (1-5) if needed
        const uActual = scores.user_actual_value as number | undefined;
        if (uActual !== undefined && uActual !== null) {
          if (!scores.user_value || Number(scores.user_value) > 5) {
            scores.user_value = AssessmentHelper.evaluateCompetencyScore(uActual);
          }
        }
        const hActual = scores.head_actual_value as number | undefined;
        if (hActual !== undefined && hActual !== null) {
          if (!scores.head_value || Number(scores.head_value) > 5) {
            scores.head_value = AssessmentHelper.evaluateCompetencyScore(hActual);
          }
        }
        const sActual = scores.submit_actual_value as number | undefined;
        if (sActual !== undefined && sActual !== null) {
          if (!scores.submit_value || Number(scores.submit_value) > 5) {
            scores.submit_value = AssessmentHelper.evaluateCompetencyScore(sActual);
          }
        }
        delete scores.actual_value;
      }

      const existing = await db.ValueData.findOne({
        where: { value_order_id: orderId, quest },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existing) {
        const isSavingSubmitValue = "submit_value" in scores;
        if (!isAgreement && !isSavingSubmitValue) {
          AssessmentHelper.assertEditable(existing);
        }
        results.push(await existing.update(scores, { transaction }));
      } else {
        results.push(
          await db.ValueData.create(
            { value_order_id: orderId, quest, ...scores },
            { transaction },
          ),
        );
      }
    }

    return results;
  }

  /**
   * คำนวณและปรับปรุงสถานะของ ValueOrders พร้อมคิดคะแนนรวม total_value ตามประเภท
   */
  private static async syncOrderStatus({
    transaction,
    order,
    typeOrderId,
  }: {
    transaction: any;
    order: any;
    typeOrderId?: number;
  }) {
    if (!order) return;

    const allValues = await db.ValueData.findAll({
      where: { value_order_id: order.id },
      transaction,
    });

    if (allValues.length === 0) return;

    // 🎯 1. ตรวจสอบสถานะ Order
    const isAllSubmitted = allValues.every(
      (item: any) => item.submit_value != null,
    );
    const hasUserValues = allValues.some(
      (item: any) => item.user_value != null,
    );
    const hasHeadValues = allValues.some(
      (item: any) => item.head_value != null,
    );

    let nextStatus: AssessmentStatus = "PENDING";
    if (isAllSubmitted) {
      nextStatus = "COMPLETED";
    } else if (hasUserValues && hasHeadValues) {
      nextStatus = "WAITING_AGREEMENT";
    } else if (hasUserValues) {
      nextStatus = "SELF_SUBMITTED";
    } else if (hasHeadValues) {
      nextStatus = "HEAD_SUBMITTED";
    }

    // 🎯 2. คำนวณคะแนนรวม total_value ตาม type_order_id
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const currentTypeId = typeOrderId ?? order.type_order_id ?? 2;

    if (currentTypeId === 1) {
      // 🟢 Type 1 = KPI
      const scoreLevels = await db.KpiScoreLevels.findAll({
        attributes: ["id", "kpi_indicator_id", "weight"],
        transaction,
      });

      const weightMap = new Map<number, number>(
        scoreLevels.map((lvl: any) => [
          Number(lvl.id),
          Number(lvl.weight || 0),
        ]),
      );

      const defaultWeight = allValues.length > 0 ? 100 / allValues.length : 20;

      for (const val of allValues) {
        const score = val.submit_value ?? val.head_value ?? val.user_value;
        if (score != null) {
          const kpiW = weightMap.get(Number(val.quest));
          const rawW = kpiW !== undefined && kpiW > 0 ? kpiW : defaultWeight;

          totalWeightedScore += Number(score) * rawW;
          totalWeight += rawW;
        }
      }
    } else {
      // 🟢 Type 2 = Competency
      const competencies = await db.Competencies.findAll({
        attributes: ["id", "weight", "competency_category_id"],
        include: [
          {
            model: db.CompetencyCategories,
            attributes: ["id", "name"],
            as: "category",
          },
        ],
        transaction,
      });

      const compMap = new Map<number, { weight: number; categoryName: string }>(
        competencies.map((c: any) => [
          Number(c.id),
          {
            weight: Number(c.weight || 0),
            categoryName: c.category?.name || "",
          },
        ]),
      );

      const defaultWeight = allValues.length > 0 ? 100 / allValues.length : 10;
      let g1Weighted = 0;
      let g1Weight = 0;
      let g2Weighted = 0;
      let g2Weight = 0;

      for (const val of allValues) {
        const rawAct =
          val.submit_actual_value ??
          val.head_actual_value ??
          val.user_actual_value;
        const score1To5 =
          val.submit_value ?? val.head_value ?? val.user_value;
        const score =
          rawAct != null
            ? Number(rawAct)
            : score1To5 != null
              ? Number(score1To5) <= 5
                ? Number(score1To5) * 20
                : Number(score1To5)
              : null;

        if (score != null) {
          const compInfo = compMap.get(Number(val.quest));
          const rawW =
            compInfo && compInfo.weight > 0 ? compInfo.weight : defaultWeight;
          const catName = compInfo?.categoryName || "";
          const isG1 =
            catName.includes("หลัก") ||
            catName.includes("เฉพาะตามลักษณะงาน");
          const isG2 =
            catName.includes("ร่วม") || catName.includes("เฉพาะสาขา");

          if (isG1) {
            g1Weighted += score * rawW;
            g1Weight += rawW;
          } else if (isG2) {
            g2Weighted += score * rawW;
            g2Weight += rawW;
          } else {
            totalWeightedScore += score * rawW;
            totalWeight += rawW;
          }
        }
      }

      if (g1Weight > 0 && g2Weight > 0) {
        const g1Score = g1Weighted / g1Weight;
        const g2Score = g2Weighted / g2Weight;
        totalWeightedScore = (g1Score + g2Score) / 2;
        totalWeight = 1;
      } else if (g1Weight > 0) {
        totalWeightedScore = g1Weighted / g1Weight;
        totalWeight = 1;
      } else if (g2Weight > 0) {
        totalWeightedScore = g2Weighted / g2Weight;
        totalWeight = 1;
      }
    }

    // คิดฐาน 100 คะแนน: ถ้าคะแนนเฉลี่ยเป็นฐาน 5 ให้ x 20, ถ้าเป็นฐาน 100 อยู่แล้วไม่ต้อง x 20
    const avgC = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const finalScore = avgC <= 5 ? avgC * 20 : avgC;
    const computedTotal = Number(finalScore.toFixed(2));

    const updates: any = {};
    if (order.status !== nextStatus) {
      updates.status = nextStatus;
      order.status = nextStatus;
    }
    if (computedTotal !== null && order.total_value !== computedTotal) {
      updates.total_value = computedTotal;
      order.total_value = computedTotal;
    }

    if (Object.keys(updates).length > 0) {
      await order.update(updates, { transaction });
    }
  }

  /**
   * ตรวจสอบว่ายืนยันคะแนนสุดท้ายครบทุกข้อหรือยัง ถ้าครบให้อัปเดตสถานะเป็น COMPLETED
   */
  private static async syncOrderCompletion(orderId: number, transaction: any) {
    const remainingUnsubmitted = await db.ValueData.count({
      where: {
        value_order_id: orderId,
        submit_value: null,
      },
      transaction,
    });

    if (remainingUnsubmitted === 0) {
      await db.ValueOrders.update(
        { status: "COMPLETED" },
        { where: { id: orderId }, transaction },
      );
    }
  }

  /**
   * สรุปผลคะแนนและจัดรูปแบบ Object สำหรับ checkSelfAssessment
   */
  private static calculateAssessmentSummary(
    data: any,
    userId: number,
    round: number,
    year: number,
    typeOrderId?: number,
  ) {
    const valueList = data?.value_data_list || [];

    const totalUserScore = valueList.reduce(
      (acc: number, item: any) => acc + (Number(item?.user_value) || 0),
      0,
    );
    const hasSelfAssessed = valueList.some(
      (item: any) => item?.user_value != null,
    );

    const totalHeadScore = valueList.reduce(
      (acc: number, item: any) => acc + (Number(item?.head_value) || 0),
      0,
    );
    const hasHeadAssessed = valueList.some(
      (item: any) => item?.head_value != null,
    );

    // ตรวจสอบว่าทุกข้อมี submit_value ครบถ้วนแล้วหรือไม่
    const isAllSubmitted =
      valueList.length > 0 &&
      valueList.every((item: any) => item?.submit_value != null);

    let status = (data?.status as AssessmentStatus) || "PENDING";
    if (isAllSubmitted) {
      status = "COMPLETED";
      // ถ้าใน DB ยังเป็น WAITING_AGREEMENT ให้อัปเดตเป็น COMPLETED ให้ตรงกัน
      if (data?.id && data.status !== "COMPLETED") {
        db.ValueOrders.update(
          { status: "COMPLETED" },
          { where: { id: data.id } },
        ).catch(() => {});
      }
    }

    const isHeadValue = valueList.map((item: any) => ({
      quest: item.quest,
      head_value: item.head_value,
      head_actual_value: item.head_actual_value != null ? Number(item.head_actual_value) : null,
    }));

    const isSubmitValue = valueList.map((item: any) => ({
      quest: item.quest,
      submit_value: item.submit_value,
      submit_actual_value: item.submit_actual_value != null ? Number(item.submit_actual_value) : null,
    }));

    const scores = valueList.map((item: any) => ({
      quest: item.quest,
      score: item.score ?? item.user_value,
      user_value: item.user_value,
      head_value: item.head_value,
      submit_value: item.submit_value,
      user_actual_value: item.user_actual_value != null ? Number(item.user_actual_value) : null,
      head_actual_value: item.head_actual_value != null ? Number(item.head_actual_value) : null,
      submit_actual_value: item.submit_actual_value != null ? Number(item.submit_actual_value) : null,
    }));

    const totalSubmitScore = valueList.reduce(
      (acc: number, item: any) => acc + (Number(item?.submit_value) || 0),
      0,
    );

    const resolvedTypeOrderId = data?.type_order_id ?? typeOrderId ?? null;

    const userCheck = {
      id: data?.id ?? null,
      user_id: data?.user_id ?? userId,
      head_id: data?.head_id ?? null,
      round: data?.round ?? round,
      year: data?.year ?? year,
      type_order_id: resolvedTypeOrderId,
      total_value: data?.total_value ?? 0,
      status,
      createdAt: data?.createdAt ?? null,
      total_score: isAllSubmitted ? totalSubmitScore : totalUserScore,
      total_submit_score: totalSubmitScore,
      total_user_score: totalUserScore,
      total_head_score: totalHeadScore,
      hasSelfAssessed,
      hasHeadAssessed,
    };

    return {
      type_order_id: resolvedTypeOrderId,
      orderId: data?.id ?? null,
      userCheck,
      isHeadValue,
      isSubmitValue,
      scores,
      value: scores,
      hasSelfAssessed,
      hasHeadAssessed,
    };
  }
}

export default AssessmentService;
