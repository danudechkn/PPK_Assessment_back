import { Op } from "sequelize";
import db from "../../models/product";
import { ApiError } from "../../utils/api-response.util";
import { parseScore } from "../../utils/score.util";
import { AssessmentHelper } from "./helper/assessment.helper";

class AssessmentService {
  // ==========================================
  // 0. Self Assessment check by user
  // ==========================================

  static async checkSelfAssessment(userId: number) {
    const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

    const data = await db.ValueOrders.findOne({
      where: { user_id: userId, round, year },
      include: [
        {
          model: db.ValueData,
          as: "value_data_list",
        },
      ],
    });

    const valueList = data?.value_data_list || [];

    // 1. คำนวณคะแนนและสถานะฝั่งลูกน้อง (Self)
    const total_user_score = valueList.reduce(
      (acc: number, item: any) => acc + (Number(item?.user_value) || 0),
      0,
    );
    const hasSelfAssessed = valueList.some(
      (item: any) => item?.user_value != null,
    );

    // 2. คำนวณคะแนนและสถานะฝั่งหัวหน้า (Head)
    const total_head_score = valueList.reduce(
      (acc: number, item: any) => acc + (Number(item?.head_value) || 0),
      0,
    );
    const hasHeadAssessed = valueList.some(
      (item: any) => item?.head_value != null,
    );

    // 3. รายการคะแนนที่หัวหน้าเคยประเมิน
    const isHeadValue = valueList.map(
      (item: { head_value: number | string | null; quest: string | number }) => ({
        quest: item.quest,
        head_value: item.head_value,
      }),
    );

    // 4. รายการคะแนนทั้งหมด
    const scores = valueList.map((item: any) => ({
      quest: item.quest,
      user_value: item.user_value,
      head_value: item.head_value,
    }));

    const userCheck = {
      id: data?.id ?? null,
      user_id: data?.user_id ?? userId,
      head_id: data?.head_id ?? null,
      round: data?.round ?? round,
      year: data?.year ?? year,
      status: data?.status || "pending",
      createdAt: data?.createdAt ?? null,
      total_score: total_user_score,
      total_user_score,
      total_head_score,
      hasSelfAssessed,
      hasHeadAssessed,
    };

    return {
      userCheck,
      isHeadValue,
      scores,
      hasSelfAssessed,
      hasHeadAssessed,
    };
  }

  // ==========================================
  // 1. Assessment Orders Management
  // ==========================================

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

