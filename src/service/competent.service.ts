import db from "../models/product";
import { ApiError } from "../utils/api-response.util";
import { parseScore } from "../utils/score.util";

import {
    PaginationQuery,
    PaginationMeta,
    PaginatedResult,
    parsePagination,
} from "../utils/pagination.util";

export { PaginationQuery, PaginationMeta, PaginatedResult };

class CompetentService {
    // ==========================================
    // Allowed Field Constants
    // ==========================================
    private static readonly CATEGORY_FIELDS = ["name", "status"] as const;
    private static readonly COMPETENCY_FIELDS = [
        "competency_category_id",
        "type_person_id",
        "func_unit_id",
        "position_level_id",
        "competency",
        "expected_score",
        "status",
    ] as const;
    private static readonly BEHAVIOR_FIELDS = ["competency_id", "description", "status"] as const;

    // ==========================================
    // 1. Competency Categories
    // ==========================================

    static async getAllCategories(query: PaginationQuery = {}) {
        const { page, limit, offset } = this.parsePagination(query);

        const { rows, count } = await db.CompetencyCategories.findAndCountAll({
            limit,
            offset,
            order: [["id", "ASC"]],
        });

        return {
            data: rows,
            pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
        };
    }

    static async getCategoriesFull() {
        return await db.CompetencyCategories.findAll({
            include: [
                {
                    model: db.Competencies,
                    as: "competencies",
                    include: [
                        {
                            model: db.Behavior,
                            as: "behaviors",
                        },
                    ],
                },
            ],
        });
    }

    static async getCategoryById(id: number) {
        if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError("id must be a positive integer");
        const result = await db.CompetencyCategories.findByPk(id);
        if (!result) throw new ApiError("Category not found", 404);
        return result;
    }

    static async createCategory(body: unknown) {
        const sanitizedData = this.getItems(body, 20).map((item) => {
            const payload = this.pick(item, this.CATEGORY_FIELDS);
            this.validateText(payload.name, "name", 255);
            return payload;
        });

        return await db.CompetencyCategories.bulkCreate(sanitizedData);
    }

    static async updateCategory(id: number, data: unknown) {
        const category = await this.getCategoryById(id);
        const payload = this.pick(data, this.CATEGORY_FIELDS);
        if (payload.name !== undefined) this.validateText(payload.name, "name", 255);
        return await category.update(payload);
    }

    static async deleteCategory(id: number) {
        const category = await this.getCategoryById(id);
        await category.destroy();
        return { message: "Category deleted successfully" };
    }

    // ==========================================
    // 2. Competencies
    // ==========================================

    static async getAllCompetent(query: PaginationQuery = {}) {
        const { page, limit, offset } = this.parsePagination(query);

        const { rows, count } = await db.Competencies.findAndCountAll({
            limit,
            offset,
            order: [["id", "ASC"]],
            include: [
                {
                    model: db.CompetencyCategories,
                    as: "category",
                    attributes: ["id", "name"],
                },
            ],
        });
        const formattedData = rows.map((row: any) => {
            return {
                id: row.id,
                competency_category_id: row.competency_category_id,
                type_person_id: row.type_person_id,
                func_unit_id: row.func_unit_id,
                position_level_id: row.position_level_id,
                competency: row.competency,
                expected_score: row.expected_score,
                status: row.status,
                category_name: row.category.name,
                category_id: row.competency_category_id,
            };
        });

        return {
            data: formattedData,
            pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
        };
    }

    static async getCompetentById(id: number) {
        if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError("id must be a positive integer");
        const result = await db.Competencies.findByPk(id);
        if (!result) throw new ApiError("Competency not found", 404);
        return result;
    }

    static async getCompetenciesByCategory(categoryId: number) {
        await this.getCategoryById(categoryId);
        return await db.Competencies.findAll({ where: { competency_category_id: categoryId } });
    }

    static async createCompetent(body: unknown) {
        const sanitizedData = this.getItems(body, 20).map((item) => this.competencyPayload(item, true));
        return await db.Competencies.bulkCreate(sanitizedData);
    }

    static async updateCompetent(id: number, data: unknown) {
        const competent = await this.getCompetentById(id);
        return await competent.update(this.competencyPayload(data));
    }

