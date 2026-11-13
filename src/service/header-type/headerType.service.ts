import { Op } from "sequelize";
import dbUser from "../../models/centralusers";
import { ApiError } from "../../utils/api-response.util";
import {
  CreateHeaderTypeInput,
  QueryHeaderTypeInput,
  UpdateHeaderTypeInput,
} from "../../validators/headerType.validator";

export class HeaderTypeService {
  /**
   * สร้างประเภทหัวหน้าใหม่
   */
  static async create(input: CreateHeaderTypeInput) {
    const { name_th, name_en, flag_status = "A" } = input;

    // ตรวจสอบชื่อซ้ำ
    const existing = await dbUser.HeaderType.findOne({
      where: {
        name_th: name_th.trim(),
      },
    });

    if (existing) {
      if (existing.flag_status === "A") {
        throw new ApiError(`ประเภทหัวหน้า '${name_th}' มีอยู่ในระบบแล้ว`, 409);
      }
      await existing.update({
        name_en: name_en ? name_en.trim() : existing.name_en,
        flag_status: "A",
      });
      return existing;
    }

    const created = await dbUser.HeaderType.create({
      name_th: name_th.trim(),
      name_en: name_en ? name_en.trim() : null,
      flag_status,
    });

    return created;
  }

  /**
   * ดึงรายการประเภทหัวหน้าทั้งหมด พร้อม pagination และ filter
   */
  static async findAll(query: QueryHeaderTypeInput) {
    const { page = 1, limit = 10, search, flag_status } = query;
    const offset = (Math.max(1, page) - 1) * limit;

    const where: Record<string | symbol, unknown> = {};

    if (flag_status !== undefined && flag_status.trim() !== "") {
      where.flag_status = flag_status.trim();
    }

    if (search !== undefined && search.trim() !== "") {
      const keyword = search.trim();
      where[Op.or] = [
        { name_th: { [Op.like]: `%${keyword}%` } },
        { name_en: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await dbUser.HeaderType.findAndCountAll({
      where,
      limit,
      offset,
      order: [["id", "ASC"]],
    });

    return {
      rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  /**
   * ดึงประเภทหัวหน้าทั้งหมดที่ Active สำหรับแสดงผลใน Dropdown / Select
   */
  static async getAllActive() {
    const records = await dbUser.HeaderType.findAll({
      where: { flag_status: "A" },
      order: [["id", "ASC"]],
    });

    return records;
  }

  /**
   * ดึงข้อมูลประเภทหัวหน้ารายการเดียว
   */
  static async show(id: number) {
    const record = await dbUser.HeaderType.findOne({ where: { id } });
    if (!record) {
      throw new ApiError(`ไม่พบข้อมูลประเภทหัวหน้ารหัส ${id}`, 404);
    }
    return record;
  }

  /**
   * ปรับปรุงข้อมูลประเภทหัวหน้า
   */
  static async update(id: number, input: UpdateHeaderTypeInput) {
    const record = await dbUser.HeaderType.findOne({ where: { id } });
    if (!record) {
      throw new ApiError(`ไม่พบข้อมูลประเภทหัวหน้ารหัส ${id}`, 404);
    }

    if (input.name_th !== undefined) {
      const targetName = input.name_th.trim();
      const duplicate = await dbUser.HeaderType.findOne({
        where: {
          id: { [Op.ne]: id },
          name_th: targetName,
          flag_status: "A",
        },
      });

      if (duplicate) {
        throw new ApiError(`ชื่อประเภทหัวหน้า '${targetName}' ซ้ำกับรายการอื่น`, 409);
      }
    }

    await record.update({
      ...(input.name_th !== undefined && { name_th: input.name_th.trim() }),
      ...(input.name_en !== undefined && {
        name_en: input.name_en ? input.name_en.trim() : null,
      }),
      ...(input.flag_status !== undefined && { flag_status: input.flag_status.trim() }),
    });

    return record;
  }

  /**
   * ลบประเภทหัวหน้า
   */
  static async delete(id: number, hardDelete = false) {
    const record = await dbUser.HeaderType.findOne({ where: { id } });
    if (!record) {
      throw new ApiError(`ไม่พบข้อมูลประเภทหัวหน้ารหัส ${id}`, 404);
    }

    // ตรวจสอบว่ามีการนำไปใช้งานใน header_setting หรือไม่
    const inUseCount = await dbUser.HeaderSetting.count({
      where: { header_type_id: id, flag_status: "A" },
    });

    if (inUseCount > 0) {
      throw new ApiError(
        `ไม่สามารถลบประเภทหัวหน้านี้ได้ เนื่องจากมีการผูกใช้งานอยู่ในการตั้งค่าหัวหน้า ${inUseCount} รายการ`,
        400,
      );
    }

    if (hardDelete) {
      await record.destroy();
      return { id, deleted: true, mode: "hard" };
    }

    await record.update({ flag_status: "I" });
    return { id, deleted: true, mode: "soft" };
  }
}