      await db.KpiAssessmentValues.destroy({
        where: { value_order_id: id },
        transaction,
      });
      await db.ValueData.destroy({
        where: { value_order_id: id },
        transaction,
      });
      await order.destroy({ transaction });
    });

    return { message: "Assessment order deleted successfully" };
  }

  // ==========================================
  // 2. Assessment Scores Management
  // ==========================================

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

  static async saveScores(
    paramsOrOrderId:
      | {
          orderId?: unknown;
          items: unknown;
          userId?: unknown;
          headId?: number;
          mode?: "SELF" | "HEAD" | string;
          isHead?: boolean;
        }
      | unknown,
    itemsInput?: unknown,
    userIdInput?: unknown,
    headIdInput?: number,
    modeInput?: "SELF" | "HEAD" | string,
  ) {
    let orderId: unknown;
    let items: unknown;
    let userId: unknown;
    let headId: number | undefined;
    let mode: "SELF" | "HEAD" = "SELF";

    if (
      paramsOrOrderId &&
      typeof paramsOrOrderId === "object" &&
      "items" in (paramsOrOrderId as Record<string, unknown>)
    ) {
      const opts = paramsOrOrderId as {
        orderId?: unknown;
        items: unknown;
        userId?: unknown;
        headId?: number;
        mode?: "SELF" | "HEAD" | string;
        isHead?: boolean;
      };
      orderId = opts.orderId;
      items = opts.items;
      userId = opts.userId;
      headId = opts.headId;
      mode =
        opts.isHead === true ||
        (typeof opts.mode === "string" &&
          opts.mode.trim().toUpperCase() === "HEAD")
          ? "HEAD"
          : "SELF";
    } else {
      orderId = paramsOrOrderId;
      items = itemsInput;
      userId = userIdInput;
      headId = headIdInput;
      mode =
        typeof modeInput === "string" &&
        modeInput.trim().toUpperCase() === "HEAD"
          ? "HEAD"
          : "SELF";
    }

    // 🔀 Switch case ตาม Mode การประเมิน
    switch (mode) {
      case "HEAD":
        return this.saveHeadScores({
          orderId,
          items,
          targetUserId: userId,
          headId,
        });

      case "SELF":
      default:
        return this.saveSelfScores({
          orderId,
          items,
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
    userId,
  }: {
    orderId?: unknown;
    items: unknown;
    userId?: unknown;
  }) {
    return this.persistScores({
      orderIdInput: orderId,
      items,
      targetUserIdInput: userId,
      isHead: false,
    });
  }

  /**
   * บันทึกคะแนนโดยหัวหน้างาน (Head Assessment)
   */
  static async saveHeadScores({
    orderId,
    items,
    targetUserId,
    headId,
  }: {
    orderId?: unknown;
    items: unknown;
    targetUserId?: unknown;
    headId?: number;
  }) {
    return this.persistScores({
      orderIdInput: orderId,
      items,
      targetUserIdInput: targetUserId,
      headId,
      isHead: true,
    });
  }

  /**
   * จัดการ Transaction และบันทึกข้อมูลลง ValueOrders และ ValueData
   */
  private static async persistScores({
    orderIdInput,
    items,
    targetUserIdInput,
    headId,
    isHead,
  }: {
    orderIdInput?: unknown;
    items: unknown;
    targetUserIdInput?: unknown;
    headId?: number;
    isHead: boolean;
  }) {
    const validatedItems = AssessmentHelper.parseScoreItems(items);

    return db.sequelize.transaction(async (transaction: any) => {
      let orderId: number;

      if (
        orderIdInput !== undefined &&
        orderIdInput !== null &&
        orderIdInput !== ""
      ) {
        orderId = AssessmentHelper.parsePositiveId(orderIdInput, "orderId");
        const order = await AssessmentHelper.ensureOrder(orderId, transaction);

        // ถ้าหัวหน้ามาประเมิน และ order ยังไม่มี head_id หรือเปลี่ยนหัวหน้า ให้อัปเดต
        if (isHead && headId && order.head_id !== headId) {
          await order.update({ head_id: headId }, { transaction });
        }
      } else if (
        targetUserIdInput !== undefined &&
        targetUserIdInput !== null &&
        targetUserIdInput !== ""
      ) {
        const userId = AssessmentHelper.parsePositiveId(
          targetUserIdInput,
          isHead ? "targetUserId (ลูกน้อง)" : "userId",
        );
        const { round, year } = AssessmentHelper.getCurrentRoundAndYear();

        let order = await db.ValueOrders.findOne({
          where: { user_id: userId, round, year },
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
              status: "pending",
            },
            { transaction },
          );
        } else if (isHead && headId && !order.head_id) {
          // ถ้ามี order อยู่แล้ว (เช่น ลูกน้องทำ self ไว้ก่อน) ให้ผูก head_id เข้าไป
          await order.update({ head_id: headId }, { transaction });
        }
        orderId = order.id;
      } else {
        throw new ApiError(
          isHead
            ? "กรุณาระบุ orderId หรือ user_id ของผู้รับการประเมิน"
            : "Either orderId or userId must be provided",
          400,
        );
      }

      const results = [];

      for (const { quest, scores } of validatedItems) {
        const competency = await db.Competencies.findByPk(quest, {
          transaction,
        });
        if (!competency)
          throw new ApiError(`Competency ${quest} not found`, 404);

        const existing = await db.ValueData.findOne({
          where: { value_order_id: orderId, quest },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (existing) {
          AssessmentHelper.assertEditable(existing);
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
      AssessmentHelper.assertEditable(score);
      return score.update(payload, { transaction });
    });
  }

  /** Final scores are immutable after confirmation. */
  static async submitScoreItem(id: number, submitValue: unknown) {
    AssessmentHelper.assertPositiveId(id, "scoreId");
    const finalScore = parseScore(submitValue, "submit_value", 127);

    return db.sequelize.transaction(async (transaction: any) => {
      const score = await db.ValueData.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!score) throw new ApiError("Score item not found", 404);
      AssessmentHelper.assertEditable(score);
      if (score.user_value == null || score.head_value == null) {
        throw new ApiError(
          "Both user_value and head_value are required before submitting the final score",
        );
      }
      return score.update({ submit_value: finalScore }, { transaction });
    });
  }

  // ==========================================
  // 3. Summary & Sheet Reports
  // ==========================================

  static async getAssessmentSummary(orderId: number) {
    AssessmentHelper.assertPositiveId(orderId, "orderId");
    const order = await AssessmentHelper.ensureOrder(orderId);

    const [competencyScores, kpiAssessments] = await Promise.all([
      db.ValueData.findAll({
        where: { value_order_id: orderId },
        include: [{ model: db.Competencies, as: "quest_competency" }],
        order: [["quest", "ASC"]],
      }),
      db.KpiAssessmentValues.findAll({
        where: { value_order_id: orderId },
        include: [{ model: db.KpiIndicators, as: "kpi_indicator" }],
        order: [["id", "ASC"]],
      }),
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
}

export default AssessmentService;
