import { Op } from "sequelize";
import db from "../models/product";


class CompetentService {
    private static readonly CATEGORY_FIELDS = ["name", "status"];
    private static readonly COMPETENCY_FIELDS = ["competency_category_id", "type_person_id", "func_unit_id", "position_level_id", "competency", "expected_score", "status"];

    // --- Competencies_Categories ---

    static async getAllCategories() {
        return await db.CompetencyCategories.findAll();
    }

    static async getCategoriesFull() {
        return await db.CompetencyCategories.findAll({
            include: [{
                model: db.Competencies,
                as: "competencies",
                include: [{
                    model: db.Behavior,
                    as: "behaviors"
                }]
            }]
        });
    }

    static async createCategory(body: any) {
        const { dataArray } = body;
        if (!dataArray || !Array.isArray(dataArray)) {
            throw new Error("dataArray is required and must be an array");
        }
        if (dataArray.length > 20) {
            throw new Error("dataArray must be less than or equal to 20 items");
        }

        const sanitizedData = dataArray.map((item: any) => {
            if (!item.name || typeof item.name !== "string") {
                throw new Error("name is required for all items");
            }
            return this.pick(item, this.CATEGORY_FIELDS);
        });

        return await db.CompetencyCategories.bulkCreate(sanitizedData);
    }

    static async updateCategory(id: number, data: any) {
        const category = await db.CompetencyCategories.findByPk(id);
        if (!category) throw new Error("Category not found");

        if (data.name !== undefined && (!data.name || typeof data.name !== "string")) {
            throw new Error("name must be a non-empty string");
        }
        data = this.pick(data, this.CATEGORY_FIELDS);
        if (data.status === "") data.status = null;

        return await category.update(data);
    }

    static async deleteCategory(id: number) {
        const competency = await db.CompetencyCategories.findByPk(id);
        if (!competency) throw new Error("Competency not found");
        await competency.destroy();
        return { message: "Competency deleted successfully" };
    }
    // --- Competencies ---

    static async getAllCompetent() {
        return await db.Competencies.findAll();
    }

    static async getCompetenciesByCategory(categoryId: number) {
        return await db.Competencies.findAll({ where: { competency_category_id: categoryId } });
    }

    static async createCompetent(body: any) {
        const { dataArray } = body;
        if (!dataArray || !Array.isArray(dataArray)) {
            throw new Error("dataArray is required and must be an array");
        }
        if (dataArray.length > 3) {
            throw new Error("You can only create up to 3 items at a time");
        }

        const intFields = ['competency_category_id', 'type_person_id', 'func_unit_id', 'position_level_id', 'expected_score'];
        const sanitizedData = dataArray.map((item: any) => {
            if (!item.competency || typeof item.competency !== "string") {
                throw new Error("competency is required for all items");
            }
            if (!Number.isInteger(Number(item.competency_category_id)) || Number(item.competency_category_id) <= 0) {
                throw new Error("competency_category_id is required for all items");
            }
            const sanitized = this.pick(item, this.COMPETENCY_FIELDS);
            intFields.forEach(field => {
                if (sanitized[field] === "") sanitized[field] = null;
            });
            return sanitized;
        });

        return await db.Competencies.bulkCreate(sanitizedData);
    }

    static async updateCompetent(id: number, data: any) {
        const competent = await db.Competencies.findByPk(id);
        if (!competent) throw new Error("Competent not found");
        return await competent.update(this.pick(data, this.COMPETENCY_FIELDS));
    }

    static async deleteCompetent(id: number) {
        const competent = await db.Competencies.findByPk(id);
        if (!competent) throw new Error("Competent not found");
        await competent.destroy();
        return { message: "Competent deleted successfully" };
    }



    // --- Behavior ---

    static async getBehavior() {
        return await db.Behavior.findAll({
        });
    }

    static async getBehaviorsByCompetency(competencyId: number) {
        return await db.Behavior.findAll({ where: { competency_id: competencyId } });
    }

    static async createBehavior(body: any) {
        const { dataArray } = body;
        if (!dataArray || !Array.isArray(dataArray)) {
            throw new Error("dataArray is required and must be an array");
        }
        if (dataArray.length > 20) {
            throw new Error("dataArray must be less than or equal to 20 items");
        }

        dataArray.forEach((item: any) => {
            if (!item.competency_id) {
                throw new Error("competency_id is required for all items");
            }
        });

        return await db.Behavior.bulkCreate(dataArray);
    }

    static async updateBehavior(id: number, data: any) {
        if (!Number.isInteger(id) || id <= 0) throw new Error("Behavior id must be a positive integer");
        const behavior = await db.Behavior.findByPk(id);
        if (!behavior) throw new Error("Behavior not found");
        const payload = this.pick(data, ["competency_id", "description", "status"]);
        if (Object.keys(payload).length === 0) {
            throw new Error("At least one of competency_id, description, or status is required");
        }
        return await behavior.update(payload);
    }

    static async deleteBehavior(id: number) {
        const behavior = await db.Behavior.findByPk(id);
        if (!behavior) throw new Error("Behavior not found");
        await behavior.destroy();
        return { message: "Behavior deleted successfully" };
    }

    private static pick(input: Record<string, unknown>, fields: string[]) {
        return fields.reduce((result: Record<string, unknown>, field) => {
            if (input[field] !== undefined) result[field] = input[field];
            return result;
        }, {});
    }
}

export default CompetentService;
