import db from "../../models/product";
import { ApiError } from "../../utils/api-response.util";
import {
  PaginationQuery,
  PaginationMeta,
  PaginatedResult,
} from "../../utils/pagination.util";
import { CompetentHelper } from "./helper/competent.helper";
import CategoriesService from "./categories.service";
import {
  getFuncUnit,
  getOfficeGroup,
  getFuncUnitMap,
  getOfficeGroupMap,
} from "./helper/getDataPPK";

export { PaginationQuery, PaginationMeta, PaginatedResult };

class CompetentService {
  // ==========================================
  // Competencies
  // ==========================================

  static async getAllCompetent(query: PaginationQuery = {}) {
    const { page, limit, offset } = CompetentHelper.parsePagination(query);

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
        {
          model: db.PositionLevel,
          as: "position_level",
          attributes: ["id", "name"],
        },
      ],
    });

    const officeIds = [
      ...new Set(rows.map((r: any) => r.type_person_id).filter(Boolean)),
    ] as number[];
    const funcUnitIds = [
      ...new Set(rows.map((r: any) => r.func_unit_id).filter(Boolean)),
    ] as number[];

    const [officeMap, funcUnitMap] = await Promise.all([
      getOfficeGroupMap(officeIds),
      getFuncUnitMap(funcUnitIds),
    ]);

    const formattedData = rows.map((row: any) => ({
      id: row.id,
      competency_category_id: row.competency_category_id,
      type_person_id: row.type_person_id,
      func_unit_id: row.func_unit_id,
      position_level_id: row.position_level_id,
      competency: row.competency,
      expected_score: row.expected_score,
      status: row.status,
      category_name: row.category?.name ?? null,
      category_id: row.competency_category_id,
      position_level_name: row.position_level?.name ?? null,
      office_name: officeMap.get(row.type_person_id) ?? null,
      func_unit_name: funcUnitMap.get(row.func_unit_id) ?? null,
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  static async getCompetentById(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new ApiError("id must be a positive integer");
    const result = await db.Competencies.findByPk(id);
    if (!result) throw new ApiError("Competency not found", 404);
    return result;
  }

  static async getCompetenciesByCategory(categoryId: number) {
    await CategoriesService.getCategoryById(categoryId);
    return await db.Competencies.findAll({
      where: { competency_category_id: categoryId },
    });
  }

  static async createCompetent(body: unknown) {
    const sanitizedData = CompetentHelper.getItems(body, 20).map((item) =>
      CompetentHelper.competencyPayload(item, true),
    );
    return await db.Competencies.bulkCreate(sanitizedData);
  }

  static async updateCompetent(id: number, data: unknown) {
    const competent = await this.getCompetentById(id);
    return await competent.update(CompetentHelper.competencyPayload(data));
  }

  static async deleteCompetent(id: number) {
    const competent = await this.getCompetentById(id);
    await competent.destroy();
    return { message: "Competent deleted successfully" };
  }

  static async getCompetencyByPosAndFuncAndLevel(
    offID: number,
    funcId: number,
    // levelId: number,
  ) {
    // 1. ดึงข้อมูล Competencies ทั้งหมดที่ตรงเงื่อนไขพร้อม JOIN Category
    const list = await db.Competencies.findAll({
      where: {
        type_person_id: offID,
        func_unit_id: funcId,
        // type_person_id: levelId,
        status: "Y",
      },
      attributes: [
        "id",
        "competency_category_id",
        "competency",
        "expected_score",
      ],
      include: [
        {
          model: db.CompetencyCategories,
          attributes: ["id", "name"],
          as: "category",
        },
      ],
      order: [
        ["competency_category_id", "ASC"],
        ["id", "ASC"],
      ],
    });
    // 2. จัดกลุ่ม (Group) ตาม category_id ด้วย Map (ทำงานเร็วระดับ O(N))
    const categoryMap = new Map<
      number,
      {
        category_id: number;
        category_name: string;
        competencies: Array<{
          id: number;
          competency: string;
          expected_score: number;
        }>;
      }
    >();
    for (const item of list as any[]) {
      const catId = item.competency_category_id;
      const catName = item.category?.name ?? "";
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          category_id: catId,
          category_name: catName,
          competencies: [],
        });
      }
      categoryMap.get(catId)!.competencies.push({
        id: item.id,
        competency: item.competency,
        expected_score: item.expected_score,
      });
    }
    // 3. แปลงผลลัพธ์จาก Map เป็น Array ส่งกลับ
    return Array.from(categoryMap.values());
  }
}

export default CompetentService;
