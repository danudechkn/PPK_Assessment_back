import { ApiError } from "../utils/api-response.util";
import { parseScore } from "../utils/score.util";
import db from "../models/product";

const ORDER_FIELDS = ["user_id", "head_id", "round", "year", "status"];
// คะแนนระหว่างประเมิน: ผู้ประเมินตนเองและหัวหน้าเท่านั้น
const SCORE_FIELDS = ["user_value", "head_value"];

class AssessmentService {

  static async getOrderById(id: number) {
    this.assertPositiveId(id, "id");
    return this.ensureOrder(id);
  }

  static async getScoreById(id: number) {
    this.assertPositiveId(id, "id");
    const score = await db.ValueData.findByPk(id);
    if (!score) throw new ApiError("Competency score not found", 404);
    return score;
  }

  static async getAllOrders(filter: unknown = {}) {
    this.assertObject(filter, "query");
    const where: Record<string, unknown> = {};
    for (const field of ORDER_FIELDS) {
      if (filter[field] !== undefined && filter[field] !== "") where[field] = filter[field];
    }
    return db.ValueOrders.findAll({ where: this.orderPayload(where), order: [["id", "DESC"]] });
  }

  static async createOrder(data: unknown) {
    const payload = this.orderPayload(data);
    return db.ValueOrders.create(payload);
  }

  static async updateOrder(id: number, data: unknown) {
    this.assertPositiveId(id, "orderId");
    const payload = this.orderPayload(data);
    if (Object.keys(payload).length === 0) throw new ApiError("At least one assessment order field is required");
    const order = await db.ValueOrders.findByPk(id);
    if (!order) throw new ApiError("Assessment order not found", 404);
    return order.update(payload);
  }

