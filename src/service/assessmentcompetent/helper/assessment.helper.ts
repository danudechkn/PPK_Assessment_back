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
    "total_value",
    "type_order_id",
  ] as const;

  static readonly SCORE_FIELDS = [
    "user_value",
    "head_value",
    "submit_value",
  ] as const;

  static readonly ACTUAL_VALUE_FIELDS = [
    "user_actual_value",
    "head_actual_value",
    "submit_actual_value",
    "actual_value",
  ] as const;

  static readonly ALL_SCORE_FIELDS = [
    ...AssessmentHelper.SCORE_FIELDS,
    ...AssessmentHelper.ACTUAL_VALUE_FIELDS,
  ] as const;

  // ==========================================
  // Validation Helpers
  // ==========================================

  /**
   * คำนวณรอบและปี พ.ศ./ค.ศ. อัตโนมัติตามหลักปีงบประมาณราชการ (ตามเอกสาร):
   * - รอบที่ 1: 1 ต.ค. - 31 มี.ค. (เดือน 10 - 12 และ 1 - 3)
   * - รอบที่ 2: 1 เม.ย. - 30 ก.ย. (เดือน 4 - 9)
   * - ปีงบประมาณ: เดือน 10 - 12 จะนับเป็นปีงบประมาณของปีถัดไป (เช่น ต.ค. 2025 -> ปีงบประมาณ 2026)
   */
  static getCurrentRoundAndYear(date = new Date()) {
    const month = date.getMonth() + 1; // 1 - 12
    const currentYear = date.getFullYear(); // ค.ศ. เช่น 2026

    // รอบที่ 2 คือ เดือน 4 ถึง 9 (1 เม.ย. - 30 ก.ย.), รอบที่ 1 คือ เดือน 10-12 และ 1-3 (1 ต.ค. - 31 มี.ค.)
    const round = month >= 4 && month <= 9 ? 2 : 1;

    // ปีงบประมาณ: ช่วง ต.ค. - ธ.ค. (เดือน 10-12) ให้นับเป็นปีงบประมาณถัดไป (+1)
    const year = month >= 10 ? currentYear + 1 : currentYear;

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

  static parseDecimal(value: unknown, field: string): number | null {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    if (isNaN(num)) {
      throw new ApiError(`${field} must be a valid number`);
    }
    return Number(num.toFixed(2));
  }

  /**
   * คำนวณระดับคะแนน KPI (1-5) จากค่าผลงานจริง (actual_value) เทียบกับเกณฑ์ใน kpi_score_levels
   * มี Fallback รองรับตามเกณฑ์มาตรฐานโรงพยาบาล (ข้อ 1-2: ร้อยละ, ข้อ 3-5: อุบัติการณ์)
   */
  static evaluateKpiScore(
    actualValue: number | null | undefined,
    scoreLevels: Array<{ score: number; criteria_text: string; operator_type?: string }> = [],
    questionText?: string,
    questionNo?: number,
  ): number | null {
    if (actualValue == null || isNaN(Number(actualValue))) return null;
    const val = Number(actualValue);

    // 1. ตรวจสอบแต่ละระดับตามเกณฑ์ใน scoreLevels หากมี range ระบุไว้
    if (scoreLevels && scoreLevels.length > 0) {
      for (const level of scoreLevels) {
        const text = (level.criteria_text || "").trim();
        const op = (level.operator_type || "").trim().toUpperCase();
        const score = Number(level.score);

        // Case BETWEEN (เช่น "91-100", "61-70", "0-1", "6-7")
        const rangeMatch = text.match(/^(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)$/);
        if (rangeMatch || op === "BETWEEN") {
          const min = rangeMatch ? parseFloat(rangeMatch[1]) : 0;
          const max = rangeMatch ? parseFloat(rangeMatch[2]) : 0;
          const lower = Math.min(min, max);
          const upper = Math.max(min, max);
          if (val >= lower && val <= upper) {
            return score;
          }
        }

        // Case Less than / LTE (เช่น "<60", "<=60")
        const ltMatch = text.match(/^(?:<|<=)\s*(\d+(?:\.\d+)?)$/);
        if (ltMatch || op === "LT" || op === "LTE") {
          const threshold = ltMatch ? parseFloat(ltMatch[1]) : parseFloat(text.replace(/[^0-9.]/g, ""));
          if (!isNaN(threshold) && val <= threshold) {
            return score;
          }
        }

        // Case Greater than / GTE (เช่น ">8", ">=8")
        const gtMatch = text.match(/^(?:>|>=)\s*(\d+(?:\.\d+)?)$/);
        if (gtMatch || op === "GT" || op === "GTE") {
          const threshold = gtMatch ? parseFloat(gtMatch[1]) : parseFloat(text.replace(/[^0-9.]/g, ""));
          if (!isNaN(threshold) && val >= threshold) {
            return score;
          }
        }

        // Case Equal
        const eqMatch = text.match(/^(?:=|eq)?\s*(\d+(?:\.\d+)?)$/i);
        if (eqMatch || op === "EQ") {
          const target = eqMatch ? parseFloat(eqMatch[1]) : parseFloat(text);
          if (!isNaN(target) && val === target) {
            return score;
          }
        }
      }
    }

    // 2. Fallback ตามเกณฑ์มาตรฐานโรงพยาบาล/ตารางราชการ (ทุกข้อ 1 - 5 ใช้เกณฑ์ร้อยละเหมือนกัน):
    // < 60% (1), 61 - 70% (2), 71 - 80% (3), 81 - 90% (4), 91 - 100% (5)
    if (val >= 91) return 5;
    if (val >= 81) return 4;
    if (val >= 71) return 3;
    if (val >= 61) return 2;
    return 1;
  }

  /**
   * คำนวณระดับคะแนนสมรรถนะ (1-5) จากคะแนนจริง 0-100
   * 91-100: ระดับ 5 (ดีมาก)
   * 81-90:  ระดับ 4 (ดี)
   * 71-80:  ระดับ 3 (ปานกลาง)
   * 61-70:  ระดับ 2 (ต่ำ)
   * < 60:   ระดับ 1 (ต่ำมาก)
   */
  static evaluateCompetencyScore(
    actualValue: number | null | undefined,
  ): number | null {
    if (actualValue == null || isNaN(Number(actualValue))) return null;
    const val = Number(actualValue);
    if (val >= 91) return 5;
    if (val >= 81) return 4;
    if (val >= 71) return 3;
    if (val >= 61) return 2;
    return 1;
  }

  static scorePayload(data: unknown): Record<string, unknown> {
    const payload = this.pick(data, this.ALL_SCORE_FIELDS);
    if (Object.keys(payload).length === 0) {
      throw new ApiError("At least one score field is required");
    }
    for (const field of this.SCORE_FIELDS) {
      if (payload[field] !== undefined) {
        payload[field] = parseScore(payload[field], field, 127, true);
      }
    }
    for (const field of this.ACTUAL_VALUE_FIELDS) {
      if (payload[field] !== undefined) {
        payload[field] = this.parseDecimal(payload[field], field);
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
      const scores = this.pick(input, this.ALL_SCORE_FIELDS);

      if (Object.keys(scores).length === 0) {
        throw new ApiError(
          "At least one score or actual_value field is required for each item",
        );
      }

      for (const field of this.SCORE_FIELDS) {
        if (scores[field] !== undefined) {
          scores[field] = parseScore(scores[field], field, 127, true);
        }
      }

      for (const field of this.ACTUAL_VALUE_FIELDS) {
        if (scores[field] !== undefined) {
          const parsed = this.parseDecimal(scores[field], field);
          scores[field] =
            parsed !== null ? Math.min(100, Math.max(0, parsed)) : null;
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