    static async deleteCompetent(id: number) {
        const competent = await this.getCompetentById(id);
        await competent.destroy();
        return { message: "Competent deleted successfully" };
    }

    // ==========================================
    // 3. Behaviors
    // ==========================================

    static async getBehavior(query: PaginationQuery = {}) {
        const { page, limit, offset } = this.parsePagination(query);

        const { rows, count } = await db.Behavior.findAndCountAll({
            limit,
            offset,
            order: [["id", "ASC"]],
        });

        return {
            data: rows,
            pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
        };
    }

    static async getBehaviorById(id: number) {
        if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError("id must be a positive integer");
        const result = await db.Behavior.findByPk(id);
        if (!result) throw new ApiError("Behavior not found", 404);
        return result;
    }

    static async getBehaviorsByCompetency(competencyId: number) {
        await this.getCompetentById(competencyId);
        return await db.Behavior.findAll({ where: { competency_id: competencyId } });
    }

    static async createBehavior(body: unknown) {
        const payload = this.getItems(body, 20).map((item) => this.behaviorPayload(item, true));
        return await db.Behavior.bulkCreate(payload);
    }

    static async updateBehavior(id: number, data: unknown) {
        const behavior = await this.getBehaviorById(id);
        return await behavior.update(this.behaviorPayload(data));
    }

    static async deleteBehavior(id: number) {
        const behavior = await this.getBehaviorById(id);
        await behavior.destroy();
        return { message: "Behavior deleted successfully" };
    }

    // ==========================================
    // 4. Private Helpers & Validation
    // ==========================================

    private static parsePagination(query: PaginationQuery = {}, defaultLimit = 10, maxLimit = 50) {
        return parsePagination(query, defaultLimit, maxLimit);
    }

    private static parseId(value: unknown, field: string, nullable = false): number | null {
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

    private static validateText(value: unknown, field: string, max?: number) {
        if (typeof value !== "string" || value.trim() === "" || (max !== undefined && value.length > max)) {
            throw new ApiError(`${field} must be a non-empty string${max ? ` of at most ${max} characters` : ""}`);
        }
    }

    private static getItems(body: unknown, max: number): unknown[] {
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("body must be an object");
        const { dataArray } = body as Record<string, unknown>;
        if (!Array.isArray(dataArray) || dataArray.length === 0) throw new ApiError("dataArray must be a non-empty array");
        if (dataArray.length > max) throw new ApiError(`dataArray must contain at most ${max} items`);
        return dataArray;
    }

    private static pick(input: unknown, fields: readonly string[]) {
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError("Each item must be an object");
        const data = input as Record<string, unknown>;
        const payload = fields.reduce((result: Record<string, unknown>, field) => {
            if (data[field] !== undefined) result[field] = data[field];
            return result;
        }, {});
        if (Object.keys(payload).length === 0) throw new ApiError(`At least one of ${fields.join(", ")} is required`);
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

    private static competencyPayload(input: unknown, creating = false) {
        const payload = this.pick(input, this.COMPETENCY_FIELDS);
        if (creating || payload.competency !== undefined) this.validateText(payload.competency, "competency");
        if (creating || payload.competency_category_id !== undefined) {
            payload.competency_category_id = this.parseId(payload.competency_category_id, "competency_category_id");
        }
        for (const field of ["type_person_id", "func_unit_id", "position_level_id"]) {
            if (payload[field] !== undefined) payload[field] = this.parseId(payload[field], field, true);
        }
        if (payload.expected_score !== undefined) {
            payload.expected_score = parseScore(payload.expected_score, "expected_score", 127, true);
        }
        return payload;
    }

    private static behaviorPayload(input: unknown, creating = false) {
        const payload = this.pick(input, this.BEHAVIOR_FIELDS);
        if (creating || payload.competency_id !== undefined) {
            payload.competency_id = this.parseId(payload.competency_id, "competency_id");
        }
        if (payload.description !== undefined && payload.description !== null && typeof payload.description !== "string") {
            throw new ApiError("description must be a string or null");
        }
        return payload;
    }
}

export default CompetentService;
