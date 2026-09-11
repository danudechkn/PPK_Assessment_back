import db from "../../models/product";
import { ApiError } from "../../utils/api-response.util";
import { parseScore } from "../../utils/score.util";
import { AssessmentHelper } from "./helper/assessment.helper";

class AssessmentService {
  // ==========================================
  // 0. Self Assessment check by user
  // ==========================================

  static async checkSelfAssessment(userId: number) {
    // console.log(userId);
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

    const total_score =
      data?.value_data_list?.reduce(
        (acc: any, item: { user_value?: number; [key: string]: unknown }) =>
          acc + (item?.user_value || 0),
        0,
      ) ?? 0;

    return {
      id: data?.id ?? null,
      user_id: data?.user_id ?? userId,
      round: data?.round ?? round,
      year: data?.year ?? year,
      status: data?.status || "pending",
      createdAt: data?.createdAt ?? null,
      total_score,
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
    orderIdInput: unknown,
    items: unknown,
    userIdInput?: unknown,
  ) {
    const validatedItems = AssessmentHelper.parseScoreItems(items);

    return db.sequelize.transaction(async (transaction: any) => {
      let orderId: number;

      if (
        orderIdInput !== undefined &&
        orderIdInput !== null &&
        orderIdInput !== ""
      ) {
        orderId = AssessmentHelper.parsePositiveId(orderIdInput, "orderId");
        await AssessmentHelper.ensureOrder(orderId, transaction);
      } else if (
        userIdInput !== undefined &&
        userIdInput !== null &&
        userIdInput !== ""
      ) {
        const userId = AssessmentHelper.parsePositiveId(userIdInput, "userId");
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
              round,
              year,
              status: "pending",
            },
            { transaction },
          );
        }
        orderId = order.id;
      } else {
        throw new ApiError("Either orderId or userId must be provided", 400);
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
