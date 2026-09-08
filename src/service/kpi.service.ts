import { ApiError } from "../utils/api-response.util";
import db from "../models/product";
import { parseScore } from "../utils/score.util";
import { Op, Transaction } from "sequelize";
import { PaginationQuery, parsePagination } from "../utils/pagination.util";

class KpiService {
  static async getAssessmentValues(filter: Record<string, unknown> = {}, groupByOrder = false) {
    this.assertObject(filter, "Filter");
    const where: Record<string, unknown> = {};
    for (const field of ["value_order_id", "kpi_indicator_id"]) {
      if (filter[field] !== undefined && filter[field] !== "") {
        where[field] = this.parseId(filter[field], field);
      }
    }
    if (filter.status !== undefined && filter.status !== "") {
      if (filter.status !== "DRAFT" && filter.status !== "SUBMITTED") {
        throw new ApiError("status must be DRAFT or SUBMITTED");
      }
      where.status = filter.status;
    }
    let valueOrder;
    if (groupByOrder) {
      const id = this.parseId(filter.value_order_id, "value_order_id");
      valueOrder = await db.ValueOrders.findByPk(id);
      if (!valueOrder) throw new ApiError("Value order not found", 404);
    }
    const values = await db.KpiAssessmentValues.findAll({
      where,
      include: [
        ...(!valueOrder ? [{ model: db.ValueOrders, as: "value_order" }] : []),
        { model: db.KpiIndicators, as: "kpi_indicator" },
      ],
      order: [["id", "DESC"]],
    });
    const assessments = values.map((value: any) => this.serializeAssessmentValue(value));
    return valueOrder ? { value_order: valueOrder, kpi_assessments: assessments } : assessments;
  }

  static async getAssessmentValueById(id: number) {
    return this.serializeAssessmentValue(await this.findAssessmentValue(id));
  }

  private static serializeAssessmentValue(value: any) {
    const data = value.get({ plain: true });
    // Legacy drafts may contain a weighted score even though no final score exists.
    if (data.status === "DRAFT" || data.submit_value == null) data.weighted_score = null;
    return data;
  }

  static async createAssessmentValues(data: Record<string, unknown> | Record<string, unknown>[]) {
    if (!Array.isArray(data)) this.assertObject(data, "Request body");
    const items = Array.isArray(data) ? data : data.dataArray;
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError("dataArray must be a non-empty array");
    }

    const payload = items.map((item) => this.validateAssessmentValue(item));
    const orderIds = [...new Set(payload.map((item) => Number(item.value_order_id)))];
    const indicatorIds = [...new Set(payload.map((item) => Number(item.kpi_indicator_id)))];
    this.assertUniquePairs(payload, "value_order_id", "kpi_indicator_id", "An assessment already exists for this order and KPI indicator");

