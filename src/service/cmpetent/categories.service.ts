import db from "../../models/product";
import { ApiError } from "../../utils/api-response.util";
import { PaginationQuery } from "../../utils/pagination.util";
import { CompetentHelper } from "./helper/competent.helper";

class CategoriesService {
  static async getAllCategories(query: PaginationQuery = {}) {
    const { page, limit, offset } = CompetentHelper.parsePagination(query);

    const { rows, count } = await db.CompetencyCategories.findAndCountAll({
      limit,
      offset,
      order: [["id", "ASC"]],
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
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
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new ApiError("id must be a positive integer");
    const result = await db.CompetencyCategories.findByPk(id);
    if (!result) throw new ApiError("Category not found", 404);
    return result;
  }

  static async createCategory(body: unknown) {
    const sanitizedData = CompetentHelper.getItems(body, 20).map((item) => {
      const payload = CompetentHelper.pick(item, CompetentHelper.CATEGORY_FIELDS);
      CompetentHelper.validateText(payload.name, "name", 255);
      return payload;
    });

    return await db.CompetencyCategories.bulkCreate(sanitizedData);
  }

  static async updateCategory(id: number, data: unknown) {
    const category = await this.getCategoryById(id);
    const payload = CompetentHelper.pick(data, CompetentHelper.CATEGORY_FIELDS);
    if (payload.name !== undefined)
      CompetentHelper.validateText(payload.name, "name", 255);
    return await category.update(payload);
  }

  static async deleteCategory(id: number) {
    const category = await this.getCategoryById(id);
    await category.destroy();
    return { message: "Category deleted successfully" };
  }
}

export default CategoriesService;
