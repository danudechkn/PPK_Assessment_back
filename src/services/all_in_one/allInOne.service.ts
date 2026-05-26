import db from "../../models/it-center/index";
import { Op } from "sequelize";

export class AllInOneService {
  static async index(query: Record<string, any>) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 10;
    const offset = (page - 1) * limit;
    const { rows, count } = await db.AllInOne.findAndCountAll({
      where: { status: 2 },
      limit,
      offset,
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
}