    return db.sequelize.transaction(async (transaction: any) => {
      const [orders, indicators, existing] = await Promise.all([
        db.ValueOrders.findAll({ where: { id: orderIds }, transaction }),
        db.KpiIndicators.findAll({ where: { id: indicatorIds }, transaction }),
        db.KpiAssessmentValues.findAll({
          where: { value_order_id: orderIds, kpi_indicator_id: indicatorIds },
          transaction,
        }),
      ]);
      if (orders.length !== orderIds.length) throw new ApiError("One or more value_order_id values were not found", 404);
      if (indicators.length !== indicatorIds.length) throw new ApiError("One or more kpi_indicator_id values were not found", 404);

      const requestedPairs = new Set(payload.map((item) => `${item.value_order_id}:${item.kpi_indicator_id}`));
      if (existing.some((item: any) => requestedPairs.has(`${item.value_order_id}:${item.kpi_indicator_id}`))) {
        throw new ApiError("An assessment already exists for this order and KPI indicator", 409);
      }
      return db.KpiAssessmentValues.bulkCreate(payload, { transaction });
    });
  }

  static async updateAssessmentValue(id: number, data: Record<string, unknown>) {
    return db.sequelize.transaction(async (transaction: Transaction) => {
      const assessmentValue = await this.findAssessmentValue(id, transaction);
      const payload = this.validateAssessmentValueUpdate(data);
      if (Object.keys(payload).length === 0) {
        throw new ApiError("At least one assessment value field is required");
      }
      if (payload.value_order_id !== undefined) {
        await this.ensureValueOrder(Number(payload.value_order_id));
      }
      if (payload.kpi_indicator_id !== undefined) {
        await this.findIndicator(Number(payload.kpi_indicator_id));
      }
      this.deriveAssessmentScore({ ...assessmentValue.get({ plain: true }), ...payload }, payload);
      return assessmentValue.update(payload, { transaction });
    });
  }

  static async updateAssessmentValueScores(id: number, data: Record<string, unknown>) {
    this.assertObject(data, "Assessment value");
    return db.sequelize.transaction(async (transaction: Transaction) => {
      const assessmentValue = await this.findAssessmentValue(id, transaction);
      if (assessmentValue.status === "SUBMITTED") {
        throw new ApiError("This KPI assessment has already been submitted and cannot be changed", 409);
      }
      const allowedFields = ["actual_value", "user_value", "head_value"];
      const input = allowedFields.reduce((result: Record<string, unknown>, field) => {
        if (data[field] !== undefined) result[field] = data[field];
        return result;
      }, {});
      const payload = this.validateAssessmentValueUpdate(input);
      if (Object.keys(payload).length === 0) {
        throw new ApiError("At least one of actual_value, user_value, or head_value is required");
      }
      this.deriveAssessmentScore({ ...assessmentValue.get({ plain: true }), ...payload }, payload);
      return assessmentValue.update(payload, { transaction });
    });
  }

  static async submitAssessmentValue(id: number, data: Record<string, unknown>) {
    return db.sequelize.transaction(async (transaction: Transaction) => {
      const assessmentValue = await this.findAssessmentValue(id, transaction);
      if (assessmentValue.status === "SUBMITTED") {
        throw new ApiError("This KPI assessment has already been submitted", 409);
      }
      if (assessmentValue.user_value === null || assessmentValue.head_value === null) {
        throw new ApiError("Both user_value and head_value are required before submitting the final score");
      }

      const score = parseScore(data?.submit_value, "submit_value", 255) as number;
      const weightedScore = Number(((score * Number(assessmentValue.weight)) / 100).toFixed(4));
      return assessmentValue.update({
        submit_value: score,
        weighted_score: weightedScore,
        status: "SUBMITTED",
      }, { transaction });
    });
  }

  static async deleteAssessmentValue(id: number) {
    const assessmentValue = await this.findAssessmentValue(id);
    await assessmentValue.destroy();
    return { message: "KPI assessment value deleted successfully" };
  }

  static async getScoreLevels() {
    return db.KpiScoreLevels.findAll({
      include: [{ model: db.KpiIndicators, as: "kpi_indicator" }],
      order: [["kpi_indicator_id", "ASC"], ["score", "DESC"]],
    });
  }

  static async getScoreLevelById(id: number) {
    return this.findScoreLevel(id);
  }

  static async createScoreLevels(data: Record<string, unknown> | Record<string, unknown>[]) {
    if (!Array.isArray(data)) this.assertObject(data, "Request body");
    const items = Array.isArray(data) ? data : data.dataArray;
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError("dataArray must be a non-empty array");
    }

    const payload = items.map((item) => this.validateScoreLevel(item));
    const indicatorIds = [...new Set(payload.map((item) => Number(item.kpi_indicator_id)))];
    this.assertUniquePairs(payload, "kpi_indicator_id", "score", "A score level already exists for this KPI indicator and score");

    return db.sequelize.transaction(async (transaction: any) => {
      const [indicators, existing] = await Promise.all([
        db.KpiIndicators.findAll({ where: { id: indicatorIds }, transaction }),
        db.KpiScoreLevels.findAll({ where: { kpi_indicator_id: indicatorIds }, transaction }),
      ]);
      if (indicators.length !== indicatorIds.length) {
        throw new ApiError("One or more kpi_indicator_id values were not found", 404);
      }

      const requestedPairs = new Set(payload.map((item) => `${item.kpi_indicator_id}:${item.score}`));
      if (existing.some((item: any) => requestedPairs.has(`${item.kpi_indicator_id}:${item.score}`))) {
        throw new ApiError("A score level already exists for this KPI indicator and score", 409);
      }
      return db.KpiScoreLevels.bulkCreate(payload, { transaction });
    });
  }

  static async updateScoreLevel(id: number, data: Record<string, unknown>) {
    const scoreLevel = await this.findScoreLevel(id);
    const payload = this.validateScoreLevelUpdate(data);
    if (Object.keys(payload).length === 0) {
      throw new ApiError("At least one score level field is required");
    }

    if (payload.kpi_indicator_id !== undefined) {
      await this.findIndicator(Number(payload.kpi_indicator_id));
    }
    const kpiIndicatorId = Number(payload.kpi_indicator_id ?? scoreLevel.kpi_indicator_id);
    const score = Number(payload.score ?? scoreLevel.score);
    const duplicate = await db.KpiScoreLevels.findOne({
      where: { kpi_indicator_id: kpiIndicatorId, score, id: { [Op.ne]: id } },
    });
    if (duplicate) throw new ApiError("A score level already exists for this KPI indicator and score", 409);
    return scoreLevel.update(payload);
  }

  static async deleteScoreLevel(id: number) {
    const scoreLevel = await this.findScoreLevel(id);
    await scoreLevel.destroy();
    return { message: "KPI score level deleted successfully" };
  }

  static async getIndicators(query: PaginationQuery = {}) {
    const { page, limit, offset } = this.parsePagination(query);
    const { rows, count } = await db.KpiIndicators.findAndCountAll({
      limit,
      offset,
      order: [["id", "ASC"]],
    });
    return {
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  static async getIndicatorById(id: number) {
    return this.findIndicator(id);
  }

  static async createIndicator(data: Record<string, unknown> | Record<string, unknown>[]) {
    if (Array.isArray(data)) {
      if (data.length === 0) throw new ApiError("dataArray must be a non-empty array");
      return db.KpiIndicators.bulkCreate(data.map((item) => this.validateIndicator(item)));
    }

    this.assertObject(data, "Request body");
    const items = data.dataArray;

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError("dataArray must be a non-empty array");
      }
      return db.KpiIndicators.bulkCreate(items.map((item) => this.validateIndicator(item)));
    }

    return db.KpiIndicators.create(this.validateIndicator(data));
  }

  static async updateIndicator(id: number, data: Record<string, unknown>) {
    const indicator = await this.findIndicator(id);
    const payload = this.validateUpdate(data);
    if (Object.keys(payload).length === 0) {
      throw new ApiError("At least one of name, weight, or status is required");
    }
    return indicator.update(payload);
  }

  static async deleteIndicator(id: number) {
    const indicator = await this.findIndicator(id);
    await indicator.destroy();
    return { message: "KPI indicator deleted successfully" };
  }

  private static validateIndicator(data: Record<string, unknown>) {
    this.assertObject(data, "KPI indicator");
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!name || name.length > 255) throw new ApiError("name is required and must not exceed 255 characters");

    if (!this.isNumber(data.weight)) {
      throw new ApiError("weight is required and must be a number");
    }

    const weight = Number(Number(data.weight).toFixed(2));
    if (weight < 0 || weight > 999.99) {
      throw new ApiError("weight must be between 0 and 999.99");
    }

    const payload: Record<string, unknown> = { name, weight };
    if (data.status !== undefined) {
      if (typeof data.status !== "string" || data.status.length !== 1) {
        throw new ApiError("status must be a single character");
      }
      payload.status = data.status;
    }

    return payload;
  }

  private static validateUpdate(data: Record<string, unknown>) {
    this.assertObject(data, "KPI indicator");
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) {
      if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 255) throw new ApiError("name must be a non-empty string");
      payload.name = data.name.trim();
    }
    if (data.weight !== undefined) {
      if (!this.isNumber(data.weight)) throw new ApiError("weight must be a number");
      const weight = Number(Number(data.weight).toFixed(2));
      if (weight < 0 || weight > 999.99) throw new ApiError("weight must be between 0 and 999.99");
      payload.weight = weight;
    }
    if (data.status !== undefined) {
      if (typeof data.status !== "string" || data.status.length !== 1) throw new ApiError("status must be a single character");
      payload.status = data.status;
    }
    return payload;
  }

  private static validateScoreLevel(data: Record<string, unknown>) {
    this.assertObject(data, "KPI score level");
    const kpiIndicatorId = this.parseId(data.kpi_indicator_id, "kpi_indicator_id");
    if (!this.isScore(data.score)) {
      throw new ApiError("score is required and must be an integer between 0 and 255");
    }
    if (typeof data.criteria_text !== "string" || !data.criteria_text.trim() || data.criteria_text.length > 255) {
      throw new ApiError("criteria_text is required and must not exceed 255 characters");
    }
    if (typeof data.operator_type !== "string" || !data.operator_type.trim() || data.operator_type.length > 20) {
      throw new ApiError("operator_type is required and must not exceed 20 characters");
    }
    const operatorType = data.operator_type.trim().toUpperCase();
    const allowedOperatorTypes = ["BETWEEN", "LT", "LTE", "GT", "GTE", "EQ"];
    if (!allowedOperatorTypes.includes(operatorType)) {
      throw new ApiError("operator_type must be one of: BETWEEN, LT, LTE, GT, GTE, EQ");
    }

    return {
      kpi_indicator_id: kpiIndicatorId,
      score: Number(data.score),
      criteria_text: data.criteria_text.trim(),
      operator_type: operatorType,
    };
  }

  private static validateAssessmentValue(data: Record<string, unknown>) {
    this.assertObject(data, "Assessment value");
    if (data.weighted_score !== undefined) throw new ApiError("weighted_score is calculated automatically");
    const valueOrderId = this.parseId(data.value_order_id, "value_order_id");
    const kpiIndicatorId = this.parseId(data.kpi_indicator_id, "kpi_indicator_id");
    if (!this.isNumber(data.weight)) {
      throw new ApiError("weight is required and must be a number");
    }
    const weight = Number(Number(data.weight).toFixed(2));
    if (weight < 0 || weight > 999.99) throw new ApiError("weight must be between 0 and 999.99");

    const payload: Record<string, unknown> = {
      value_order_id: valueOrderId,
      kpi_indicator_id: kpiIndicatorId,
      weight,
    };
    for (const field of ["actual_value"]) {
      if (data[field] !== undefined) {
        if (data[field] === "" || data[field] === null) payload[field] = null;
        else if (!this.isNumber(data[field])) throw new ApiError(`${field} must be a number or null`);
        else payload[field] = Number(data[field]);
      }
    }
    for (const field of ["user_value", "head_value", "submit_value"]) {
      if (data[field] !== undefined) {
        if (data[field] === "" || data[field] === null) payload[field] = null;
        else payload[field] = parseScore(data[field], field, 255);
      }
    }
    if (data.status !== undefined) {
      if (typeof data.status !== "string" || !data.status.trim() || data.status.length > 20) {
        throw new ApiError("status must be a non-empty string not exceeding 20 characters");
      }
      payload.status = data.status.trim();
    }
    this.deriveAssessmentScore(payload, payload);
    return payload;
  }

  private static validateAssessmentValueUpdate(data: Record<string, unknown>) {
    this.assertObject(data, "Assessment value");
    if (data.weighted_score !== undefined) throw new ApiError("weighted_score is calculated automatically");
    const payload: Record<string, unknown> = {};
    for (const field of ["value_order_id", "kpi_indicator_id"]) {
      if (data[field] !== undefined) {
        payload[field] = this.parseId(data[field], field);
      }
    }
    if (data.weight !== undefined) {
      if (!this.isNumber(data.weight)) throw new ApiError("weight must be a number");
      const weight = Number(Number(data.weight).toFixed(2));
      if (weight < 0 || weight > 999.99) throw new ApiError("weight must be between 0 and 999.99");
      payload.weight = weight;
    }
    for (const field of ["actual_value"]) {
      if (data[field] !== undefined) {
        if (data[field] === "" || data[field] === null) payload[field] = null;
        else if (!this.isNumber(data[field])) throw new ApiError(`${field} must be a number or null`);
        else payload[field] = Number(data[field]);
      }
    }
    for (const field of ["user_value", "head_value", "submit_value"]) {
      if (data[field] !== undefined) {
        if (data[field] === "" || data[field] === null) payload[field] = null;
        else payload[field] = parseScore(data[field], field, 255);
      }
    }
    if (data.status !== undefined) {
      if (typeof data.status !== "string" || !data.status.trim() || data.status.length > 20) {
        throw new ApiError("status must be a non-empty string not exceeding 20 characters");
      }
      payload.status = data.status.trim();
    }
    return payload;
  }

  private static validateScoreLevelUpdate(data: Record<string, unknown>) {
    this.assertObject(data, "KPI score level");
    const payload: Record<string, unknown> = {};
    if (data.kpi_indicator_id !== undefined) {
      payload.kpi_indicator_id = this.parseId(data.kpi_indicator_id, "kpi_indicator_id");
    }
    if (data.score !== undefined) {
      if (!this.isScore(data.score)) {
        throw new ApiError("score must be an integer between 0 and 255");
      }
      payload.score = Number(data.score);
    }
    if (data.criteria_text !== undefined) {
      if (typeof data.criteria_text !== "string" || !data.criteria_text.trim() || data.criteria_text.length > 255) {
        throw new ApiError("criteria_text must be a non-empty string not exceeding 255 characters");
      }
      payload.criteria_text = data.criteria_text.trim();
    }
    if (data.operator_type !== undefined) {
      if (typeof data.operator_type !== "string") throw new ApiError("operator_type must be a string");
      const operatorType = data.operator_type.trim().toUpperCase();
      const allowedOperatorTypes = ["BETWEEN", "LT", "LTE", "GT", "GTE", "EQ"];
      if (!allowedOperatorTypes.includes(operatorType)) {
        throw new ApiError("operator_type must be one of: BETWEEN, LT, LTE, GT, GTE, EQ");
      }
      payload.operator_type = operatorType;
    }
    return payload;
  }

  private static isNumber(value: unknown) {
    return (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value));
  }

  private static assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new ApiError(`${label} must be an object`);
    }
  }

  private static parseId(value: unknown, field: string) {
    if (!this.isNumber(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
      throw new ApiError(`${field} must be a positive integer`);
    }
    return Number(value);
  }

  private static isScore(value: unknown) {
    return this.isNumber(value) && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 255;
  }

  private static deriveAssessmentScore(state: Record<string, unknown>, payload: Record<string, unknown>) {
    const status = state.status ?? "DRAFT";
    if (status !== "DRAFT" && status !== "SUBMITTED") throw new ApiError("status must be DRAFT or SUBMITTED");
    if (state.submit_value != null) {
      if (state.user_value == null || state.head_value == null) {
        throw new ApiError("Both user_value and head_value are required before submitting the final score");
      }
      payload.weighted_score = Number(((Number(state.submit_value) * Number(state.weight)) / 100).toFixed(4));
      payload.status = "SUBMITTED";
    } else {
      if (status === "SUBMITTED") throw new ApiError("submit_value is required for SUBMITTED assessments");
      payload.weighted_score = null;
      payload.status = "DRAFT";
    }
  }

  private static async findIndicator(id: number) {
    id = this.parseId(id, "id");
    const indicator = await db.KpiIndicators.findByPk(id);
    if (!indicator) throw new ApiError("KPI indicator not found", 404);
    return indicator;
  }

  private static async findScoreLevel(id: number) {
    id = this.parseId(id, "id");
    const scoreLevel = await db.KpiScoreLevels.findByPk(id, {
      include: [{ model: db.KpiIndicators, as: "kpi_indicator" }],
    });
    if (!scoreLevel) throw new ApiError("KPI score level not found", 404);
    return scoreLevel;
  }

  private static async findAssessmentValue(id: number, transaction?: Transaction) {
    id = this.parseId(id, "id");
    const assessmentValue = await db.KpiAssessmentValues.findByPk(id, {
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      include: [
        { model: db.ValueOrders, as: "value_order" },
        { model: db.KpiIndicators, as: "kpi_indicator" },
      ],
    });
    if (!assessmentValue) throw new ApiError("KPI assessment value not found", 404);
    return assessmentValue;
  }

  private static async ensureValueOrder(id: number) {
    const order = await db.ValueOrders.findByPk(id);
    if (!order) throw new ApiError("Value order not found", 404);
    return order;
  }

  private static assertUniquePairs(
    items: Record<string, unknown>[],
    firstField: string,
    secondField: string,
    message: string,
  ) {
    const pairs = new Set<string>();
    for (const item of items) {
      const key = `${item[firstField]}:${item[secondField]}`;
      if (pairs.has(key)) throw new ApiError(message, 409);
      pairs.add(key);
    }
  }

  private static parsePagination(query: PaginationQuery = {}, defaultLimit = 10, maxLimit = 50) {
    return parsePagination(query, defaultLimit, maxLimit);
  }
}

export default KpiService;
