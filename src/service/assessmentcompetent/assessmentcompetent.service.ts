import { Op } from "sequelize";
import db from "../../models/product";
import { ApiError } from "../../utils/api-response.util";
import { parseScore } from "../../utils/score.util";
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
   * ตรวจสอบสถานะการประเมินตนเองและคะแนนภาพรวมของผู้ใช้ในรอบ/ปีปัจจุบัน
   * รองรับทั้งการระบุ typeOrderId เจาะจง (1 = KPI, 2 = Competency) หรือดึงทั้งสองประเภทพร้อมกัน
   */
  static async checkSelfAssessment(userId: number, typeOrderId?: number) {
    const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

    if (typeOrderId) {
      const data = await db.ValueOrders.findOne({
        where: { user_id: userId, round, year, type_order_id: typeOrderId },
        include: [
          {
            model: db.ValueData,
            as: "value_data_list",
          },
        ],
      });

      return this.calculateAssessmentSummary(
        data,
        userId,
        round,
        year,
        typeOrderId,
      );
    }

    // กรณีไม่ระบุ typeOrderId ให้ค้นหา orders ทั้งหมดของผู้ใช้ในรอบ/ปีนี้
    const allOrders = await db.ValueOrders.findAll({
      where: { user_id: userId, round, year },
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

    const kpiSummary = this.calculateAssessmentSummary(
      kpiOrder,
      userId,
      round,
      year,
      1,
    );
    const competencySummary = this.calculateAssessmentSummary(
      competencyOrder,
      userId,
      round,
      year,
      2,
    );

    const hasSelfAssessed =
      kpiSummary.hasSelfAssessed || competencySummary.hasSelfAssessed;
    const hasHeadAssessed =
      kpiSummary.hasHeadAssessed || competencySummary.hasHeadAssessed;

    return {
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
    const { orderId, items, itemGroup, userId, headId, mode } = this.parseSaveParams(
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
        });

      case "AGREEMENT":
        return this.saveAgreementScores({
          orderId,
          items,
          item: itemGroup,
          userId,
          headId,
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
   */
  static async saveHeadScores({
    orderId,
    items,
    item,
    targetUserId,
    headId,
  }: SaveHeadScoresParams) {
    return this.persistScores({
      orderIdInput: orderId,
      items,
      multiTypeItems: item,
      targetUserIdInput: targetUserId,
      headId,
      isHead: true,
      mode: "HEAD",
    });
  }

  /**
   * บันทึกคะแนนข้อตกลงร่วมกัน (Agreement Assessment)
   */
  static async saveAgreementScores({
    orderId,
    items,
    item,
    userId,
    headId,
  }: SaveAgreementScoresParams) {
    return this.persistScores({
      orderIdInput: orderId,
      items,
      multiTypeItems: item,
      targetUserIdInput: userId,
      headId,
      isHead: true,
      mode: "AGREEMENT",
    });
  }

  /**
   * แก้ไขคะแนนรายข้อ (เฉพาะรายการที่ยังไม่ได้ยืนยันผล submit_value หรือยังไม่ COMPLETED)
   */
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

    if (
      paramsOrOrderId &&
      typeof paramsOrOrderId === "object"
    ) {
      const opts = paramsOrOrderId as SaveScoresParams;
      orderId = opts.orderId;
      items = opts.items;
      itemGroup = (opts as any).item;
      userId = opts.userId;
      headId = opts.headId;
      rawMode = opts.mode;
      isHead = opts.isHead === true;
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
        : "SELF";

    return { orderId, items, itemGroup, userId, headId, mode };
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
      multiTypeItems.some((g: any) => g && ("type_order_id" in g || "value" in g));

    return db.sequelize.transaction(async (transaction: any) => {
      if (isMultiType) {
        const groupResults = [];

        for (const group of multiTypeItems as any[]) {
          const typeOrderId = Number(group.type_order_id) || 2;
          const rawGroupItems = group.value ?? group.items ?? [];
          const validatedItems = AssessmentHelper.parseScoreItems(rawGroupItems);

          // 1. ค้นหาหรือสร้าง Order ตาม type_order_id
          const order = await this.resolveOrderForScores({
            transaction,
            orderIdInput: group.orderId,
            targetUserIdInput,
            headId,
            isHead,
            typeOrderId,
          });

          if (order && order.status === "COMPLETED") {
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

      if (order && order.status === "COMPLETED") {
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
        const scoreLevel = await db.KpiScoreLevels.findByPk(quest, { transaction });
        if (!scoreLevel) {
          const indicator = await db.KpiIndicators.findByPk(quest, { transaction });
          if (!indicator) {
            throw new ApiError(`KPI item ${quest} not found`, 404);
          }
        }
      } else {
        const competency = await db.Competencies.findByPk(quest, { transaction });
        if (!competency) {
          throw new ApiError(`Competency ${quest} not found`, 404);
        }
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
    const hasUserValues = allValues.some((item: any) => item.user_value != null);
    const hasHeadValues = allValues.some((item: any) => item.head_value != null);

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
        scoreLevels.map((lvl: any) => [Number(lvl.id), Number(lvl.weight || 0)]),
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
        attributes: ["id", "weight"],
        transaction,
      });
      const weightMap = new Map<number, number>(
        competencies.map((c: any) => [Number(c.id), Number(c.weight || 0)]),
      );

      const defaultWeight = allValues.length > 0 ? 100 / allValues.length : 10;

      for (const val of allValues) {
        const score = val.submit_value ?? val.head_value ?? val.user_value;
        if (score != null) {
          const compW = weightMap.get(Number(val.quest));
          const rawW = compW != null && compW > 0 ? compW : defaultWeight;

          totalWeightedScore += Number(score) * rawW;
          totalWeight += rawW;
        }
      }
    }

    // คิดฐาน 100 คะแนน: (คะแนนเฉลี่ยถ่วงน้ำหนัก x 20)
    const avgC = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const computedTotal = Number((avgC * 20).toFixed(2));

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
    }));

    const isSubmitValue = valueList.map((item: any) => ({
      quest: item.quest,
      submit_value: item.submit_value,
    }));

    const scores = valueList.map((item: any) => ({
      quest: item.quest,
      score: item.score ?? item.user_value,
      user_value: item.user_value,
      head_value: item.head_value,
      submit_value: item.submit_value,
    }));

    const totalSubmitScore = valueList.reduce(
      (acc: number, item: any) => acc + (Number(item?.submit_value) || 0),
      0,
    );

    const resolvedTypeOrderId =
      data?.type_order_id ?? typeOrderId ?? null;

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
