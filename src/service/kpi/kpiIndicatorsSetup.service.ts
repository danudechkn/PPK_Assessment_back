import { Op } from "sequelize";
import db from "../../models/product";

export class KpiIndicatorsService {
  /**
   * ดึงรายการตัวชี้วัด KPI ทั้งหมด (รองรับค้นหา, กรองสถานะ, Pagination และดึงแบบทั้งหมด)
   */
  static async index(query?: any) {
    const isAll = query?.all === "true" || query?.all === true;
    const page = Number(query?.page) || 1;
    const limit = isAll ? undefined : Number(query?.limit) || 10;
    const offset = isAll ? undefined : (page - 1) * (limit || 10);

    const where: any = {};

    // กรองสถานะ (ถ้าไม่ระบุค่าเริ่มต้นเป็น 'Y', ถ้าระบุ 'ALL' จะดึงทั้งหมด)
    if (query?.status && query.status !== "ALL") {
      where.status = query.status;
    } else if (!query?.status) {
      // where.status = "Y";
    }

    // ค้นหาตามชื่อตัวชี้วัด
    const keyword = query?.keyword || query?.search;
    if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
      where.name = { [Op.like]: `%${keyword.trim()}%` };
    }

    const includeOptions: any[] = [];
    if (query?.include_levels === "true" || query?.include_levels === true) {
      includeOptions.push({
        model: db.KpiScoreLevels,
        as: "score_levels",
      });
    }

    const result = await db.KpiIndicators.findAndCountAll({
      where,
      include: includeOptions,
      order: [["id", "ASC"]],
      ...(limit !== undefined ? { limit, offset } : {}),
    });

    return {
      data: result.rows,
      total: result.count,
      page: isAll ? 1 : page,
      limit: isAll ? result.count : limit,
    };
  }

  /**
   * สร้างตัวชี้วัด KPI (รองรับทั้ง Array, { kpi_items: [...] }, หรือ Object เดี่ยว)
   */
  static async create(body: any) {
    let items = body?.kpi_items;
    if (!items && Array.isArray(body)) {
      items = body;
    } else if (!items && body?.name) {
      items = [body];
    }

    if (!items || !items.length) {
      throw new Error("kpi_items is required");
    }

    const payload_array = items.map((item: any) => {
      const name = typeof item === "string" ? item.trim() : item?.name?.trim();
      if (!name) {
        throw new Error("Indicator name is required");
      }
      return {
        name,
        status: item?.status || "Y",
      };
    });

    const created = await db.KpiIndicators.bulkCreate(payload_array);
    return created;
  }

  /**
   * ดูรายละเอียดตัวชี้วัดตาม ID พร้อมแนบระดับคะแนน (Score Levels)
   */
  static async show(id: number) {
    if (!id) throw new Error("id is required");

    const data = await db.KpiIndicators.findOne({
      where: { id },
      include: [
        {
          model: db.KpiScoreLevels,
          as: "score_levels",
        },
      ],
      order: [
        [{ model: db.KpiScoreLevels, as: "score_levels" }, "score", "ASC"],
      ],
    });

    if (!data) {
      throw new Error("KPI indicator not found");
    }

    return data;
  }

  /**
   * อัปเดตข้อมูลตัวชี้วัด (ยืดหยุ่น รองรับอัปเดต name หรือ status หรือทั้งคู่)
   */
  static async update(id: number, body: any) {
    if (!id) throw new Error("id is required");

    const updateData: any = {};
    if (body?.name !== undefined && body.name !== null) {
      const trimmedName = String(body.name).trim();
      if (!trimmedName) throw new Error("name cannot be empty");
      updateData.name = trimmedName;
    }

    if (body?.status !== undefined && body.status !== null) {
      updateData.status = String(body.status).trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("At least name or status is required to update");
    }

    const [affected] = await db.KpiIndicators.update(updateData, {
      where: { id },
    });

    if (affected === 0) {
      // ตรวจสอบว่ามี id นี้อยู่จริงหรือไม่
      const exists = await db.KpiIndicators.findByPk(id);
      if (!exists) throw new Error("KPI indicator not found");
    }

    return true;
  }

  /**
   * ลบตัวชี้วัด (Soft delete เป็น status: 'N')
   */
  static async destroy(id: number) {
    if (!id) {
      throw new Error("id is required");
    }

    const indicator = await db.KpiIndicators.findByPk(id);
    if (!indicator) {
      throw new Error("KPI indicator not found");
    }

    await db.KpiIndicators.destroy({ where: { id } });
    return true;
  }
}
