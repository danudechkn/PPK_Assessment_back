import db from "../../models/product";
import { ApiError } from "../../utils/api-response.util";
import { PaginationQuery } from "../../utils/pagination.util";
import { CompetentHelper } from "./helper/competent.helper";
import CompetentService from "./competent.service";

class BehaviorsService {
  static async getBehavior(query: PaginationQuery = {}) {
    const { page, limit, offset } = CompetentHelper.parsePagination(query);

    const { rows, count } = await db.Behavior.findAndCountAll({
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

  static async getBehaviorById(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new ApiError("id must be a positive integer");
    const result = await db.Behavior.findByPk(id);
    if (!result) throw new ApiError("Behavior not found", 404);
    return result;
  }

  static async getBehaviorsByCompetency(competencyId: number) {
    await CompetentService.getCompetentById(competencyId);
    return await db.Behavior.findAll({
      where: { competency_id: competencyId },
    });
  }

  static async createBehavior(body: unknown) {
    const payload = CompetentHelper.getItems(body, 20).map((item) =>
      CompetentHelper.behaviorPayload(item, true),
    );
    return await db.Behavior.bulkCreate(payload);
  }

  static async updateBehavior(id: number, data: unknown) {
    const behavior = await this.getBehaviorById(id);
    return await behavior.update(CompetentHelper.behaviorPayload(data));
  }

  static async deleteBehavior(id: number) {
    const behavior = await this.getBehaviorById(id);
    await behavior.destroy();
    return { message: "Behavior deleted successfully" };
  }
}

export default BehaviorsService;
