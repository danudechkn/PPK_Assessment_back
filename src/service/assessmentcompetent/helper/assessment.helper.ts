import { ApiError } from "../../../utils/api-response.util";
import { parseScore } from "../../../utils/score.util";
import db from "../../../models/product";

export class AssessmentHelper {
  // ==========================================
  // Allowed Field Constants
  // ==========================================
  static readonly ORDER_FIELDS = [
    "user_id",
    "head_id",
    "round",
    "year",
    "status",
  ] as const;

  static readonly SCORE_FIELDS = ["user_value", "head_value"] as const;

  // ==========================================
  // Validation Helpers
  // ==========================================

  /**
   * คำนวณรอบและปี พ.ศ. อัตโนมัติตามวันที่ปัจจุบัน:
   * - รอบ 1: 1 เม.ย. - 30 ก.ย. (เดือน 4 - 9)
   * - รอบ 2: 1 ต.ค. - 31 มี.ค. (เดือน 10 - 12 และ 1 - 3)
   * - ปี: ค.ศ. ปัจจุบัน (เช่น 2026)
   */
  static getCurrentRoundAndYear(date = new Date()) {
    const month = date.getMonth() + 1; // 1 - 12
    const round = month >= 4 && month <= 9 ? 1 : 2; // 4-9 = รอบ 1, 10-12 และ 1-3 = รอบ 2
    const year = date.getFullYear(); // ค.ศ. เช่น 2026
    return { round, year };
  }

  static assertPositiveId(id: number, field: string) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new ApiError(`${field} must be a positive integer`);
    }
  }

  static parsePositiveId(value: unknown, field: string): number {
    if (
      (typeof value !== "number" && typeof value !== "string") ||
      (typeof value === "string" && value.trim() === "")
    ) {
      throw new ApiError(`${field} must be a positive integer`);
    }
    const id = Number(value);
    this.assertPositiveId(id, field);
    return id;
  }

  static assertObject(
    input: unknown,
    field: string,
  ): asserts input is Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ApiError(`${field} must be an object`);
    }
  }

  static assertEditable(score: { submit_value: unknown }) {
    if (score.submit_value != null) {
      throw new ApiError(
        "This competency assessment has already been submitted and cannot be changed",
        409,
      );
    }
  }

  static async ensureOrder(id: number, transaction?: any) {
    const order = await db.ValueOrders.findByPk(id, {
      ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    });
    if (!order) throw new ApiError("Assessment order not found", 404);
    return order;
  }

  static pick(input: unknown, fields: readonly string[]) {
    this.assertObject(input, "body");
    return fields.reduce((result: Record<string, unknown>, field) => {
      if (input[field] !== undefined) {
        result[field] = input[field] === "" ? null : input[field];
      }
      return result;
    }, {});
  }

  // ==========================================
  // Payload Parsers & Formatters
  // ==========================================

  static orderPayload(data: unknown): Record<string, unknown> {
    const payload = this.pick(data, this.ORDER_FIELDS);

    for (const field of ["user_id", "head_id"]) {
      if (payload[field] !== undefined && payload[field] !== null) {
        payload[field] = this.parsePositiveId(payload[field], field);
      }
    }

    // 💡 Auto คำนวณรอบและปี พ.ศ. ตามวันที่ปัจจุบัน (ถ้าหน้าบ้านไม่ได้ส่งมา)
    const auto = this.getCurrentRoundAndYear();

    payload.round =
      payload.round !== undefined &&
      payload.round !== null &&
      payload.round !== ""
        ? Number(payload.round)
        : auto.round;

    payload.year =
      payload.year !== undefined && payload.year !== null && payload.year !== ""
        ? Number(payload.year)
        : auto.year;

    if (
      payload.status !== undefined &&
      payload.status !== null &&
      (typeof payload.status !== "string" || payload.status.length > 20)
    ) {
      throw new ApiError(
        "status must be a string of at most 20 characters or null",
      );
    }
    return payload;
  }

  static scorePayload(data: unknown): Record<string, unknown> {
    const payload = this.pick(data, this.SCORE_FIELDS);
    if (Object.keys(payload).length === 0) {
      throw new ApiError("At least one score field is required");
    }
    for (const field of this.SCORE_FIELDS) {
      if (payload[field] !== undefined) {
        payload[field] = parseScore(payload[field], field, 127, true);
      }
    }
    return payload;
  }

  static parseScoreItems(items: unknown) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError("items is required and must be a non-empty array");
    }

    return items.map((item) => {
      this.assertObject(item, "Each score item");
      const input = item as Record<string, unknown>;
      const quest = this.parsePositiveId(input.quest, "quest");
      const scores = this.pick(input, this.SCORE_FIELDS);

      if (Object.keys(scores).length === 0) {
        throw new ApiError(
          "At least one score field is required for each item",
        );
      }

      for (const field of this.SCORE_FIELDS) {
        if (scores[field] !== undefined) {
          scores[field] = parseScore(scores[field], field, 127, true);
        }
      }

      return { quest, scores };
    });
  }

  static formatSheetCategories(categories: any[]) {
    return categories.map((category: any) => {
      const data = category.get({ plain: true });
      data.competencies = data.competencies.map((competency: any) => {
        const { value_data_quests, ...rest } = competency;
        return { ...rest, score: value_data_quests?.[0] || null };
      });
      return data;
    });
  }
}
