import { ApiError } from "../../../utils/api-response.util";
import { parseScore } from "../../../utils/score.util";
import {
  PaginationQuery,
  parsePagination,
} from "../../../utils/pagination.util";

export class CompetentHelper {
  // ==========================================
  // Allowed Field Constants
  // ==========================================
  static readonly CATEGORY_FIELDS = ["name", "status"] as const;
  static readonly COMPETENCY_FIELDS = [
    "competency_category_id",
    "type_person_id",
    "func_unit_id",
    "position_level_id",
    "competency",
    "expected_score",
    "status",
  ] as const;
  static readonly BEHAVIOR_FIELDS = [
    "competency_id",
    "description",
    "status",
  ] as const;

  // ==========================================
  // Validation & Helpers
  // ==========================================

  static parsePagination(
    query: PaginationQuery = {},
    defaultLimit = 10,
    maxLimit = 50,
  ) {
    return parsePagination(query, defaultLimit, maxLimit);
  }

  static parseId(
    value: unknown,
    field: string,
    nullable = false,
  ): number | null {
    if (nullable && (value === "" || value === null)) return null;
    if (
      (typeof value !== "number" && typeof value !== "string") ||
      !/^\d+$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) <= 0
    ) {
      throw new ApiError(`${field} must be a positive integer`);
    }
    return Number(value);
  }

  static validateText(value: unknown, field: string, max?: number) {
    if (
      typeof value !== "string" ||
      value.trim() === "" ||
      (max !== undefined && value.length > max)
    ) {
      throw new ApiError(
        `${field} must be a non-empty string${max ? ` of at most ${max} characters` : ""}`,
      );
    }
  }

  static getItems(body: unknown, max: number): unknown[] {
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError("body must be an object");
    const { dataArray } = body as Record<string, unknown>;
    if (!Array.isArray(dataArray) || dataArray.length === 0)
      throw new ApiError("dataArray must be a non-empty array");
    if (dataArray.length > max)
      throw new ApiError(`dataArray must contain at most ${max} items`);
    return dataArray;
  }

  static pick(input: unknown, fields: readonly string[]) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new ApiError("Each item must be an object");
    const data = input as Record<string, unknown>;
    const payload = fields.reduce((result: Record<string, unknown>, field) => {
      if (data[field] !== undefined) result[field] = data[field];
      return result;
    }, {});
    if (Object.keys(payload).length === 0)
      throw new ApiError(`At least one of ${fields.join(", ")} is required`);
    if (payload.status === "") payload.status = null;
    if (
      payload.status !== undefined &&
      payload.status !== null &&
      (typeof payload.status !== "string" || payload.status.length !== 1)
    ) {
      throw new ApiError("status must be a single character or null");
    }
    return payload;
  }

  static competencyPayload(input: unknown, creating = false) {
    const payload = this.pick(input, this.COMPETENCY_FIELDS);
    if (creating || payload.competency !== undefined)
      this.validateText(payload.competency, "competency");
    if (creating || payload.competency_category_id !== undefined) {
      payload.competency_category_id = this.parseId(
        payload.competency_category_id,
        "competency_category_id",
      );
    }
    for (const field of [
      "type_person_id",
      "func_unit_id",
      "position_level_id",
    ]) {
      if (payload[field] !== undefined)
        payload[field] = this.parseId(payload[field], field, true);
    }
    if (payload.expected_score !== undefined) {
      payload.expected_score = parseScore(
        payload.expected_score,
        "expected_score",
        127,
        true,
      );
    }
    return payload;
  }

  static behaviorPayload(input: unknown, creating = false) {
    const payload = this.pick(input, this.BEHAVIOR_FIELDS);
    if (creating || payload.competency_id !== undefined) {
      payload.competency_id = this.parseId(
        payload.competency_id,
        "competency_id",
      );
    }
    if (
      payload.description !== undefined &&
      payload.description !== null &&
      typeof payload.description !== "string"
    ) {
      throw new ApiError("description must be a string or null");
    }
    return payload;
  }
}