  static async deleteOrder(id: number) {
    this.assertPositiveId(id, "orderId");
    await db.sequelize.transaction(async (transaction: any) => {
      const order = await db.ValueOrders.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) throw new ApiError("Assessment order not found", 404);
      await db.KpiAssessmentValues.destroy({ where: { value_order_id: id }, transaction });
      await db.ValueData.destroy({ where: { value_order_id: id }, transaction });
      await order.destroy({ transaction });
    });
    return { message: "Assessment order deleted successfully" };
  }

  static async getValueDataByOrderId(orderId: number) {
    this.assertPositiveId(orderId, "orderId");
    await this.ensureOrder(orderId);
    return db.ValueData.findAll({ where: { value_order_id: orderId }, order: [["quest", "ASC"]] });
  }

  static async getAssessmentSummary(orderId: number) {
    this.assertPositiveId(orderId, "orderId");
    const order = await this.ensureOrder(orderId);
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

  static async saveScores(orderIdInput: unknown, items: unknown) {
    const orderId = this.parsePositiveId(orderIdInput, "orderId");
    if (!Array.isArray(items) || items.length === 0) throw new ApiError("items is required and must be a non-empty array");
    return db.sequelize.transaction(async (transaction: any) => {
      const order = await db.ValueOrders.findByPk(orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!order) throw new ApiError("Assessment order not found", 404);
      const results = [];
      for (const item of items) {
        this.assertObject(item, "Each score item");
        const input = item as Record<string, unknown>;
        const quest = this.parsePositiveId(input.quest, "quest");
        const scores = this.pick(input, SCORE_FIELDS);
        if (Object.keys(scores).length === 0) throw new ApiError("At least one score field is required for each item");

        for (const field of SCORE_FIELDS) {
          if (scores[field] !== undefined) scores[field] = parseScore(scores[field], field, 127, true);
        }

        const competency = await db.Competencies.findByPk(quest, { transaction });
        if (!competency) throw new ApiError(`Competency ${quest} not found`, 404);
        const existing = await db.ValueData.findOne({ where: { value_order_id: orderId, quest }, transaction, lock: transaction.LOCK.UPDATE });
        if (existing) this.assertEditable(existing);
        results.push(existing
          ? await existing.update(scores, { transaction })
          : await db.ValueData.create({ value_order_id: orderId, quest, ...scores }, { transaction }));
      }
      return results;
    });
  }

  static async updateScoreItem(id: number, data: unknown) {
    this.assertPositiveId(id, "scoreId");
    const payload = this.pick(data, SCORE_FIELDS);
    if (Object.keys(payload).length === 0) throw new ApiError("At least one score field is required");
    for (const field of SCORE_FIELDS) {
      if (payload[field] !== undefined) payload[field] = parseScore(payload[field], field, 127, true);
    }
    return db.sequelize.transaction(async (transaction: any) => {
      const score = await db.ValueData.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!score) throw new ApiError("Score item not found", 404);
      this.assertEditable(score);
      return score.update(payload, { transaction });
    });
  }

  /** Final scores are immutable after confirmation. */
  static async submitScoreItem(id: number, submitValue: unknown) {
    this.assertPositiveId(id, "scoreId");
    const finalScore = parseScore(submitValue, "submit_value", 127);
    return db.sequelize.transaction(async (transaction: any) => {
      const score = await db.ValueData.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!score) throw new ApiError("Score item not found", 404);
      this.assertEditable(score);
      if (score.user_value == null || score.head_value == null) {
        throw new ApiError("Both user_value and head_value are required before submitting the final score");
      }
      return score.update({ submit_value: finalScore }, { transaction });
    });
  }

  private static assertEditable(score: { submit_value: unknown }) {
    if (score.submit_value != null) throw new ApiError("This competency assessment has already been submitted and cannot be changed", 409);
  }

  static async getAssessmentSheet(orderId: number) {
    this.assertPositiveId(orderId, "orderId");
    const order = await this.ensureOrder(orderId);
    const categories = await db.CompetencyCategories.findAll({
      include: [{
        model: db.Competencies,
        as: "competencies",
        include: [
          { model: db.Behavior, as: "behaviors" },
          { model: db.ValueData, as: "value_data_quests", where: { value_order_id: orderId }, required: false },
        ],
      }],
      order: [["id", "ASC"], [{ model: db.Competencies, as: "competencies" }, "id", "ASC"]],
    });

    const sheetCategories = categories.map((category: any) => {
      const data = category.get({ plain: true });
      data.competencies = data.competencies.map((competency: any) => {
        const { value_data_quests, ...rest } = competency;
        return { ...rest, score: value_data_quests[0] || null };
      });
      return data;
    });

    return { value_order: order, categories: sheetCategories };
  }

  private static async ensureOrder(id: number) {
    const order = await db.ValueOrders.findByPk(id);
    if (!order) throw new ApiError("Assessment order not found", 404);
    return order;
  }

  private static assertPositiveId(id: number, field: string) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(`${field} must be a positive integer`);
  }

  private static parsePositiveId(value: unknown, field: string) {
    if ((typeof value !== "number" && typeof value !== "string") ||
        (typeof value === "string" && value.trim() === "")) {
      throw new ApiError(`${field} must be a positive integer`);
    }
    const id = Number(value);
    this.assertPositiveId(id, field);
    return id;
  }

  private static assertObject(input: unknown, field: string): asserts input is Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ApiError(`${field} must be an object`);
    }
  }

  private static orderPayload(data: unknown) {
    const payload = this.pick(data, ORDER_FIELDS);
    for (const field of ["user_id", "head_id"]) {
      if (payload[field] !== undefined && payload[field] !== null) {
        payload[field] = this.parsePositiveId(payload[field], field);
      }
    }
    for (const [field, min, max] of [["round", -128, 127], ["year", -32768, 32767]] as const) {
      const value = payload[field];
      if (value === undefined || value === null) continue;
      if ((typeof value !== "number" && typeof value !== "string") ||
          (typeof value === "string" && value.trim() === "") ||
          !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) {
        throw new ApiError(`${field} must be an integer between ${min} and ${max} or null`);
      }
      payload[field] = Number(value);
    }
    if (payload.status !== undefined && payload.status !== null &&
        (typeof payload.status !== "string" || payload.status.length > 20)) {
      throw new ApiError("status must be a string of at most 20 characters or null");
    }
    return payload;
  }

  private static pick(input: unknown, fields: string[]) {
    this.assertObject(input, "body");
    return fields.reduce((result: Record<string, unknown>, field) => {
      if (input[field] !== undefined) result[field] = input[field] === "" ? null : input[field];
      return result;
    }, {});
  }
}

export default AssessmentService;
